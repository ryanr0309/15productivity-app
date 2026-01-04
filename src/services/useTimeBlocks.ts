import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { normalizeBlocks } from "../utils/blocks";
import { Block } from "../utils/timeBlocks";
import { getCurrentBlockIndex as getCurrentBlockIndexUtil } from "../utils/timeBlocks";
import { ensureTimeBlocksExist } from "../utils/blocks";

export function useTimeBlocks(openDay: any | null) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dayReady, setDayReady] = useState(false);
  const loadedDayIdRef = useRef<string | null>(null);
  const pendingSaveRef = useRef<Set<string>>(new Set());


  function getCurrentBlockIndex() {
    return getCurrentBlockIndexUtil(blocks);
  }

async function loadBlocks({ showSkeleton = false } = {}) {
  if (!openDay?.id) return;

  const isFirstLoadForDay =
    loadedDayIdRef.current !== openDay.id;

  if (showSkeleton || isFirstLoadForDay) {
    setDayReady(false);
  }

  // 🔑 ENSURE blocks exist up to now
  await ensureTimeBlocksExist(openDay);

  const { data, error } = await supabase
    .from("time_blocks")
    .select("*")
    .eq("day_id", openDay.id)
    .order("start_time");

  if (error) {
    console.error("Failed to load time blocks", error);
    setDayReady(true);
    return;
  }

  setBlocks(prev => {
    const incoming = normalizeBlocks(data ?? []);

    return incoming.map(serverBlock => {
      if (pendingSaveRef.current.has(serverBlock.id)) {
        const local = prev.find(b => b.id === serverBlock.id);
        return local ?? serverBlock;
      }
      return serverBlock;
    });
  });

  loadedDayIdRef.current = openDay.id;
  setDayReady(true);
}



  async function saveTimeBlock({
    blockId,
    categoryId,
    description,
  }: {
    blockId: string;
    categoryId: string | null;
    description: string;
  }) {
    pendingSaveRef.current.add(blockId);

    // optimistic update
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, categoryId, description, completed: true }
          : block
      )
    );

    const { error } = await supabase
      .from("time_blocks")
      .update({
        category_id: categoryId,
        description,
        status: "logged",
      })
      .eq("id", blockId);

    if (error) {
      console.error("Failed to save time block", error);
      return;
    }

    supabase.functions.invoke("classify-time-block", {
      body: { blockId },
    });
  }

  // initial + dependency-based load
useEffect(() => {
  loadBlocks({ showSkeleton: true });
}, [openDay?.id, openDay?.estimated_sleep_time]);

useEffect(() => {
  if (!openDay?.id) return;

  const interval = setInterval(() => {
    loadBlocks({ showSkeleton: false });
  }, 60_000); // every minute

  return () => clearInterval(interval);
}, [openDay?.id]);

  return {
    blocks,
    dayReady,
    saveTimeBlock,
    getCurrentBlockIndex,
    reloadTimeBlocks: () => loadBlocks({ showSkeleton: false }), // 🔑 THIS IS THE KEY
  };
}
