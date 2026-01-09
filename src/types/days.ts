export type Day = {
  id: string;                 // uuid
  user_id: string;            // uuid

  status: string;             // text (e.g. "open" | "closed" if you later constrain it)

  start_time: string;         // timestamptz (ISO string)
  end_time: string | null;    // timestamptz | null

  interval_minutes: number;   // int4
  estimated_sleep_time: string | null; // timestamptz | null

  auto_closed: boolean;       // bool
  closed_reason: string | null; // text

  day_phase: string | null;   // text (e.g. "active", "sleep", etc.)

  created_at: string;         // timestamptz
  updated_at: string;         // timestamptz
};
