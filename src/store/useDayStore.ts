import { create } from "zustand";
import { supabase } from "../lib/supabase";

type DayStore = {
  openDay: any | null;
  blocks: any[];
  refreshDay: () => Promise<void>;
  clearDay: () => void;
};

export const useDayStore = create<DayStore>((set) => ({
  openDay: null,
  blocks: [],

  refreshDay: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: day } = await supabase
      .from("days")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();

    if (!day) {
      set({ openDay: null, blocks: [] });
      return;
    }

    const { data: blocks } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("day_id", day.id)
      .order("start_time");

    set({
      openDay: day,
      blocks: blocks ?? [],
    });
  },

  clearDay: () => set({ openDay: null, blocks: [] }),
}));
