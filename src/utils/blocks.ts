import { Block } from "./timeBlocks";

export function getCurrentBlockIndex(blocks: Block[]) {
  const now = new Date();

  for (let i = 0; i < blocks.length; i++) {
    const start = new Date(blocks[i].startISO);
    const end = new Date(blocks[i].endISO);

    if (now >= start && now < end) {
      return i;
    }
  }

  return null;
}

export function getCurrentBlock(blocks: Block[]) {
  const index = getCurrentBlockIndex(blocks);
  return index !== null ? blocks[index] : null;
}
