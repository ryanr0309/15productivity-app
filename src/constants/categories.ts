export type Category = {
  id: string;
  label: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "school",
    label: "School",
    color: "#4DA3FF",
  },
  {
    id: "gym",
    label: "Gym",
    color: "#18C964",
  },
  {
    id: "work",
    label: "Work",
    color: "#FFB020",
  },
  {
    id: "focus",
    label: "Deep Focus",
    color: "#8B5CF6",
  },
];

export function getCategoryById(id: string | null) {
  return CATEGORIES.find(c => c.id === id);
}
