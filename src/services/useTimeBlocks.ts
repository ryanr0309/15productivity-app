import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { normalizeBlocks } from "../utils/blocks";
import { Block } from "../utils/timeBlocks";
import { getCurrentBlockIndex as getCurrentBlockIndexUtil } from "../utils/timeBlocks";
import { ensureTimeBlocksExist } from "../utils/blocks";

export function useTimeBlocks(openDay: any | null, initialBlocks: Block[] = [], onReady?: () => void
) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [dayReady, setDayReady] = useState(initialBlocks.length > 0);


  const loadedDayIdRef = useRef<string | null>(null);
  const ensuredDayRef = useRef<string | null>(null);
  const pendingSaveRef = useRef<Set<string>>(new Set());
  const loadingRef = useRef(false);

  function getCurrentBlockIndex() {
    return getCurrentBlockIndexUtil(blocks);
  }

  async function loadBlocks({ showSkeleton = false } = {}) {
    if (!openDay?.id) return;
    if (loadingRef.current) return;

    loadingRef.current = true;

    const isFirstLoadForDay =
      loadedDayIdRef.current !== openDay.id;

    const hasBlocksForThisDay =
  loadedDayIdRef.current === openDay.id && blocks.length > 0;

if ((showSkeleton || isFirstLoadForDay) && !hasBlocksForThisDay) {
  setDayReady(false);
}


    try {
      // ✅ ensure ONCE per day
      if (ensuredDayRef.current !== openDay.id) {
        await ensureTimeBlocksExist(openDay);
        ensuredDayRef.current = openDay.id;
      }

      const { data, error } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("day_id", openDay.id)
        .order("start_time");

      if (error) {
        console.error("Failed to load time blocks", error);
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
    } finally {
      loadingRef.current = false;
    }
  }

async function saveTimeBlock({
  blockId,
  categoryId,
  categoryLabel,
  categoryColor,
  description,
}: {
  blockId: string;
  categoryId: string | null;
  categoryLabel: string | null;
  categoryColor: string | null;
  description: string;
}) {
  pendingSaveRef.current.add(blockId);

  const currentBlock = blocks.find(b => b.id === blockId);
  if (!currentBlock) {
    pendingSaveRef.current.delete(blockId);
    return;
  }

  const nextDescription = (description ?? "").trim();
  const prevDescription = (currentBlock.description ?? "").trim();

  const isEdit =
    currentBlock.categoryId !== categoryId ||
    currentBlock.categoryLabel !== categoryLabel ||
    currentBlock.categoryColor !== categoryColor ||
    prevDescription !== nextDescription;

  if (!isEdit) {
    pendingSaveRef.current.delete(blockId);
    return;
  }

  if ((currentBlock.edit_count ?? 0) >= 2) {
    console.warn("Block is locked");
    pendingSaveRef.current.delete(blockId);
    return;
  }

  // 🟢 Optimistic update
  setBlocks(prev =>
    prev.map(block =>
      block.id === blockId
        ? {
            ...block,
            categoryId,
            categoryLabel,
            categoryColor,
            description: nextDescription,
            completed: true,
            edit_count: (block.edit_count ?? 0) + 1,
          }
        : block
    )
  );

  // 🟡 DB update
  const { error } = await supabase
    .from("time_blocks")
    .update({
      category_id: categoryId,
      category_label: categoryLabel,
      category_color: categoryColor,
      description: nextDescription,
      status: "logged",
      edit_count: (currentBlock.edit_count ?? 0) + 1,
    })
    .eq("id", blockId)
    .lt("edit_count", 1);

  pendingSaveRef.current.delete(blockId);

  if (error) {
    console.error("Failed to save time block", error);
    return;
  }

  supabase.functions.invoke("classify-time-block", {
    body: { blockId },
  });
}




useEffect(() => {
  if (!openDay?.id) return;
  if (openDay.end_time) return;

  const interval = setInterval(() => {
    ensureTimeBlocksExist(openDay);
  }, 5 * 60 * 1000); // every 5 minutes

  return () => clearInterval(interval);
}, [openDay]);

useEffect(() => {
  if (openDay?.day_phase === "locked") {
    loadBlocks();
  }
}, [openDay?.day_phase]);



  return {
    blocks,
    dayReady,
    saveTimeBlock,
    getCurrentBlockIndex,
  };
}

