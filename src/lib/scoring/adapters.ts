import { Block } from "../../utils/timeBlocks";
import { LogicBlock } from "./types";

export function toLogicBlocks(blocks: Block[]): LogicBlock[] {
  return blocks.map((b) => ({
    start: b.startTime,
    end: b.endTime,
    completed: b.completed,
  }));
}
