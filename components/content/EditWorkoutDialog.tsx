import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Plus, X, Sparkles, Trash2, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import type { Workout, Exercise, ExerciseSet } from "./WorkoutTracker";
import type { CustomExercise } from "./ManageTemplatesDialog";

interface EditWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout | null;
  onSave: (
    workoutId: string,
    workout: Partial<Workout>,
    exercises: Omit<Exercise, "id" | "workout_id" | "created_at">[]
  ) => void;
  userId: string;
}

const EXERCISE_CATEGORIES = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Other",
];

const EXERCISE_TEMPLATES = [
  // Chest
  {
    name: "Bench Press",
    category: "Chest",
    sets: 3,
    reps: 10,
    weight: 135,
    unit: "lbs",
  },
  {
    name: "Incline Dumbbell Press",
    category: "Chest",
    sets: 3,
    reps: 12,
    weight: 50,
    unit: "lbs",
  },
  {
    name: "Push-ups",
    category: "Chest",
    sets: 3,
    reps: 15,
    weight: 0,
    unit: "lbs",
  },
  {
    name: "Cable Flys",
    category: "Chest",
    sets: 3,
    reps: 12,
    weight: 30,
    unit: "lbs",
  },

  // Back
  {
    name: "Deadlift",
    category: "Back",
    sets: 3,
    reps: 8,
    weight: 225,
    unit: "lbs",
  },
  {
    name: "Pull-ups",
    category: "Back",
    sets: 3,
    reps: 10,
    weight: 0,
    unit: "lbs",
  },
  {
    name: "Barbell Row",
    category: "Back",
    sets: 3,
    reps: 10,
    weight: 135,
    unit: "lbs",
  },
  {
    name: "Lat Pulldown",
    category: "Back",
    sets: 3,
    reps: 12,
    weight: 120,
    unit: "lbs",
  },

  // Shoulders
  {
    name: "Overhead Press",
    category: "Shoulders",
    sets: 3,
    reps: 10,
    weight: 95,
    unit: "lbs",
  },
  {
    name: "Lateral Raises",
    category: "Shoulders",
    sets: 3,
    reps: 12,
    weight: 20,
    unit: "lbs",
  },
  {
    name: "Face Pulls",
    category: "Shoulders",
    sets: 3,
    reps: 15,
    weight: 40,
    unit: "lbs",
  },

  // Arms
  {
    name: "Barbell Curl",
    category: "Arms",
    sets: 3,
    reps: 10,
    weight: 60,
    unit: "lbs",
  },
  {
    name: "Tricep Dips",
    category: "Arms",
    sets: 3,
    reps: 12,
    weight: 0,
    unit: "lbs",
  },
  {
    name: "Hammer Curls",
    category: "Arms",
    sets: 3,
    reps: 12,
    weight: 35,
    unit: "lbs",
  },
  {
    name: "Tricep Pushdown",
    category: "Arms",
    sets: 3,
    reps: 12,
    weight: 50,
    unit: "lbs",
  },

  // Legs
  {
    name: "Squat",
    category: "Legs",
    sets: 3,
    reps: 10,
    weight: 185,
    unit: "lbs",
  },
  {
    name: "Leg Press",
    category: "Legs",
    sets: 3,
    reps: 12,
    weight: 270,
    unit: "lbs",
  },
  {
    name: "Romanian Deadlift",
    category: "Legs",
    sets: 3,
    reps: 10,
    weight: 135,
    unit: "lbs",
  },
  {
    name: "Leg Curl",
    category: "Legs",
    sets: 3,
    reps: 12,
    weight: 90,
    unit: "lbs",
  },
  {
    name: "Calf Raises",
    category: "Legs",
    sets: 3,
    reps: 15,
    weight: 135,
    unit: "lbs",
  },

  // Core
  {
    name: "Plank",
    category: "Core",
    sets: 3,
    reps: 60,
    weight: 0,
    unit: "sec",
  },
  {
    name: "Cable Crunches",
    category: "Core",
    sets: 3,
    reps: 15,
    weight: 80,
    unit: "lbs",
  },
  {
    name: "Russian Twists",
    category: "Core",
    sets: 3,
    reps: 20,
    weight: 25,
    unit: "lbs",
  },

  // Cardio
  {
    name: "Running",
    category: "Cardio",
    sets: 1,
    reps: 30,
    weight: 0,
    unit: "min",
  },
  {
    name: "Cycling",
    category: "Cardio",
    sets: 1,
    reps: 20,
    weight: 0,
    unit: "min",
  },
  {
    name: "Rowing",
    category: "Cardio",
    sets: 1,
    reps: 15,
    weight: 0,
    unit: "min",
  },
];

