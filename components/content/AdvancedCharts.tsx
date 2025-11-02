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
import type { Habit } from "../../src/app/page";
import { Calendar } from "lucide-react";

interface AdvancedChartsProps {
  habits: Habit[];
}

export function AdvancedCharts({ habits }: AdvancedChartsProps) {
  if (habits.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="text-slate-900 dark:text-white mb-2">No Data Yet</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Start tracking habits to see your analytics!
        </p>
      </Card>
    );
  }

  // Get last 30 days of data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const progressData = last30Days.map((date) => {
    const completions = habits.filter((h) =>
      h.completedDates.includes(date)
    ).length;
    const dateObj = new Date(date);
    return {
      date: dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      completions,
      total: habits.length,
      percentage:
        habits.length > 0 ? Math.round((completions / habits.length) * 100) : 0,
    };
  });

  // Data by day of week
  const dayOfWeekData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (day, index) => {
      let count = 0;
      let total = 0;

      habits.forEach((habit) => {
        habit.completedDates.forEach((date) => {
          const d = new Date(date);
          if (d.getDay() === index) {
            count++;
          }
        });
        // Count how many times this day has occurred since habit creation
        const createdDate = new Date(habit.createdAt);
        const today = new Date();
        const daysSinceCreation = Math.floor(
          (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const occurrences =
          Math.floor(daysSinceCreation / 7) + (index <= today.getDay() ? 1 : 0);
        total += occurrences;
      });

      return {
        day,
        completions: count,
        rate: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }
  );

  // Year heatmap data (last 12 months)
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    let completions = 0;
    let possibleCompletions = 0;

    habits.forEach((habit) => {
      const habitStart = new Date(habit.createdAt);
      const effectiveStart = habitStart > monthStart ? habitStart : monthStart;

      if (effectiveStart <= monthEnd) {
        const daysInRange =
          Math.floor(
            (Math.min(monthEnd.getTime(), new Date().getTime()) -
              effectiveStart.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        possibleCompletions += daysInRange;

        habit.completedDates.forEach((date) => {
          const d = new Date(date);
          if (d >= monthStart && d <= monthEnd) {
            completions++;
          }
        });
      }
    });

    return {
      month: d.toLocaleDateString("en-US", { month: "short" }),
      completions,
      rate:
        possibleCompletions > 0
          ? Math.round((completions / possibleCompletions) * 100)
          : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* 30-Day Progress */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          30-Day Completion Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#6366f1"
                strokeWidth={3}
                name="Completions"
                dot={{ fill: "#6366f1", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total Habits"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Day of Week Analysis */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          Success Rate by Day of Week
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Success Rate (%)",
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
                formatter={(value: number) => [`${value}%`, "Success Rate"]}
              />
              <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly Overview */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          12-Month Success Rate
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Success Rate (%)",
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
                formatter={(value: number, name: string) => {
                  if (name === "rate") return [`${value}%`, "Success Rate"];
                  return [value, "Total Completions"];
                }}
              />
              <Legend />
              <Bar
                dataKey="completions"
                fill="#a855f7"
                radius={[8, 8, 0, 0]}
                name="Total Completions"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Year Heatmap Grid */}
      <Card className="p-6">
        <h3 className="text-slate-900 dark:text-white mb-4">
          Year at a Glance
        </h3>
        <YearHeatmap habits={habits} />
      </Card>
    </div>
  );
}

function YearHeatmap({ habits }: { habits: Habit[] }) {
  // Get last 365 days
  const days = Array.from({ length: 365 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (364 - i));
    return d;
  });

  // Group by weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getIntensity = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const completions = habits.filter((h) =>
      h.completedDates.includes(dateString)
    ).length;
    const maxPossible = habits.length;

    if (maxPossible === 0) return 0;
    const percentage = completions / maxPossible;

    if (percentage === 0) return 0;
    if (percentage <= 0.25) return 1;
    if (percentage <= 0.5) return 2;
    if (percentage <= 0.75) return 3;
    return 4;
  };

  const getColor = (intensity: number) => {
    const colors = [
      "#e2e8f0", // 0 - none
      "#a5f3fc", // 1 - low
      "#22d3ee", // 2 - medium
      "#06b6d4", // 3 - high
      "#0891b2", // 4 - very high
    ];
    return colors[intensity];
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-1" style={{ minWidth: "max-content" }}>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const intensity = getIntensity(day);
              const dateString = day.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const completions = habits.filter((h) =>
                h.completedDates.includes(day.toISOString().split("T")[0])
              ).length;

              return (
                <div
                  key={dayIndex}
                  className="w-3 h-3 rounded-sm transition-all hover:scale-150 cursor-pointer"
                  style={{ backgroundColor: getColor(intensity) }}
                  title={`${dateString}: ${completions}/${habits.length} habits`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4 text-sm text-slate-600 dark:text-slate-400">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: getColor(i) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
