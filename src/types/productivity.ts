export type Classification =
  | "productive"
  | "neutral"
  | "unproductive";

export type GoalAlignment =
  | "strong"
  | "partial"
  | "none";

export type ClassifiedBlock = {
  id: string;
  startTime: string;   // ISO or HH:mm
  durationMinutes: number;

  classification: Classification;
  goalAlignment: GoalAlignment;

  // scoring helpers
  wasLogged: boolean;
};
