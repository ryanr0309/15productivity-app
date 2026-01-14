import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth} from "../hooks/useAuth";
import { ensureTimeBlocksExist, normalizeBlocks } from "../utils/blocks";
import { Block } from "../utils/timeBlocks";
import { Day } from "../types/days";
import { useOpenDay } from "../services/useOpenDay";


/* ===================== TYPES ===================== */

type LabCache = {
  goals: string[];
};

export type Category = {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  wake_time: string | null;
  sleep_time: string | null;
  interval_minutes: number;
  goals: string[] | null;
  updated_at: string;
};

/* ===================== CONTEXT ===================== */
type HomeCache = {
  dayId: string;
  blocks: Block[];
};

type PreloadedInsights = {
  days: Day[];
  blocksByDayId: Record<string, Block[]>;
  reportsByDayId: Record<string, any>;
};

type DataContextType = {
  categories: Category[];
  habits: Habit[];
  userSettings: UserSettings | null;

  loading: boolean;

  addCategory: (input: {
    label: string;
    color: string;
  }) => Promise<void>;

  addHabit: (input: {
    name: string;
    color: string;
  }) => Promise<void>;

  deleteHabit: (habitId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  updateUserSettings: (
    partial: Partial<UserSettings>
  ) => Promise<void>;

  /** 🔹 NEW */
  preloadInsights: () => Promise<void>;
  insightsCache: PreloadedInsights | null;

  preloadLab: () => Promise<void>;
  labCache: LabCache | null;

  updateLabGoals: (goals: string[]) => Promise<void>;
  openDay: any | null;
  openDayChecked: boolean;
  reloadOpenDay: () => Promise<void>;

  preloadHome: () => Promise<void>;
  homeCache: HomeCache | null;

  homeReady: boolean;
  markHomeReady: () => void;

};


const DataContext = createContext<DataContextType | null>(null);

/* ===================== PROVIDER ===================== */

export function DataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, authReady } = useAuth();
  const authLoading = !authReady;

  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userSettings, setUserSettings] =
    useState<UserSettings | null>(null);

      const [insightsCache, setInsightsCache] =
  useState<PreloadedInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [labCache, setLabCache] = useState<LabCache | null>(null);
  const [homeCache, setHomeCache] = useState<HomeCache | null>(null);
  const [homeReady, setHomeReady] = useState(false);
  const markHomeReady = useCallback(() => {
  setHomeReady(true);
}, []);

  
  const openDayState = useOpenDay();





useEffect(() => {
  if (!userId) return;
  openDayState.reloadOpenDay(); // ✅ same instance you expose
}, [userId]);


  /* ============ INITIAL LOAD ============ */
  

  async function preloadHome() {
  
  if (!userId) return;

  // 1️⃣ Fetch open day DIRECTLY (do not trust state)
  const { data: day } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();

  if (!day?.id) {
    setHomeCache(null);
    setHomeReady(true); // unlock DayUnlockFlow
    return;
  }

  

  // 2️⃣ Ensure blocks exist
  await ensureTimeBlocksExist(day);

  // 3️⃣ Fetch blocks
  const { data: blocks, error } = await supabase
    .from("time_blocks")
    .select("*")
    .eq("day_id", day.id)
    .order("start_time");

  if (error) {
    console.error("preloadHome failed", error);
    setHomeCache({ dayId: day.id, blocks: [] });
    setHomeReady(true);
    return;
  }



  // 4️⃣ Cache + mark ready
  setHomeCache({
    dayId: day.id,
    blocks: normalizeBlocks(blocks ?? []),
  });

  setHomeReady(true); // ✅ THIS IS WHAT YOU WERE MISSING


}



  const loadUserData = useCallback(async (uid: string) => {
    setLoading(true);

    const [categoriesRes, habitsRes, settingsRes] =
      await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", uid)
          .order("created_at"),

        supabase
          .from("habits")
          .select("*")
          .eq("user_id", uid)
          .order("created_at"),

        supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", uid)
          .single(),
      ]);

    if (!categoriesRes.error) {
      setCategories(categoriesRes.data ?? []);
    }

    if (!habitsRes.error) {
      setHabits(habitsRes.data ?? []);
    }

    if (!settingsRes.error) {
      setUserSettings(settingsRes.data ?? null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!userId) {
      setCategories([]);
      setHabits([]);
      setUserSettings(null);
      setLoading(false);
      return;
    }

    loadUserData(userId);
  }, [userId, authLoading, loadUserData]);

  /* ===================== MUTATIONS ===================== */

  
  /**
   * Add a standalone category (not a habit)
   */
  const addCategory = useCallback(
    async ({ label, color }: { label: string; color: string }) => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          label,
          color,
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Add category failed", error);
        return;
      }

      setCategories(prev => [...prev, data]);
    },
    [userId]
  );

  /**
   * Add habit (category is created elsewhere to keep control explicit)
   */
  const addHabit = useCallback(
    async ({ name, color }: { name: string; color: string }) => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: userId,
          name,
          color,
        })
        .select()
        .single();

      if (error || !data) {
        console.error("Add habit failed", error);
        return;
      }

      setHabits(prev => [...prev, data]);
    },
    [userId]
  );

