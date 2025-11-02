import { useState } from "react";
import { Trash2, Flame, Calendar } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { HeatmapCalendar } from "./HeatmapCalender";
import type { Habit } from "../../src/app/page";
import { toast } from "sonner";

interface HabitCardProps {
  habit: Habit;
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
  todayString: string;
}

const CATEGORY_INFO: Record<string, { emoji: string; label: string }> = {
  health: { emoji: "🏥", label: "Health" },
  fitness: { emoji: "💪", label: "Fitness" },
  productivity: { emoji: "⚡", label: "Productivity" },
  mindfulness: { emoji: "🧘", label: "Mindfulness" },
  learning: { emoji: "📚", label: "Learning" },
  social: { emoji: "👥", label: "Social" },
  other: { emoji: "✨", label: "Other" },
};

export function HabitCard({
  habit,
  onToggle,
  onDelete,
  todayString,
}: HabitCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCompletedToday = habit.completedDates.includes(todayString);

  // Check if habit is scheduled for today
  const isScheduledToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();

    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (habit.frequency === "weekends")
      return dayOfWeek === 0 || dayOfWeek === 6;
    if (habit.frequency === "custom" && habit.customDays) {
      return habit.customDays.includes(dayOfWeek);
    }
    return true;
  };

  const scheduledToday = isScheduledToday();

  // Calculate current streak (accounting for frequency)
  const calculateStreak = () => {
    if (habit.completedDates.length === 0) return 0;

    const sortedDates = [...habit.completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // If today is scheduled but not completed, start from yesterday
    if (scheduledToday && !isCompletedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();

      // Check if this date was a scheduled day
      let wasScheduled = false;
      if (habit.frequency === "daily") wasScheduled = true;
      else if (habit.frequency === "weekdays")
        wasScheduled = dayOfWeek >= 1 && dayOfWeek <= 5;
      else if (habit.frequency === "weekends")
        wasScheduled = dayOfWeek === 0 || dayOfWeek === 6;
      else if (habit.frequency === "custom" && habit.customDays)
        wasScheduled = habit.customDays.includes(dayOfWeek);

      if (wasScheduled) {
        if (sortedDates.includes(dateString)) {
          streak++;
        } else {
          break;
        }
      }

      currentDate.setDate(currentDate.getDate() - 1);

      // Safety check: don't go back more than a year
      if (streak > 365) break;
    }

    return streak;
  };

  const getFrequencyLabel = () => {
    if (habit.frequency === "daily") return "📅 Every day";
    if (habit.frequency === "weekdays") return "📅 Weekdays";
    if (habit.frequency === "weekends") return "📅 Weekends";
    if (habit.frequency === "custom" && habit.customDays) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return "📅 " + habit.customDays.map((d: any) => days[d]).join(", ");
    }
    return "📅 Custom";
  };

  const streak = calculateStreak();
  const completionRate = habit.completedDates.length;
  const categoryInfo = CATEGORY_INFO[habit.category] || CATEGORY_INFO.other;

  const handleDelete = () => {
    onDelete(habit.id);
    setShowDeleteDialog(false);
    toast.success("Habit deleted");
  };

  const handleToggleToday = () => {
    if (!scheduledToday) {
      toast.error("This habit is not scheduled for today");
      return;
    }
    onToggle(habit.id, todayString);
    if (!isCompletedToday) {
      toast.success("Great job! Keep it up! 🎉");
    }
  };

  const handleToggleDate = (date: string) => {
    onToggle(habit.id, date);
    const isCompleted = habit.completedDates.includes(date);
    if (!isCompleted) {
      toast.success("Date marked complete! 🎉");
    } else {
      toast.success("Date unmarked");
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-2" style={{ backgroundColor: habit.color }} />

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-slate-900 dark:text-white">{habit.name}</h3>
              </div>
              {habit.description && (
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  {habit.description}
                </p>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {categoryInfo.emoji} {categoryInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getFrequencyLabel()}
                </Badge>
                {!scheduledToday && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-slate-200 dark:bg-slate-700"
                  >
                    🛌 Rest Day
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-slate-400 hover:text-red-600 -mr-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Today's Checkbox */}
          <div
            className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg border-2 ${
              scheduledToday
                ? "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                id={`habit-${habit.id}`}
                checked={isCompletedToday}
                onCheckedChange={handleToggleToday}
                disabled={!scheduledToday}
                className="w-6 h-6"
              />
              <label
                htmlFor={`habit-${habit.id}`}
                className={`select-none ${
                  scheduledToday ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                {scheduledToday ? "Complete today" : "Rest day - not scheduled"}
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Streak
                </div>
                <div className="text-slate-900 dark:text-white text-sm sm:text-base">
                  {streak} days
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  Total
                </div>
                <div className="text-slate-900 dark:text-white text-sm sm:text-base">
                  {completionRate} days
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap Calendar */}
          <HeatmapCalendar
            completedDates={habit.completedDates}
            color={habit.color}
            onToggleDate={handleToggleDate}
          />
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{habit.name}"? This action cannot
              be undone and all progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
