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
import { Plus, X, Sparkles, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import type { Workout, Exercise, ExerciseSet } from "./WorkoutTracker";
import type { CustomExercise, CustomTemplate } from "./ManageTemplatesDialog";

interface AddWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (
    workout: Omit<Workout, "id" | "created_at" | "updated_at">,
    exercises: Omit<Exercise, "id" | "workout_id" | "created_at">[]
  ) => void;
  userId: string;
  refreshTrigger?: number;
}

export const EXERCISE_CATEGORIES = [
  "Chest",
  "Shoulders",
  "Triceps",
  "Back",
  "Biceps",
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

const WORKOUT_TEMPLATES = [
  {
    name: "Push Day",
    exercises: [
      "Bench Press",
      "Incline Dumbbell Press",
      "Overhead Press",
      "Lateral Raises",
      "Tricep Pushdown",
    ],
  },
  {
    name: "Pull Day",
    exercises: [
      "Deadlift",
      "Pull-ups",
      "Barbell Row",
      "Lat Pulldown",
      "Barbell Curl",
      "Hammer Curls",
    ],
  },
  {
    name: "Leg Day",
    exercises: [
      "Squat",
      "Romanian Deadlift",
      "Leg Press",
      "Leg Curl",
      "Calf Raises",
    ],
  },
  {
    name: "Upper Body",
    exercises: [
      "Bench Press",
      "Barbell Row",
      "Overhead Press",
      "Pull-ups",
      "Barbell Curl",
      "Tricep Dips",
    ],
  },
  {
    name: "Full Body",
    exercises: [
      "Squat",
      "Bench Press",
      "Deadlift",
      "Overhead Press",
      "Pull-ups",
    ],
  },
];

export function AddWorkoutDialog({
  open,
  onOpenChange,
  onAdd,
  userId,
  refreshTrigger,
}: AddWorkoutDialogProps) {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState("");
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
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

  // Load custom exercises and templates
  useEffect(() => {
    if (open) {
      loadCustomData();
    }
  }, [open, userId, refreshTrigger]);

  const loadCustomData = async () => {
    try {
      // Load custom exercises
      const { data: exercisesData } = await supabase
        .from("custom_exercises")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (exercisesData) {
        setCustomExercises(
          exercisesData.map((ex: any) => ({
            ...ex,
            default_sets: ex.default_sets || [{ reps: 10, weight: null }],
          }))
        );
      }

      // Load custom templates
      const { data: templatesData } = await supabase
        .from("custom_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (templatesData) {
        setCustomTemplates(
          templatesData.map((t) => ({
            ...t,
            exercises: t.exercises || [],
          }))
        );
      }
    } catch (error) {
      // Fallback to localStorage
      const savedExercises = localStorage.getItem("customExercises");
      const savedTemplates = localStorage.getItem("customTemplates");
      if (savedExercises) setCustomExercises(JSON.parse(savedExercises));
      if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates));
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

    onAdd(
      {
        user_id: userId,
        name: workoutName.trim(),
        date: workoutDate,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      },
      exercises
    );

    resetForm();
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

    // Reset exercise form
    setExerciseName("");
    setCurrentSets([{ reps: 10, weight: null }]);

    toast.success("Exercise added!");
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSet = () => {
    setCurrentSets([...currentSets, { reps: 10, weight: null }]);
  };

  const removeSet = (index: number) => {
    if (currentSets.length > 1) {
      setCurrentSets(currentSets.filter((_, i) => i !== index));
    }
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

  const addTemplateExercise = (template: (typeof EXERCISE_TEMPLATES)[0]) => {
    const sets: ExerciseSet[] = Array(template.sets)
      .fill(null)
      .map(() => ({
        reps: template.reps,
        weight: template.weight || null,
      }));

    const newExercise: Omit<Exercise, "id" | "workout_id" | "created_at"> = {
      user_id: userId,
      name: template.name,
      category: template.category,
      sets,
      unit: template.unit,
    };
    setExercises([...exercises, newExercise]);
    toast.success(`${template.name} added!`);
  };

  const loadWorkoutTemplate = (template: (typeof WORKOUT_TEMPLATES)[0]) => {
    setWorkoutName(template.name);
    const templateExercises = template.exercises
      .map((name) => EXERCISE_TEMPLATES.find((ex) => ex.name === name))
      .filter(Boolean)
      .map((ex) => {
        const sets: ExerciseSet[] = Array(ex!.sets)
          .fill(null)
          .map(() => ({
            reps: ex!.reps,
            weight: ex!.weight || null,
          }));

        return {
          user_id: userId,
          name: ex!.name,
          category: ex!.category,
          sets,
          unit: ex!.unit,
        };
      });
    setExercises(templateExercises);
    toast.success(`${template.name} template loaded!`);
  };

  const loadCustomTemplate = (template: CustomTemplate) => {
    setWorkoutName(template.name);
    const templateExercises = template.exercises.map((ex) => ({
      user_id: userId,
      name: ex.name,
      category: ex.category,
      sets: [...ex.sets], // Clone the sets array
      unit: ex.unit,
    }));
    setExercises(templateExercises);
    toast.success(`${template.name} template loaded!`);
  };

  const addCustomExerciseToWorkout = (exercise: CustomExercise) => {
    const newExercise: Omit<Exercise, "id" | "workout_id" | "created_at"> = {
      user_id: userId,
      name: exercise.name,
      category: exercise.category,
      sets: [...exercise.default_sets], // Clone the sets
      unit: exercise.unit,
    };
    setExercises([...exercises, newExercise]);
    toast.success(`${exercise.name} added!`);
  };

  const resetForm = () => {
    setWorkoutName("");
    setWorkoutDate(new Date().toISOString().split("T")[0]);
    setDuration("");
    setNotes("");
    setExercises([]);
    setExerciseName("");
    setCurrentSets([{ reps: 10, weight: null }]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Workout</DialogTitle>
          <DialogDescription>
            Track your exercises, sets, reps, and weights
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Workout</TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="space-y-4">
              {/* Custom Templates */}
              {customTemplates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-500" />
                    <h4 className="text-slate-900 dark:text-white">
                      Your Templates
                    </h4>
                  </div>
                  <div className="grid gap-3">
                    {customTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => loadCustomTemplate(template)}
                        className="p-4 rounded-lg border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-400 dark:hover:border-amber-700 transition-colors text-left"
                      >
                        <h5 className="text-slate-900 dark:text-white mb-2">
                          {template.name}
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {template.exercises.map((ex, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {ex.name}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in Templates */}
              <div>
                <h4 className="text-slate-900 dark:text-white mb-3">
                  Built-in Templates
                </h4>
                <div className="grid gap-3">
                  {WORKOUT_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => loadWorkoutTemplate(template)}
                      className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-left"
                    >
                      <h5 className="text-slate-900 dark:text-white mb-2">
                        {template.name}
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {template.exercises.map((ex, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Exercises */}
              {customExercises.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-amber-500" />
                    <h4 className="text-slate-900 dark:text-white">
                      Your Quick Add Exercises
                    </h4>
                  </div>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {customExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => addCustomExerciseToWorkout(exercise)}
                        className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-400 dark:hover:border-amber-700 transition-colors text-left text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 dark:text-white">
                            {exercise.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {exercise.category}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Built-in Exercises */}
              <div>
                <h4 className="text-slate-900 dark:text-white mb-3">
                  Built-in Exercises
                </h4>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {EXERCISE_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => addTemplateExercise(template)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-left text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-slate-900 dark:text-white">
                          {template.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workout Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label htmlFor="workoutName">Workout Name *</Label>
                  <Input
                    id="workoutName"
                    placeholder="e.g., Chest & Triceps"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="How did you feel? Any PRs?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Add Exercise Section */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4">
                <h4 className="text-slate-900 dark:text-white mb-4">
                  Add Exercise
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="exerciseName">Exercise Name</Label>
                      <Input
                        id="exerciseName"
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

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger id="unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lbs">lbs</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="sec">sec</SelectItem>
                          <SelectItem value="min">min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sets Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sets</Label>
                      <Button
                        type="button"
                        onClick={addSet}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Set
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentSets.map((set, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                        >
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-16">
                            Set {index + 1}
                          </span>
                          <div className="flex-1 flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="number"
                                placeholder="Reps"
                                value={set.reps || ""}
                                onChange={(e) =>
                                  updateSet(index, "reps", e.target.value)
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="Weight"
                                value={set.weight || ""}
                                onChange={(e) =>
                                  updateSet(index, "weight", e.target.value)
                                }
                              />
                            </div>
                          </div>
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
                </div>

                <Button
                  type="button"
                  onClick={addExercise}
                  variant="outline"
                  className="w-full gap-2 mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </Button>
              </div>

              {/* Exercise List */}
              {exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-slate-900 dark:text-white">
                    Exercises ({exercises.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-900 dark:text-white">
                              {exercise.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {exercise.category}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {exercise.sets.map((set, setIndex) => (
                              <p
                                key={setIndex}
                                className="text-sm text-slate-600 dark:text-slate-400"
                              >
                                Set {setIndex + 1}: {set.reps} reps
                                {set.weight &&
                                  ` @ ${set.weight} ${exercise.unit}`}
                              </p>
                            ))}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Log Workout
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