const deleteHabit = useCallback(
  async (habitId: string) => {
    // optimistic UI
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setCategories(prev => prev.filter(c => c.id !== habitId));

    // DB cleanup
    await Promise.all([
      supabase.from("habits").delete().eq("id", habitId),
      supabase.from("categories").delete().eq("id", habitId),
    ]);
  },
  []
);

const deleteCategory = useCallback(
  async (categoryId: string) => {
    const isHabitCategory = habits.some(h => h.id === categoryId);

    setCategories(prev => prev.filter(c => c.id !== categoryId));

    if (isHabitCategory) {
      setHabits(prev => prev.filter(h => h.id !== categoryId));
    }

    await supabase.from("categories").delete().eq("id", categoryId);

    if (isHabitCategory) {
      await supabase.from("habits").delete().eq("id", categoryId);
    }
  },
  [habits]
);


  const updateUserSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_settings")
        .update(partial)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !data) {
        console.error(
          "Update user settings failed",
          error
        );
        return;
      }

      setUserSettings(data);
    },
    [userId]
  );


async function preloadLab() {
  if (!userId) return;
  if (labCache) return; // ✅ already preloaded

  const { data, error } = await supabase
    .from("user_settings")
    .select("goals")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Failed to preload lab goals", error);
    setLabCache({ goals: [] });
    return;
  }

  setLabCache({
    goals: data?.goals ?? [],
  });
}

async function preloadInsights() {
    if (!userId) return;
    if (insightsCache) return; // ✅ already preloaded

    // 1️⃣ Load closed days
    const { data: days } = await supabase
      .from("days")
      .select("*")
      .eq("user_id", userId)
      .not("end_time", "is", null)
      .order("start_time", { ascending: true });

    if (!days || days.length === 0) {
      setInsightsCache({
        days: [],
        blocksByDayId: {},
        reportsByDayId: {},
      });
      return;
    }

    const latestDay = days[days.length - 1];

    // 2️⃣ Load latest day data
    const [{ data: report }, { data: blocks }] =
      await Promise.all([
        supabase
          .from("daily_reports")
          .select("*")
          .eq("day_id", latestDay.id)
          .maybeSingle(),

        supabase
          .from("time_blocks")
          .select("*")
          .eq("day_id", latestDay.id)
          .order("start_time"),
      ]);

    setInsightsCache({
      days,
      blocksByDayId: {
        [latestDay.id]: normalizeBlocks(blocks ?? []),
      },
      reportsByDayId: {
        [latestDay.id]: report,
      },
    });
  }

  async function updateLabGoals(goals: string[]) {
  if (!userId) return;

  const { error } = await supabase
    .from("user_settings")
    .update({ goals })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update goals", error);
    return;
  }

  // ✅ update cache so Lab re-renders instantly
  setLabCache(prev =>
    prev
      ? { ...prev, goals }
      : { goals }
  );
}




useEffect(() => {
  if (!userId) return;

  // ❌ DO NOT preload app data until onboarding is complete
  if (!authReady) return;

  preloadHome();
  preloadInsights();
  preloadLab();
}, [userId, authReady]);




  /* ===================== PROVIDER ===================== */

  return (
    <DataContext.Provider
      value={{
        categories,
        habits,
        userSettings,
        loading,
        preloadHome,
        homeCache,
        addCategory,
        addHabit,
        deleteHabit,
        deleteCategory,
        updateUserSettings,
         preloadInsights,
         insightsCache,
         labCache,
         preloadLab,
         updateLabGoals,
         markHomeReady,


         
    openDay: openDayState.openDay,
    openDayChecked: openDayState.openDayChecked,
    reloadOpenDay: openDayState.reloadOpenDay,
    homeReady,
  
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

/* ===================== HOOK ===================== */

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error(
      "useData must be used inside DataProvider"
    );
  }
  return ctx;
}
