import { Block } from "../../utils/timeBlocks";
import { ClassifiedBlock } from "../../types/productivity";

export function toClassifiedBlock(block: Block): ClassifiedBlock {
  const durationMinutes =
    (block.endTime.getTime() - block.startTime.getTime()) / 60000;

  return {
    id: block.id,
    startTime: block.startTime.toISOString(),
    durationMinutes,

    classification: block.classification,
    goalAlignment: block.goalAlignment,

    wasLogged: block.completed,
  };
}
