export function normalizeBlocks(blocks: any[]) {
  const now = new Date();

  return blocks.map((block) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);

    if (block.status === "locked") return block;

    if (end <= now && block.status === "upcoming") {
      return { ...block, status: "missed" };
    }

    if (start <= now && now < end) {
      return { ...block, status: "active" };
    }

    return block;
  });
}

export function getCurrentBlock(blocks: any[]) {
  return blocks.find((b) => b.status === "active") ?? null;
}
