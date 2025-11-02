import { TrendingUp, Target, Award, Calendar, Flame } from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import type { Habit } from "../../src/app/page";

interface InsightsDashboardProps {
  habits: Habit[];
}

export function InsightsDashboard({ habits }: InsightsDashboardProps) {
  const getTodayString = () => new Date().toISOString().split("T")[0];

  const isHabitScheduledForDate = (habit: Habit, date: Date) => {
    const dayOfWeek = date.getDay();
    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (habit.frequency === "weekends")
      return dayOfWeek === 0 || dayOfWeek === 6;
    if (habit.frequency === "custom" && habit.customDays) {
      return habit.customDays.includes(dayOfWeek);
    }
    return true;
  };

  // Calculate insights
  const calculateInsights = () => {
    if (habits.length === 0) {
      return {
        completedToday: 0,
        totalToday: 0,
        todayPercentage: 0,
        weeklyCompletions: 0,
        weeklyTotal: 0,
        weeklyPercentage: 0,
        longestStreak: 0,
        longestStreakHabit: "",
        totalCompletions: 0,
        averagePerDay: 0,
      };
    }

    const today = getTodayString();
    const todayDate = new Date();

    // Count only scheduled habits for today
    const scheduledToday = habits.filter((h) =>
      isHabitScheduledForDate(h, todayDate)
    );
    const completedToday = scheduledToday.filter((h) =>
      h.completedDates.includes(today)
    ).length;

    // Weekly stats (last 7 days) - only count scheduled days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    });

    let weeklyCompletions = 0;
    let weeklyTotal = 0;

    habits.forEach((habit) => {
      last7Days.forEach((date) => {
        if (isHabitScheduledForDate(habit, date)) {
          weeklyTotal++;
          const dateString = date.toISOString().split("T")[0];
          if (habit.completedDates.includes(dateString)) {
            weeklyCompletions++;
          }
        }
      });
    });

    const weeklyPercentage =
      weeklyTotal > 0 ? (weeklyCompletions / weeklyTotal) * 100 : 0;

    // Find longest streak
    let longestStreak = 0;
    let longestStreakHabit = "";

    habits.forEach((habit) => {
      const streak = calculateStreakForHabit(habit);
      if (streak > longestStreak) {
        longestStreak = streak;
        longestStreakHabit = habit.name;
      }
    });

    // Total completions
    const totalCompletions = habits.reduce(
      (sum, h) => sum + h.completedDates.length,
      0
    );

    // Average per day (based on oldest habit)
    const oldestHabit = habits.reduce((oldest, h) => {
      return new Date(h.createdAt) < new Date(oldest.createdAt) ? h : oldest;
    }, habits[0]);

    const daysSinceStart = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(oldestHabit.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const averagePerDay = totalCompletions / daysSinceStart;

    return {
      completedToday,
      totalToday: scheduledToday.length,
      todayPercentage:
        scheduledToday.length > 0
          ? (completedToday / scheduledToday.length) * 100
          : 0,
      weeklyCompletions,
      weeklyTotal,
      weeklyPercentage,
      longestStreak,
      longestStreakHabit,
      totalCompletions,
      averagePerDay,
    };
  };

  const calculateStreakForHabit = (habit: Habit) => {
    if (habit.completedDates.length === 0) return 0;

    const today = getTodayString();
    const isCompletedToday = habit.completedDates.includes(today);
    const sortedDates = [...habit.completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (!isCompletedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      if (sortedDates.includes(dateString)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const insights = calculateInsights();

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-slate-900 dark:text-white mb-4">Your Insights</h2>

      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        {/* Today's Progress */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Today's Progress
            </div>
          </div>
          <div className="mb-2">
            <span className="text-slate-900 dark:text-white">
              {insights.completedToday}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {" "}
              / {insights.totalToday}
            </span>
          </div>
          <Progress value={insights.todayPercentage} className="h-2" />
        </Card>

        {/* Weekly Success Rate */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              7-Day Success
            </div>
          </div>
          <div className="mb-2">
            <span className="text-slate-900 dark:text-white">
              {Math.round(insights.weeklyPercentage)}%
            </span>
          </div>
          <Progress value={insights.weeklyPercentage} className="h-2" />
        </Card>

        {/* Longest Streak */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Longest Streak
            </div>
          </div>
          <div className="mb-1">
            <span className="text-slate-900 dark:text-white">
              {insights.longestStreak} days
            </span>
          </div>
          {insights.longestStreakHabit && (
            <div className="text-slate-500 dark:text-slate-400 text-sm truncate">
              {insights.longestStreakHabit}
            </div>
          )}
        </Card>

        {/* Total Completions */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Total Completions
            </div>
          </div>
          <div className="mb-1">
            <span className="text-slate-900 dark:text-white">
              {insights.totalCompletions}
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            {insights.averagePerDay.toFixed(1)} avg/day
          </div>
        </Card>
      </div>

      {/* Weekly Heatmap Overview */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-slate-900 dark:text-white">Last 7 Days</h3>
        </div>
        <WeeklyHeatmap habits={habits} />
      </Card>
    </div>
  );
}

function WeeklyHeatmap({ habits }: { habits: Habit[] }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // Start from 7 days ago
    return d;
  });

  const getCompletionCountForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return habits.filter((h) => h.completedDates.includes(dateString)).length;
  };

  const maxCount = habits.length;

  return (
    <div className="space-y-2 sm:space-y-3">
      {last7Days.map((date, index) => {
        const count = getCompletionCountForDate(date);
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const dayDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div key={index} className="flex items-center gap-2 sm:gap-4">
            <div className="w-12 sm:w-16 text-slate-600 dark:text-slate-400 text-right text-sm">
              <div>{dayName}</div>
              <div className="text-slate-400 dark:text-slate-500 hidden sm:block">
                {dayDate}
              </div>
            </div>
            <div className="flex-1">
              <div className="relative h-7 sm:h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all rounded-lg"
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2 sm:px-3 text-slate-700 dark:text-slate-300 text-sm">
                  {count} / {maxCount}
                </div>
              </div>
            </div>
            <div className="w-10 sm:w-12 text-slate-900 dark:text-white text-right text-sm">
              {Math.round(percentage)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