export function EditWorkoutDialog({
  open,
  onOpenChange,
  workout,
  onSave,
  userId,
}: EditWorkoutDialogProps) {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState("");
  const [duration, setDuration] = useState("");
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<
    Omit<Exercise, "id" | "workout_id" | "created_at">[]
  >([]);

  // Current exercise being added
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("Chest");
  const [currentSets, setCurrentSets] = useState<ExerciseSet[]>([
    { reps: 10, weight: null },
  ]);
  const [unit, setUnit] = useState("lbs");

  // Load workout data when dialog opens
  useEffect(() => {
    if (open && workout) {
      setWorkoutName(workout.name);
      setWorkoutDate(workout.date);
      setDuration(workout.duration_minutes?.toString() || "");
      setNotes(workout.notes || "");

      // Load existing exercises
      if (workout.exercises) {
        setExercises(
          workout.exercises.map((ex) => ({
            user_id: userId,
            name: ex.name,
            category: ex.category,
            sets: ex.sets,
            unit: ex.unit,
          }))
        );
      }

      loadCustomExercises();
    }
  }, [open, workout, userId]);

  const loadCustomExercises = async () => {
    try {
      const { data: exercisesData } = await supabase
        .from("custom_exercises")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (exercisesData) {
        setCustomExercises(
          exercisesData.map((ex) => ({
            ...ex,
            default_sets: ex.default_sets || [{ reps: 10, weight: null }],
          }))
        );
      }
    } catch (error) {
      console.error("Error loading custom exercises:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workoutName.trim()) {
      toast.error("Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    if (!workout) return;

    onSave(
      workout.id,
      {
        name: workoutName.trim(),
        date: workoutDate,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      },
      exercises
    );

    onOpenChange(false);
  };

  const addExercise = () => {
    if (!exerciseName.trim()) {
      toast.error("Please enter an exercise name");
      return;
    }

    if (currentSets.length === 0) {
      toast.error("Please add at least one set");
      return;
    }

    const newExercise: Omit<Exercise, "id" | "workout_id" | "created_at"> = {
      user_id: userId,
      name: exerciseName.trim(),
      category: exerciseCategory,
      sets: currentSets,
      unit,
    };

    setExercises([...exercises, newExercise]);

    // Reset form
    setExerciseName("");
    setExerciseCategory("Chest");
    setCurrentSets([{ reps: 10, weight: null }]);
    setUnit("lbs");

    toast.success("Exercise added!");
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    toast.success("Exercise removed");
  };

  const addSet = () => {
    setCurrentSets([...currentSets, { reps: 10, weight: null }]);
  };

  const updateSet = (
    index: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newSets = [...currentSets];
    if (field === "reps") {
      newSets[index].reps = parseInt(value) || 0;
    } else {
      newSets[index].weight = value ? parseFloat(value) : null;
    }
    setCurrentSets(newSets);
  };

  const removeSet = (index: number) => {
    if (currentSets.length > 1) {
      setCurrentSets(currentSets.filter((_, i) => i !== index));
    }
  };

  const quickAddFromTemplate = (template: (typeof EXERCISE_TEMPLATES)[0]) => {
    setExerciseName(template.name);
    setExerciseCategory(template.category);
    setUnit(template.unit);

    const sets: ExerciseSet[] = [];
    for (let i = 0; i < template.sets; i++) {
      sets.push({
        reps: template.reps,
        weight: template.weight > 0 ? template.weight : null,
      });
    }
    setCurrentSets(sets);

    toast.success(`Template loaded: ${template.name}`);
  };

  const quickAddCustomExercise = (custom: CustomExercise) => {
    setExerciseName(custom.name);
    setExerciseCategory(custom.category);
    setUnit(custom.unit);
    setCurrentSets(custom.default_sets || [{ reps: 10, weight: null }]);

    toast.success(`Loaded: ${custom.name}`);
  };

  const allExercises = [
    ...EXERCISE_TEMPLATES,
    ...customExercises.map((ce) => ({
      name: ce.name,
      category: ce.category,
      sets: ce.default_sets?.length || 3,
      reps: ce.default_sets?.[0]?.reps || 10,
      weight: ce.default_sets?.[0]?.weight || 0,
      unit: ce.unit,
    })),
  ];

  if (!workout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Edit Workout
          </DialogTitle>
          <DialogDescription>
            Modify workout details or add more exercises
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workout Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                placeholder="e.g., Morning Workout"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-date">Date</Label>
              <Input
                id="workout-date"
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Optional"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional workout notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>

          {/* Current Exercises */}
          {exercises.length > 0 && (
            <div className="space-y-3">
              <Label>Current Exercises ({exercises.length})</Label>
              <div className="space-y-2">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white">
                          {exercise.name}
                        </span>
                        <Badge variant="outline">{exercise.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {exercise.sets.length} sets
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Exercise */}
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Add Exercise</TabsTrigger>
              <TabsTrigger value="quick">
                <Sparkles className="w-4 h-4 mr-2" />
                Quick Add
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-name">Exercise Name</Label>
                  <Input
                    id="exercise-name"
                    placeholder="e.g., Bench Press"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={exerciseCategory}
                    onValueChange={setExerciseCategory}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXERCISE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Sets</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSet}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Set
                  </Button>
                </div>

                <div className="space-y-2">
                  {currentSets.map((set, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <span className="text-sm w-12">Set {index + 1}</span>
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(index, "reps", e.target.value)
                        }
                        className="flex-1"
                        min="1"
                      />
                      <Input
                        type="number"
                        placeholder="Weight (optional)"
                        value={set.weight || ""}
                        onChange={(e) =>
                          updateSet(index, "weight", e.target.value)
                        }
                        className="flex-1"
                        step="0.5"
                      />
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lbs">lbs</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="sec">sec</SelectItem>
                          <SelectItem value="min">min</SelectItem>
                        </SelectContent>
                      </Select>
                      {currentSets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSet(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="button" onClick={addExercise} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise to Workout
              </Button>
            </TabsContent>

            <TabsContent value="quick" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Search Exercises</Label>
                <Input
                  placeholder="Search by name..."
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {allExercises
                  .filter(
                    (ex) =>
                      exerciseName === "" ||
                      ex.name.toLowerCase().includes(exerciseName.toLowerCase())
                  )
                  .map((template, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => {
                        if ("id" in template) {
                          quickAddCustomExercise(
                            customExercises.find(
                              (ce) => ce.name === template.name
                            )!
                          );
                        } else {
                          quickAddFromTemplate(
                            template as (typeof EXERCISE_TEMPLATES)[0]
                          );
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {template.name}
                        <Badge variant="secondary">{template.category}</Badge>
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {template.sets}×{template.reps}{" "}
                        {template.weight > 0
                          ? `@ ${template.weight}${template.unit}`
                          : ""}
                      </span>
                    </Button>
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={exercises.length === 0}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
