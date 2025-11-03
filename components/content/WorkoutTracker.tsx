import { useState, useEffect } from "react";
import {
  Plus,
  Dumbbell,
  TrendingUp,
  Calendar,
  Trophy,
  Clock,
  Settings,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AddWorkoutDialog } from "./AddWorkoutDialog";
import { ManageTemplatesDialog } from "./ManageTemplatesDialog";
import { WorkoutHistory } from "./WorkoutHistory";
import { WorkoutStats } from "./WorkoutStats";
import { WorkoutCharts } from "./WorkoutCharts";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { EditWorkoutDialog } from "./EditWorkoutDialog";
export interface ExerciseSet {
  reps: number;
  weight: number | null;
}

export interface Exercise {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  category: string;
  sets: ExerciseSet[];
  unit: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises?: Exercise[];
}

interface WorkoutTrackerProps {
  userId: string;
}

export function WorkoutTracker({ userId }: WorkoutTrackerProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadWorkouts();
    loadExercises();

    // Subscribe to real-time changes
    const workoutChannel = supabase
      .channel("workouts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workouts" },
        () => {
          loadWorkouts();
        }
      )
      .subscribe();

    const exerciseChannel = supabase
      .channel("exercises-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exercises" },
        () => {
          loadExercises();
        }
      )
      .subscribe();

    return () => {
      workoutChannel.unsubscribe();
      exerciseChannel.unsubscribe();
    };
  }, [userId]);

  const loadWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      console.error("Error loading workouts:", error);
      toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Data is already in the correct format with sets as JSON array
      setExercises(data || []);
    } catch (error: any) {
      console.error("Error loading exercises:", error);
    }
  };

  const addWorkout = async (
    workout: Omit<Workout, "id" | "created_at" | "updated_at">,
    exerciseList: Omit<Exercise, "id" | "workout_id" | "created_at">[]
  ) => {
    try {
      // Insert workout
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .insert([workout])
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Insert exercises - each exercise with sets as JSON array
      if (exerciseList.length > 0) {
        const exerciseRows = exerciseList.map((ex) => ({
          workout_id: workoutData.id,
          user_id: ex.user_id,
          name: ex.name,
          category: ex.category,
          sets: ex.sets, // Store entire sets array as JSON
          unit: ex.unit,
        }));

        const { error: exercisesError } = await supabase
          .from("exercises")
          .insert(exerciseRows);

        if (exercisesError) throw exercisesError;
      }

      toast.success("Workout logged successfully! 💪");
      loadWorkouts();
      loadExercises();
    } catch (error: any) {
      console.error("Error adding workout:", error);
      toast.error("Failed to add workout");
    }
  };

  const editWorkout = async (
    workoutId: string,
    workoutUpdates: Partial<Workout>,
    exerciseList: Omit<Exercise, "id" | "workout_id" | "created_at">[]
  ) => {
    try {
      // Update workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .update(workoutUpdates)
        .eq("id", workoutId);

      if (workoutError) throw workoutError;

      // Delete existing exercises
      await supabase.from("exercises").delete().eq("workout_id", workoutId);

      // Insert new exercises
      if (exerciseList.length > 0) {
        const exerciseRows = exerciseList.map((ex) => ({
          workout_id: workoutId,
          user_id: ex.user_id,
          name: ex.name,
          category: ex.category,
          sets: ex.sets,
          unit: ex.unit,
        }));

        const { error: exercisesError } = await supabase
          .from("exercises")
          .insert(exerciseRows);

        if (exercisesError) throw exercisesError;
      }

      toast.success("Workout updated! 💪");
      loadWorkouts();
      loadExercises();
    } catch (error: any) {
      console.error("Error updating workout:", error);
      toast.error("Failed to update workout");
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      // Delete exercises first (foreign key constraint)
      await supabase.from("exercises").delete().eq("workout_id", workoutId);

      // Delete workout
      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId);

      if (error) throw error;

      toast.success("Workout deleted");
      loadWorkouts();
      loadExercises();
    } catch (error: any) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setIsEditDialogOpen(true);
  };

  // Group exercises by workout
  const workoutsWithExercises = workouts.map((workout) => ({
    ...workout,
    exercises: exercises.filter((ex) => ex.workout_id === workout.id),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600 dark:text-slate-400">
          Loading workouts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 dark:text-white mb-2">
            Workout Tracker
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Track your exercises, sets, reps, and progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsManageTemplatesOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Manage</span>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            Log Workout
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <WorkoutStats workouts={workoutsWithExercises} exercises={exercises} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="history" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Records</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          {workoutsWithExercises.length === 0 ? (
            <Card className="p-12 text-center">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-slate-900 dark:text-white mb-2">
                No Workouts Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start logging your workouts to track your progress
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Log Your First Workout
              </Button>
            </Card>
          ) : (
            <WorkoutHistory
              workouts={workoutsWithExercises}
              onDelete={deleteWorkout}
              onEdit={handleEditWorkout}
            />
          )}
        </TabsContent>

        <TabsContent value="charts" className="mt-6">
          <WorkoutCharts
            workouts={workoutsWithExercises}
            exercises={exercises}
          />
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <PersonalRecords exercises={exercises} />
        </TabsContent>
      </Tabs>

      {/* Add Workout Dialog */}
      <AddWorkoutDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={addWorkout}
        userId={userId}
        refreshTrigger={refreshTrigger}
      />

      {/* Edit Workout Dialog */}
      <EditWorkoutDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        workout={editingWorkout}
        onSave={editWorkout}
        userId={userId}
      />

      {/* Manage Templates Dialog */}
      <ManageTemplatesDialog
        open={isManageTemplatesOpen}
        onOpenChange={setIsManageTemplatesOpen}
        userId={userId}
        onTemplatesChange={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

function PersonalRecords({ exercises }: { exercises: Exercise[] }) {
  // Calculate personal records for each exercise
  const records = exercises.reduce((acc, exercise) => {
    const key = exercise.name.toLowerCase();

    // Calculate max weight, max reps, and total volume from all sets
    const maxWeight = Math.max(...exercise.sets.map((s) => s.weight || 0), 0);
    const maxReps = Math.max(...exercise.sets.map((s) => s.reps), 0);
    const totalVolume = exercise.sets.reduce(
      (sum, set) => sum + (set.weight || 0) * set.reps,
      0
    );

    if (!acc[key]) {
      acc[key] = {
        name: exercise.name,
        category: exercise.category,
        maxWeight,
        maxReps,
        maxVolume: totalVolume,
        unit: exercise.unit,
        date: exercise.created_at,
      };
    } else {
      if (maxWeight > acc[key].maxWeight) {
        acc[key].maxWeight = maxWeight;
        acc[key].date = exercise.created_at;
      }
      if (maxReps > acc[key].maxReps) {
        acc[key].maxReps = maxReps;
      }
      if (totalVolume > acc[key].maxVolume) {
        acc[key].maxVolume = totalVolume;
      }
    }
    return acc;
  }, {} as Record<string, any>);

  const recordsList = Object.values(records).sort(
    (a: any, b: any) => b.maxWeight - a.maxWeight
  );

  if (recordsList.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="text-slate-900 dark:text-white mb-2">No Records Yet</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Log some workouts to see your personal records
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recordsList.map((record: any, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-slate-900 dark:text-white mb-1">
                {record.name}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {record.category}
              </p>
            </div>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Max Weight:
              </span>
              <span className="text-slate-900 dark:text-white">
                {record.maxWeight} {record.unit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Max Reps:
              </span>
              <span className="text-slate-900 dark:text-white">
                {record.maxReps}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Max Volume:
              </span>
              <span className="text-slate-900 dark:text-white">
                {Math.round(record.maxVolume)} {record.unit}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Set on {new Date(record.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
