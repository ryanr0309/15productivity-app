import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { normalizeToInterval } from "../utils/time";
import { ensureTimeBlocksExist, normalizeBlocks } from "../utils/blocks";
import { Block } from "../utils/timeBlocks";
import { getCurrentBlockIndex as getCurrentBlockIndexUtil } from "../utils/timeBlocks";
import { useRef } from "react";

export function useTimeBlocks(openDay: any | null) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dayReady, setDayReady] = useState(false);
  const loadedDayIdRef = useRef<string | null>(null);

  function getCurrentBlockIndex() {
  return getCurrentBlockIndexUtil(blocks);
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
    // 1️⃣ Optimistic update
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              categoryId,
              description,
              completed: true,
            }
          : block
      )
    );

    // 2️⃣ Persist
    await supabase
      .from("time_blocks")
      .update({
        category_id: categoryId,
        description,
        status: "logged",
      })
      .eq("id", blockId);
  }

useEffect(() => {
  if (!openDay) {
    setBlocks([]);
    setDayReady(false);
    loadedDayIdRef.current = null;
    return;
  }

  // ✅ Blocks already loaded for this day → do nothing
  if (loadedDayIdRef.current === openDay.id) {
    return;
  }

  async function loadBlocks() {
    setDayReady(false);

    await ensureTimeBlocksExist(openDay);

    const { data } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("day_id", openDay.id)
      .order("start_time");

    setBlocks(normalizeBlocks(data ?? []));
    setDayReady(true);

    // 🔑 mark blocks as loaded for this day
    loadedDayIdRef.current = openDay.id;
  }

  loadBlocks();
}, [openDay]);

  return {
    blocks,
    dayReady,
    saveTimeBlock,
    getCurrentBlockIndex // 👈 expose intent
  };
}
