import { Block } from "../../utils/timeBlocks";
import { ClassifiedBlock } from "../../types/productivity";

export function toClassifiedBlock(block: Block): ClassifiedBlock {
  const durationMinutes =
    (block.endTime.getTime() - block.startTime.getTime()) / 60000;

  const wasLogged =
    block.status === "logged" &&
    Boolean(block.categoryId) &&
    Boolean(block.description);

  return {
    id: block.id,
    startTime: block.startTime.toISOString(),
    durationMinutes,

    classification: block.classification ?? "neutral",
    goalAlignment: block.goalAlignment ?? null,

    wasLogged,
  };
}
