"use client";
import {
  Plus,
  Moon,
  Sun,
  Trophy,
  TrendingUp,
  Dumbbell,
  LogOut,
} from "lucide-react";
import { Toaster } from "../../components/ui/sonner";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useEffect, useState } from "react";
import { WorkoutTracker } from "../../components/content/WorkoutTracker";
import { AchievementsPanel } from "../../components/content/AchievementsPanel";
import { AdvancedCharts } from "../../components/content/AdvancedCharts";
import { AddHabitDialog } from "../../components/content/AddHabitDialog";
import { logout, supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { InsightsDashboard } from "../../components/content/InsightsDashboard";
import { CategoryFilter } from "../../components/content/CategoryFilter";
import { HabitCard } from "../../components/content/HabitCard";
import { AuthForm } from "../../components/content/AuthForm";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";
export type HabitCategory =
  | "health"
  | "fitness"
  | "productivity"
  | "mindfulness"
  | "learning"
  | "social"
  | "other";

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays?: number[]; // 0-6 for Sunday-Saturday, used when frequency is 'custom'
  createdAt: string;
  completedDates: string[]; // Array of ISO date strings
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  habitId?: string;
}
export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    HabitCategory | "all"
  >("all");
  const [activeTab, setActiveTab] = useState("habits");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize user session and auth listener
  useEffect(() => {
    initializeUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFromSupabase(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUser = async () => {
    try {
      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await loadFromSupabase(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      setLoading(false);
    }
  };

  const loadFromSupabase = async (uid: string) => {
    try {
      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", uid);

      if (habitsError) throw habitsError;

      // Load habit completions
      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", uid);

      if (completionsError && completionsError.code !== "PGRST204")
        throw completionsError;

      // Merge habits with completions
      const habitsWithCompletions = (habitsData || []).map((habit) => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        color: habit.color,
        category: habit.category as HabitCategory,
        frequency: habit.frequency as HabitFrequency,
        customDays: habit.custom_days || undefined,
        createdAt: habit.created_at,
        completedDates: (completionsData || [])
          .filter((c) => c.habit_id === habit.id)
          .map((c) => c.completed_date),
      }));

      setHabits(habitsWithCompletions);

      // Load achievements
      const { data: achievementsData, error: achievementsError } =
        await supabase.from("achievements").select("*").eq("user_id", uid);

      if (achievementsError && achievementsError.code !== "PGRST204")
        throw achievementsError;

      const achievementsList = (achievementsData || []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        unlockedAt: a.unlocked_at,
        habitId: a.habit_id || undefined,
      }));

      setAchievements(achievementsList);

      // Also load from localStorage as backup
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      } else {
        setIsDarkMode(
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error loading from Supabase:", error);
      toast.error("Failed to load data from cloud");
      setLoading(false);
    }
  };

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    } else {
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const addHabit = async (
    habit: Omit<Habit, "id" | "createdAt" | "completedDates">
  ) => {
    try {
      const newHabit: Habit = {
        ...habit,
        id: `habit-${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedDates: [],
      };

      if (!user) {
        toast.error("You must be signed in to add habits");
        return;
      }

      // Save to Supabase
      const { error } = await supabase.from("habits").insert([
        {
          id: newHabit.id,
          user_id: user.id,
          name: newHabit.name,
          description: newHabit.description,
          color: newHabit.color,
          category: newHabit.category,
          frequency: newHabit.frequency,
          custom_days: newHabit.customDays || null,
        },
      ]);

      if (error) throw error;

      setHabits([...habits, newHabit]);
      toast.success("Habit added! 🎯");
    } catch (error: any) {
      console.error("Error adding habit:", error);
      toast.error("Failed to add habit");
    }
  };

  const toggleHabitCompletion = async (habitId: string, date: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || !user) return;

    const isCompleted = habit.completedDates.includes(date);

    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("completed_date", date)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add completion
        const { error } = await supabase.from("habit_completions").insert([
          {
            habit_id: habitId,
            user_id: user.id,
            completed_date: date,
          },
        ]);

        if (error) throw error;
      }

      // Update local state
      setHabits(
        habits.map((h) => {
          if (h.id === habitId) {
            const updatedDates = isCompleted
              ? h.completedDates.filter((d) => d !== date)
              : [...h.completedDates, date];

            if (!isCompleted) {
              checkAchievements(h, updatedDates);
            }

            return { ...h, completedDates: updatedDates };
          }
          return h;
        })
      );
    } catch (error: any) {
      console.error("Error toggling completion:", error);
      toast.error("Failed to sync completion");
    }
  };

  const checkAchievements = (habit: Habit, completedDates: string[]) => {
    const streak = calculateCurrentStreak(completedDates);
    const total = completedDates.length;

    const achievementChecks = [
      {
        id: "first-day",
        streak: 1,
        title: "First Step",
        description: "Completed your first day!",
        icon: "🎯",
      },
      {
        id: "3-day",
        streak: 3,
        title: "3 Day Streak",
        description: "Keep the momentum going!",
        icon: "🔥",
      },
      {
        id: "7-day",
        streak: 7,
        title: "Week Warrior",
        description: "A full week of consistency!",
        icon: "💪",
      },
      {
        id: "30-day",
        streak: 30,
        title: "Month Master",
        description: "30 days straight! Incredible!",
        icon: "🏆",
      },
      {
        id: "100-day",
        streak: 100,
        title: "Century Club",
        description: "100 days! You're unstoppable!",
        icon: "👑",
      },
      {
        id: "50-total",
        streak: 0,
        total: 50,
        title: "50 Completions",
        description: "Hit the half-century mark!",
        icon: "⭐",
      },
      {
        id: "100-total",
        streak: 0,
        total: 100,
        title: "100 Completions",
        description: "A hundred times and counting!",
        icon: "💯",
      },
    ];

    achievementChecks.forEach((check) => {
      const achievementId = `${habit.id}-${check.id}`;
      const alreadyUnlocked = achievements.some((a) => a.id === achievementId);

      if (!alreadyUnlocked) {
        const unlocked = check.total
          ? total >= check.total
          : streak >= check.streak;

        if (unlocked) {
          const newAchievement: Achievement = {
            id: achievementId,
            title: check.title,
            description: check.description,
            icon: check.icon,
            unlockedAt: new Date().toISOString(),
            habitId: habit.id,
          };
          setAchievements((prev) => [...prev, newAchievement]);
        }
      }
    });
  };

  const calculateCurrentStreak = (completedDates: string[]): number => {
    if (completedDates.length === 0) return 0;

    const sortedDates = [...completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const today = new Date().toISOString().split("T")[0];
    if (!completedDates.includes(today)) {
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

  const deleteHabit = async (habitId: string) => {
    try {
      // Delete completions first
      await supabase.from("habit_completions").delete().eq("habit_id", habitId);

      // Delete habit
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;

      setHabits(habits.filter((habit) => habit.id !== habitId));
      setAchievements(achievements.filter((a) => a.habitId !== habitId));
      toast.success("Habit deleted");
    } catch (error: any) {
      console.error("Error deleting habit:", error);
      toast.error("Failed to delete habit");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setHabits([]);
      setAchievements([]);
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const filteredHabits =
    selectedCategory === "all"
      ? habits
      : habits.filter((h) => h.category === selectedCategory);

  // Show auth form if not authenticated
  if (!user) {
    return (
      <>
        <AuthForm onAuthSuccess={() => {}} />
        <Toaster />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading your data...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h1 className="text-slate-900 dark:text-white">Habit Tracker</h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="dark:border-slate-600"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="gap-2 flex-1 sm:flex-initial dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </Button>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Build better habits, one day at a time
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="habits" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Habits</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              📊 <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Awards</span>
            </TabsTrigger>
          </TabsList>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-6">
            {/* Insights Dashboard */}
            <InsightsDashboard habits={habits} />

            {/* Category Filter */}
            {habits.length > 0 && (
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                habits={habits}
              />
            )}

            {/* Habits List */}
            {habits.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-slate-900 dark:text-white mb-2">
                  No habits yet
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start building better habits by adding your first one
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Habit
                </Button>
              </div>
            ) : filteredHabits.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-600 dark:text-slate-400">
                  No habits in this category yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {filteredHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={toggleHabitCompletion}
                    onDelete={deleteHabit}
                    todayString={getTodayString()}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdvancedCharts habits={habits} />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AchievementsPanel achievements={achievements} habits={habits} />
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts">
            <WorkoutTracker userId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Add Habit Dialog */}
        <AddHabitDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAdd={addHabit}
        />

        <Toaster />
      </div>
    </div>
  );
}
