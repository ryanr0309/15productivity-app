// utils/dateToHHMM.ts
export function dateToHHMM(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;

  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    // Helps you catch bad data early
    throw new Error(`dateToHHMM: invalid date input: ${String(input)}`);
  }

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}