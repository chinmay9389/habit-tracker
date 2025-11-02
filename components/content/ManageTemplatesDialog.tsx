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
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Plus, X, Trash2, Edit2, Check } from "lucide-react";
import { Card } from "../ui/card";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
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
import type { ExerciseSet } from "./WorkoutTracker";

export interface CustomExercise {
  id: string;
  user_id: string;
  name: string;
  category: string;
  default_sets: ExerciseSet[];
  unit: string;
  created_at: string;
}

export interface CustomTemplate {
  id: string;
  user_id: string;
  name: string;
  exercises: {
    name: string;
    category: string;
    sets: ExerciseSet[];
    unit: string;
  }[];
  created_at: string;
}

interface ManageTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onTemplatesChange?: () => void;
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

export function ManageTemplatesDialog({
  open,
  onOpenChange,
  userId,
  onTemplatesChange,
}: ManageTemplatesDialogProps) {
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // New exercise form
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState("Chest");
  const [newExerciseSets, setNewExerciseSets] = useState<ExerciseSet[]>([
    { reps: 10, weight: null },
  ]);
  const [newExerciseUnit, setNewExerciseUnit] = useState("lbs");

  // New template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateExercises, setTemplateExercises] = useState<string[]>([]);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"exercise" | "template">(
    "exercise"
  );

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load custom exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("custom_exercises")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (exercisesError && exercisesError.code !== "PGRST116") {
        throw exercisesError;
      }

      if (exercisesData) {
        setCustomExercises(
          exercisesData.map((ex) => ({
            ...ex,
            default_sets: ex.default_sets || [{ reps: 10, weight: null }],
          }))
        );
      }

      // Load custom templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("custom_templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (templatesError && templatesError.code !== "PGRST116") {
        throw templatesError;
      }

      if (templatesData) {
        setCustomTemplates(
          templatesData.map((t) => ({
            ...t,
            exercises: t.exercises || [],
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading custom data:", error);
      // Load from localStorage as fallback
      const savedExercises = localStorage.getItem("customExercises");
      const savedTemplates = localStorage.getItem("customTemplates");
      if (savedExercises) setCustomExercises(JSON.parse(savedExercises));
      if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates));
    } finally {
      setLoading(false);
    }
  };

  const addCustomExercise = async () => {
    if (!newExerciseName.trim()) {
      toast.error("Please enter an exercise name");
      return;
    }

    try {
      const newExercise: Omit<CustomExercise, "id" | "created_at"> = {
        user_id: userId,
        name: newExerciseName.trim(),
        category: newExerciseCategory,
        default_sets: newExerciseSets,
        unit: newExerciseUnit,
      };

      const { data, error } = await supabase
        .from("custom_exercises")
        .insert([newExercise])
        .select()
        .single();

      if (error) throw error;

      setCustomExercises([data, ...customExercises]);
      localStorage.setItem(
        "customExercises",
        JSON.stringify([data, ...customExercises])
      );

      // Reset form
      setNewExerciseName("");
      setNewExerciseSets([{ reps: 10, weight: null }]);

      toast.success("Exercise added!");
      onTemplatesChange?.();
    } catch (error: any) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise");
    }
  };

  const deleteCustomExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_exercises")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const updated = customExercises.filter((ex) => ex.id !== id);
      setCustomExercises(updated);
      localStorage.setItem("customExercises", JSON.stringify(updated));

      toast.success("Exercise deleted");
      onTemplatesChange?.();
    } catch (error: any) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to delete exercise");
    }
  };

  const addCustomTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (templateExercises.length === 0) {
      toast.error("Please add at least one exercise to the template");
      return;
    }

    try {
      const exercises = templateExercises.map((exerciseId) => {
        const exercise = customExercises.find((ex) => ex.id === exerciseId);
        return {
          name: exercise!.name,
          category: exercise!.category,
          sets: exercise!.default_sets,
          unit: exercise!.unit,
        };
      });

      const newTemplate: Omit<CustomTemplate, "id" | "created_at"> = {
        user_id: userId,
        name: newTemplateName.trim(),
        exercises,
      };

      const { data, error } = await supabase
        .from("custom_templates")
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;

      setCustomTemplates([data, ...customTemplates]);
      localStorage.setItem(
        "customTemplates",
        JSON.stringify([data, ...customTemplates])
      );

      // Reset form
      setNewTemplateName("");
      setTemplateExercises([]);

      toast.success("Template created!");
      onTemplatesChange?.();
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    }
  };

  const deleteCustomTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const updated = customTemplates.filter((t) => t.id !== id);
      setCustomTemplates(updated);
      localStorage.setItem("customTemplates", JSON.stringify(updated));

      toast.success("Template deleted");
      onTemplatesChange?.();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  const addSetToExercise = () => {
    setNewExerciseSets([...newExerciseSets, { reps: 10, weight: null }]);
  };

  const removeSetFromExercise = (index: number) => {
    if (newExerciseSets.length > 1) {
      setNewExerciseSets(newExerciseSets.filter((_, i) => i !== index));
    }
  };

  const updateExerciseSet = (
    index: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const newSets = [...newExerciseSets];
    if (field === "reps") {
      newSets[index].reps = parseInt(value) || 0;
    } else {
      newSets[index].weight = value ? parseFloat(value) : null;
    }
    setNewExerciseSets(newSets);
  };

  const toggleTemplateExercise = (exerciseId: string) => {
    if (templateExercises.includes(exerciseId)) {
      setTemplateExercises(templateExercises.filter((id) => id !== exerciseId));
    } else {
      setTemplateExercises([...templateExercises, exerciseId]);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      if (deleteType === "exercise") {
        deleteCustomExercise(deleteId);
      } else {
        deleteCustomTemplate(deleteId);
      }
      setDeleteId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Templates & Exercises</DialogTitle>
            <DialogDescription>
              Create custom exercises and workout templates for quick access
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="exercises">Custom Exercises</TabsTrigger>
              <TabsTrigger value="templates">Workout Templates</TabsTrigger>
            </TabsList>

            {/* Custom Exercises Tab */}
            <TabsContent value="exercises" className="mt-4 space-y-4">
              {/* Add New Exercise Form */}
              <Card className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700">
                <h4 className="text-slate-900 dark:text-white mb-4">
                  Add Custom Exercise
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="exerciseName">Exercise Name</Label>
                      <Input
                        id="exerciseName"
                        placeholder="e.g., Incline Bench Press"
                        value={newExerciseName}
                        onChange={(e) => setNewExerciseName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newExerciseCategory}
                        onValueChange={setNewExerciseCategory}
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
                      <Select
                        value={newExerciseUnit}
                        onValueChange={setNewExerciseUnit}
                      >
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

                  {/* Default Sets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Default Sets</Label>
                      <Button
                        type="button"
                        onClick={addSetToExercise}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Add Set
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {newExerciseSets.map((set, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                        >
                          <span className="text-sm text-slate-600 dark:text-slate-400 w-12">
                            Set {index + 1}
                          </span>
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={set.reps || ""}
                            onChange={(e) =>
                              updateExerciseSet(index, "reps", e.target.value)
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Weight"
                            value={set.weight || ""}
                            onChange={(e) =>
                              updateExerciseSet(index, "weight", e.target.value)
                            }
                            className="flex-1"
                          />
                          {newExerciseSets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSetFromExercise(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={addCustomExercise} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Exercise
                  </Button>
                </div>
              </Card>

              {/* Existing Custom Exercises */}
              <div className="space-y-2">
                <h4 className="text-slate-900 dark:text-white">
                  Your Custom Exercises ({customExercises.length})
                </h4>
                {customExercises.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                    No custom exercises yet. Add one above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customExercises.map((exercise) => (
                      <Card key={exercise.id} className="p-4">
                        <div className="flex items-start justify-between">
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
                              {exercise.default_sets.map((set, index) => (
                                <p
                                  key={index}
                                  className="text-sm text-slate-600 dark:text-slate-400"
                                >
                                  Set {index + 1}: {set.reps} reps
                                  {set.weight &&
                                    ` @ ${set.weight} ${exercise.unit}`}
                                </p>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(exercise.id);
                              setDeleteType("exercise");
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Custom Templates Tab */}
            <TabsContent value="templates" className="mt-4 space-y-4">
              {/* Add New Template Form */}
              <Card className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700">
                <h4 className="text-slate-900 dark:text-white mb-4">
                  Create Workout Template
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      placeholder="e.g., My Push Day"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>

                  {customExercises.length === 0 ? (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200">
                      <p className="text-sm">
                        Create some custom exercises first, then you can combine
                        them into templates!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Select Exercises</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {customExercises.map((exercise) => (
                            <button
                              key={exercise.id}
                              type="button"
                              onClick={() =>
                                toggleTemplateExercise(exercise.id)
                              }
                              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                                templateExercises.includes(exercise.id)
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      templateExercises.includes(exercise.id)
                                        ? "border-indigo-500 bg-indigo-500"
                                        : "border-slate-300 dark:border-slate-600"
                                    }`}
                                  >
                                    {templateExercises.includes(
                                      exercise.id
                                    ) && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <span className="text-slate-900 dark:text-white">
                                    {exercise.name}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {exercise.category}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={addCustomTemplate}
                        className="w-full gap-2"
                        disabled={templateExercises.length === 0}
                      >
                        <Plus className="w-4 h-4" />
                        Create Template
                      </Button>
                    </>
                  )}
                </div>
              </Card>

              {/* Existing Custom Templates */}
              <div className="space-y-2">
                <h4 className="text-slate-900 dark:text-white">
                  Your Templates ({customTemplates.length})
                </h4>
                {customTemplates.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                    No custom templates yet. Create one above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customTemplates.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-slate-900 dark:text-white">
                            {template.name}
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(template.id);
                              setDeleteType("template");
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteType === "exercise" ? "Exercise" : "Template"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this{" "}
              {deleteType === "exercise" ? "exercise" : "template"}.
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
