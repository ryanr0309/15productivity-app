export type Habit = {
  id: string;
  name: string;
  color: string;
};

/**
 * Default / starter habits.
 * These are used for:
 * - onboarding
 * - planned habit blocks
 * - fallback display if DB not loaded yet
 *
 * IMPORTANT:
 * Planned habits are NOT categories.
 * They only represent intent.
 */
