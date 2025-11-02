import { Trophy, Lock } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import type { Achievement, Habit } from "../../src/app/page";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";

interface AchievementsPanelProps {
  achievements: Achievement[];
  habits: Habit[];
}

const ALL_ACHIEVEMENTS = [
  {
    id: "first-day",
    title: "First Step",
    description: "Complete your first day",
    icon: "🎯",
    requirement: 1,
    type: "streak",
  },
  {
    id: "3-day",
    title: "3 Day Streak",
    description: "Keep the momentum going",
    icon: "🔥",
    requirement: 3,
    type: "streak",
  },
  {
    id: "7-day",
    title: "Week Warrior",
    description: "A full week of consistency",
    icon: "💪",
    requirement: 7,
    type: "streak",
  },
  {
    id: "30-day",
    title: "Month Master",
    description: "30 days straight! Incredible!",
    icon: "🏆",
    requirement: 30,
    type: "streak",
  },
  {
    id: "100-day",
    title: "Century Club",
    description: "100 days! Unstoppable!",
    icon: "👑",
    requirement: 100,
    type: "streak",
  },
  {
    id: "50-total",
    title: "50 Completions",
    description: "Hit the half-century mark",
    icon: "⭐",
    requirement: 50,
    type: "total",
  },
  {
    id: "100-total",
    title: "100 Completions",
    description: "A hundred times and counting",
    icon: "💯",
    requirement: 100,
    type: "total",
  },
];

export function AchievementsPanel({
  achievements,
  habits,
}: AchievementsPanelProps) {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null
  );

  // Show confetti for new achievements
  useEffect(() => {
    if (achievements.length > 0) {
      const latest = achievements[achievements.length - 1];
      const isNew =
        latest.unlockedAt &&
        new Date(latest.unlockedAt).getTime() > Date.now() - 2000;

      if (isNew && newAchievement?.id !== latest.id) {
        setNewAchievement(latest);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [achievements]);

  const calculateStreakForHabit = (habit: Habit): number => {
    if (habit.completedDates.length === 0) return 0;

    const today = new Date().toISOString().split("T")[0];
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

  const getAchievementProgress = (
    achievement: (typeof ALL_ACHIEVEMENTS)[0]
  ) => {
    let maxValue = 0;

    habits.forEach((habit) => {
      if (achievement.type === "streak") {
        const streak = calculateStreakForHabit(habit);
        maxValue = Math.max(maxValue, streak);
      } else {
        maxValue = Math.max(maxValue, habit.completedDates.length);
      }
    });

    return {
      current: Math.min(maxValue, achievement.requirement),
      total: achievement.requirement,
      percentage: Math.min((maxValue / achievement.requirement) * 100, 100),
    };
  };

  const getUnlockedCount = () => {
    return achievements.length;
  };

  const getTotalAchievements = () => {
    // Each habit can unlock each achievement
    return ALL_ACHIEVEMENTS.length * Math.max(habits.length, 1);
  };

  if (habits.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="text-slate-900 dark:text-white mb-2">
          No Achievements Yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Start creating habits to unlock achievements!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-slate-900 dark:text-white mb-1">
              Your Achievements
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {getUnlockedCount()} of {getTotalAchievements()} unlocked
            </p>
          </div>
        </div>
        <Progress
          value={(getUnlockedCount() / getTotalAchievements()) * 100}
          className="h-3"
        />
      </Card>

      {/* Achievements by Habit */}
      {habits.map((habit) => {
        const habitAchievements = achievements.filter(
          (a) => a.habitId === habit.id
        );
        const currentStreak = calculateStreakForHabit(habit);
        const totalCompletions = habit.completedDates.length;

        return (
          <div key={habit.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0"
                style={{ backgroundColor: habit.color }}
              />
              <div>
                <h3 className="text-slate-900 dark:text-white">{habit.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentStreak} day streak • {totalCompletions} total
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_ACHIEVEMENTS.map((achievement) => {
                const achievementId = `${habit.id}-${achievement.id}`;
                const isUnlocked = habitAchievements.some(
                  (a) => a.id === achievementId
                );
                const progress = getAchievementProgress(achievement);
                const current =
                  achievement.type === "streak"
                    ? currentStreak
                    : totalCompletions;

                return (
                  <Card
                    key={achievement.id}
                    className={`p-4 transition-all ${
                      isUnlocked
                        ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800"
                        : "opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">
                        {isUnlocked ? (
                          achievement.icon
                        ) : (
                          <Lock className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-900 dark:text-white mb-1">
                          {achievement.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {achievement.description}
                        </p>
                        {!isUnlocked && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                              <span>
                                {current} / {achievement.requirement}
                              </span>
                              <span>{Math.round(progress.percentage)}%</span>
                            </div>
                            <Progress
                              value={progress.percentage}
                              className="h-1.5"
                            />
                          </div>
                        )}
                        {isUnlocked && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
