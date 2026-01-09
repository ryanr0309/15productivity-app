import { colors } from "../../constants/colors";

type TimeDistributionItem = {
  id: string;        // 👈 NEW
  label: string;
  minutes: number;
  color: string;
};


/* ---------- OUTCOME NORMALIZER ---------- */

export function normalizeOutcomeBreakdown(
  breakdown: {
    productive: number;
    neutral: number;
    unproductive: number;
  }
): TimeDistributionItem[] {
  return [
    {
      id: "productive",
      label: "Productive",
      minutes: breakdown.productive,
      color: colors.accent,
    },
    {
      id: "neutral",
      label: "Neutral",
      minutes: breakdown.neutral,
      color: "#9CA3AF",
    },
    {
      id: "unproductive",
      label: "Unproductive",
      minutes: breakdown.unproductive,
      color: "#EF4444",
    },
  ].filter(item => item.minutes > 0);
}


/* ---------- CATEGORY NORMALIZER ---------- */

export function normalizeCategoryBreakdown(
  breakdown: {
    label: string;
    color: string;
    minutes: number;
  }[]
) {
  const totalMinutes = breakdown.reduce(
    (sum, item) => sum + item.minutes,
    0
  );

  return breakdown.map(item => ({
    label: item.label,
    minutes: item.minutes,
    color: item.color,
    percent:
      totalMinutes > 0
        ? Math.round((item.minutes / totalMinutes) * 100)
        : 0,
  }));
}


