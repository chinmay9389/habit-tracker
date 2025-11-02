import { Card } from "../ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Workout, Exercise } from "./WorkoutTracker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";

interface WorkoutChartsProps {
  workouts: Workout[];
  exercises: Exercise[];
}

export function WorkoutCharts({ workouts, exercises }: WorkoutChartsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("all");

  if (workouts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-slate-900 dark:text-white mb-2">No Data Yet</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Log some workouts to see your progress charts!
        </p>
      </Card>
    );
  }

  // Get unique exercise names
  const uniqueExercises = Array.from(
    new Set(exercises.map((ex) => ex.name))
  ).sort();

  // Volume over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const volumeData = last30Days.map((date) => {
    const dayWorkouts = workouts.filter((w) => w.date === date);
    const dayExercises = exercises.filter((ex) =>
      dayWorkouts.some((w) => w.id === ex.workout_id)
    );

    const volume = dayExercises.reduce(
      (sum, ex) =>
        sum +
        ex.sets.reduce(
          (setSum, set) => setSum + (set.weight || 0) * set.reps,
          0
        ),
      0
    );

    const sets = dayExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      volume: Math.round(volume),
      sets,
    };
  });

  // Workouts by category
  const categoryData = exercises.reduce((acc, ex) => {
    if (!acc[ex.category]) {
      acc[ex.category] = { category: ex.category, count: 0, volume: 0 };
    }
    acc[ex.category].count += ex.sets.length;
    acc[ex.category].volume += ex.sets.reduce(
      (sum, set) => sum + (set.weight || 0) * set.reps,
      0
    );
    return acc;
  }, {} as Record<string, any>);

  const categoryChartData = Object.values(categoryData)
    .map((item: any) => ({
      ...item,
      volume: Math.round(item.volume),
    }))
    .sort((a: any, b: any) => b.volume - a.volume);

  // Progress for specific exercise
  const getExerciseProgress = (exerciseName: string) => {
    const exerciseData = exercises
      .filter((ex) => ex.name === exerciseName)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((ex) => {
        const maxWeight = Math.max(...ex.sets.map((s) => s.weight || 0), 0);
        const totalVolume = ex.sets.reduce(
          (sum, set) => sum + (set.weight || 0) * set.reps,
          0
        );
        const maxReps = Math.max(...ex.sets.map((s) => s.reps), 0);

        return {
          date: new Date(ex.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weight: maxWeight,
          volume: totalVolume,
          reps: maxReps,
        };
      });

    return exerciseData;
  };

  const exerciseProgressData =
    selectedExercise !== "all" ? getExerciseProgress(selectedExercise) : [];

  return (
    <div className="space-y-6">
      {/* Volume Over Time */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          Volume Trend (30 Days)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Volume (lbs)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="volume"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
                name="Total Volume (lbs)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Volume by Category */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          Volume by Muscle Group
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="volume"
                fill="#10b981"
                radius={[0, 8, 8, 0]}
                name="Total Volume (lbs)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Exercise-Specific Progress */}
      {uniqueExercises.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 dark:text-white">
              Exercise Progress
            </h3>
            <Select
              value={selectedExercise}
              onValueChange={setSelectedExercise}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select an exercise</SelectItem>
                {uniqueExercises.map((ex) => (
                  <SelectItem key={ex} value={ex}>
                    {ex}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExercise === "all" ? (
            <div className="h-80 flex items-center justify-center text-slate-600 dark:text-slate-400">
              Select an exercise to view progress
            </div>
          ) : exerciseProgressData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-slate-600 dark:text-slate-400">
              No data for this exercise
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exerciseProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Weight (lbs)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    label={{
                      value: "Volume (lbs)",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="weight"
                    stroke="#f97316"
                    strokeWidth={3}
                    name="Weight (lbs)"
                    dot={{ fill: "#f97316", r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="volume"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Volume (lbs)"
                    dot={{ fill: "#a855f7", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* Workout Frequency */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          Workout Frequency
        </h3>
        <WorkoutFrequencyChart workouts={workouts} />
      </Card>
    </div>
  );
}

function WorkoutFrequencyChart({ workouts }: { workouts: Workout[] }) {
  const dayOfWeekData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (day, index) => {
      const count = workouts.filter(
        (w) => new Date(w.date).getDay() === index
      ).length;
      return { day, count };
    }
  );

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dayOfWeekData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: "Workouts", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
