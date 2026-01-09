import { useMemo } from "react";
import { CATEGORY_COLORS } from "../constants/categoryColors";

export function useAvailableColors(
  categories: { color: string }[],
  habits: { color: string }[]
) {
  return useMemo(() => {
    const used = new Set([
      ...categories.map(c => c.color),
      ...habits.map(h => h.color),
    ]);

    return CATEGORY_COLORS.filter(
      color => !used.has(color)
    );
  }, [categories, habits]);
}
