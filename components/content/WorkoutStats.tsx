import { Card } from "../ui/card";
import { Dumbbell, Calendar, TrendingUp, Flame } from "lucide-react";
import type { Workout, Exercise } from "./WorkoutTracker";

interface WorkoutStatsProps {
  workouts: Workout[];
  exercises: Exercise[];
}

export function WorkoutStats({ workouts, exercises }: WorkoutStatsProps) {
  if (workouts.length === 0) return null;

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalExercises = exercises.length;

  const totalVolume = exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce((setSum, set) => setSum + (set.weight || 0) * set.reps, 0),
    0
  );

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  // Last 7 days workout count
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const workoutsLast7Days = workouts.filter((w) =>
    last7Days.includes(w.date)
  ).length;

  // Current streak
  const calculateStreak = () => {
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const today = new Date().toISOString().split("T")[0];
    const hasWorkoutToday = sortedWorkouts.some((w) => w.date === today);

    if (!hasWorkoutToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const workoutDates = new Set(sortedWorkouts.map((w) => w.date));

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0];
      if (workoutDates.has(dateString)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }

      // Safety check
      if (streak > 365) break;
    }

    return streak;
  };

  const streak = calculateStreak();

  // Average duration
  const workoutsWithDuration = workouts.filter((w) => w.duration_minutes);
  const avgDuration =
    workoutsWithDuration.length > 0
      ? Math.round(
          workoutsWithDuration.reduce(
            (sum, w) => sum + (w.duration_minutes || 0),
            0
          ) / workoutsWithDuration.length
        )
      : 0;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Total Workouts
          </div>
        </div>
        <div className="mb-1">
          <span className="text-slate-900 dark:text-white">
            {totalWorkouts}
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          {workoutsLast7Days} this week
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Current Streak
          </div>
        </div>
        <div className="mb-1">
          <span className="text-slate-900 dark:text-white">{streak} days</span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          Keep it up!
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Total Volume
          </div>
        </div>
        <div className="mb-1">
          <span className="text-slate-900 dark:text-white">
            {(totalVolume / 1000).toFixed(1)}k
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {" "}
            lbs
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          {totalSets} total sets
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Avg Duration
          </div>
        </div>
        <div className="mb-1">
          <span className="text-slate-900 dark:text-white">{avgDuration}</span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {" "}
            min
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          Per workout
        </div>
      </Card>
    </div>
  );
}
