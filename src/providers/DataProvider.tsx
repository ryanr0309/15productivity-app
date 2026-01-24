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
  category_id: string | null; // ✅ add this
};

export type HabitInsertRow = Habit & {
  category?: Category | null;
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
  invalidateInsights: () => void;
  fetchInsights: (userId: string) => Promise<void>;
  hydrated: boolean;
  hydrate: () => Promise<void>;

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
  const [goals, setGoals] = useState([]);
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
  const [hydrated, setHydrated] = useState(false);

  
  const openDayState = useOpenDay();


async function hydrate() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  // ensure row exists
  await supabase.from("user_settings").upsert({
    user_id: user.id,
  });

  const [
    { data: cats },
    { data: habs },
    { data: settings },
  ] = await Promise.all([
    supabase.from("categories").select("*").eq("user_id", user.id),
    supabase.from("habits").select("*").eq("user_id", user.id),
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  console.log("hydrated goals:", settings?.goals);

  setCategories(cats ?? []);
  setHabits(habs ?? []);
  setGoals(Array.isArray(settings?.goals) ? settings.goals : []);

  setHydrated(true);
}


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

const invalidateInsights = useCallback(() => {
  setInsightsCache(null);
}, []);


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
   */const addHabit = useCallback(
  async ({ name, color }: { name: string; color: string }) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({ user_id: userId, name, color })
      // ⚠️ This requires the FK habits.category_id -> categories.id to exist
      .select("id,user_id,name,color,created_at,category_id,categories(*)")
      .single<HabitInsertRow>();

    if (error || !data) {
      console.error("Add habit failed", error);
      return;
    }

    setHabits((prev) => [...prev, data]);

    // 1) If the join came through, use it
    const embeddedCategory = (data as any).categories as Category | undefined;

    if (embeddedCategory) {
      setCategories((prev) => [...prev, embeddedCategory]);
      return;
    }

    // 2) Fallback: fetch category by category_id
    if (data.category_id) {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .eq("id", data.category_id)
        .single();

      if (!catErr && cat) {
        setCategories((prev) => [...prev, cat]);
      }
    }
  },
  [userId]
);


const deleteHabit = useCallback(
  async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    const categoryId = habit?.category_id ?? null;

    // optimistic UI
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    if (categoryId) {
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    }

    // DB cleanup
    // order matters depending on FK rules:
    // safest: delete habit first, then its category
    await supabase.from("habits").delete().eq("id", habitId);

    if (categoryId) {
      await supabase.from("categories").delete().eq("id", categoryId);
    }
  },
  [habits]
);


const deleteCategory = useCallback(
  async (categoryId: string) => {
    const linkedHabit = habits.find((h) => h.category_id === categoryId);

    // optimistic UI
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    if (linkedHabit) {
      setHabits((prev) => prev.filter((h) => h.id !== linkedHabit.id));
    }

    // DB cleanup
    await supabase.from("categories").delete().eq("id", categoryId);

    // If you DON'T have FK cascade category -> habits, then do this:
    if (linkedHabit) {
      await supabase.from("habits").delete().eq("id", linkedHabit.id);
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

  // 1️⃣ Load all closed days
  const { data: days, error } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .not("end_time", "is", null)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to load insight days", error);
    return;
  }

  if (!days || days.length === 0) {
    setInsightsCache({
      days: [],
      blocksByDayId: {},
      reportsByDayId: {},
    });
    return;
  }

  // 2️⃣ Prevent unnecessary reloads (but allow new days)
  if (insightsCache?.days?.length) {
    const cachedLatest =
      insightsCache.days[insightsCache.days.length - 1]?.id;
    const fetchedLatest = days[days.length - 1]?.id;

    if (cachedLatest === fetchedLatest) {
      return; // cache is still valid
    }
  }

  // 3️⃣ Load blocks + reports for EACH day
  const blocksByDayId: Record<string, any[]> = {};
  const reportsByDayId: Record<string, any> = {};

  await Promise.all(
    days.map(async day => {
      const [{ data: report }, { data: blocks }] =
        await Promise.all([
          supabase
            .from("daily_reports")
            .select("*")
            .eq("day_id", day.id)
            .maybeSingle(),

          supabase
            .from("time_blocks")
            .select("*")
            .eq("day_id", day.id)
            .order("start_time"),
        ]);

      blocksByDayId[day.id] = normalizeBlocks(blocks ?? []);
      reportsByDayId[day.id] = report;
    })
  );

  // 4️⃣ Commit cache
  setInsightsCache({
    days,
    blocksByDayId,
    reportsByDayId,
  });
}

async function fetchInsights(userId: string) {
  const { data: days } = await supabase
    .from("days")
    .select("*")
    .eq("user_id", userId)
    .order("start_time");

  if (!days) return;

  const dayIds = days.map(d => d.id);

  const [{ data: blocks }, { data: reports }] = await Promise.all([
    supabase
      .from("time_blocks")
      .select("*")
      .in("day_id", dayIds),
    supabase
      .from("daily_reports")
      .select("*")
      .in("day_id", dayIds),
  ]);

  // ✅ SAFE block map
  const blocksByDayId: Record<string, Block[]> = {};

for (const day of days) {
  const dayBlocks = (blocks ?? []).filter(b => b.day_id === day.id);
  blocksByDayId[day.id] = normalizeBlocks(dayBlocks);
}


  // ✅ SAFE report map
  const reportsByDayId: Record<string, any> = {};
  for (const report of reports ?? []) {
    reportsByDayId[report.day_id] = report;
  }

  setInsightsCache({
    days,
    blocksByDayId,
    reportsByDayId,
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
         invalidateInsights,
         fetchInsights,

         
    openDay: openDayState.openDay,
    openDayChecked: openDayState.openDayChecked,
    reloadOpenDay: openDayState.reloadOpenDay,
    homeReady,
    hydrated,
    hydrate,
  
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
