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
  breakdown: Record<string, number>,
  categoryMap: Record<string, { label: string; color: string }>
): TimeDistributionItem[] {
  const sorted = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1]);

  const top4 = sorted.slice(0, 4);
  const rest = sorted.slice(4);

  const result: TimeDistributionItem[] = top4.map(
    ([categoryId, minutes]) => ({
      id: categoryId, // 👈 UNIQUE
      label: categoryMap[categoryId]?.label ?? "Uncategorized",
      minutes,
      color: categoryMap[categoryId]?.color ?? "#6B7280",
    })
  );

  const otherMinutes = rest.reduce(
    (sum, [, minutes]) => sum + minutes,
    0
  );

  if (otherMinutes > 0) {
    result.push({
      id: "__other__", // 👈 GUARANTEED UNIQUE
      label: "Other",
      minutes: otherMinutes,
      color: "#6B7280",
    });
  }

  return result;
}

