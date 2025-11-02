import { Badge } from "../ui/badge";
import type { Habit, HabitCategory } from "../../src/app/page";

interface CategoryFilterProps {
  selectedCategory: HabitCategory | "all";
  onSelectCategory: (category: HabitCategory | "all") => void;
  habits: Habit[];
}

const CATEGORIES: {
  value: HabitCategory | "all";
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "All", emoji: "📋" },
  { value: "health", label: "Health", emoji: "🏥" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "productivity", label: "Productivity", emoji: "⚡" },
  { value: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "social", label: "Social", emoji: "👥" },
  { value: "other", label: "Other", emoji: "✨" },
];

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  habits,
}: CategoryFilterProps) {
  const getCategoryCount = (category: HabitCategory | "all") => {
    if (category === "all") return habits.length;
    return habits.filter((h) => h.category === category).length;
  };

  return (
    <div className="flex gap-2 flex-wrap pb-2">
      {CATEGORIES.map((category) => {
        const count = getCategoryCount(category.value);
        if (count === 0 && category.value !== "all") return null;

        return (
          <button
            key={category.value}
            onClick={() => onSelectCategory(category.value)}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedCategory === category.value
                ? "bg-indigo-100 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-400"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
            }`}
          >
            <span className="text-sm">
              {category.emoji} {category.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {count}
              </Badge>
            </span>
          </button>
        );
      })}
    </div>
  );
}
