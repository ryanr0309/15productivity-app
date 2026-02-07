import { ClassifiedBlock, GoalAlignment } from "../../types/productivity";

const LOGGING_CREDIT = 0.2;

const GOAL_MULTIPLIER: Record<GoalAlignment, number> = {
  strong: 1.5,
  partial: 1.2,
  none: 1.0,
};

export function scoreBlock(block: ClassifiedBlock): number {
  const loggingCredit = block.wasLogged ? LOGGING_CREDIT : 0;

  if (block.classification !== "productive") {
    return loggingCredit;
  }

  return (
    loggingCredit +
    1 * GOAL_MULTIPLIER[block.goalAlignment]
  );
}

export function scoreDay(blocks: ClassifiedBlock[]) {
  const earned = blocks.reduce(
    (sum, b) => sum + scoreBlock(b),
    0
  );

  console.log("Earned", earned);
  const maxPossible =
    blocks.length * (1.5 + LOGGING_CREDIT);
console.log("Max Possible", maxPossible);
console.log((earned / maxPossible) * 100)

  return {
    earned,
    maxPossible,
    normalized: earned / maxPossible,
    percent: Math.round((earned / maxPossible) * 100),
  };
}
