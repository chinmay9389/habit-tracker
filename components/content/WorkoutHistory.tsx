import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trash2, ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
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
import type { Workout } from "./WorkoutTracker";

interface WorkoutHistoryProps {
  workouts: Workout[];
  onDelete: (workoutId: string) => void;
}

export function WorkoutHistory({ workouts, onDelete }: WorkoutHistoryProps) {
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(
    new Set()
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toggleExpand = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  // Group workouts by date
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const date = workout.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  const sortedDates = Object.keys(groupedWorkouts).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <>
      <div className="space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-slate-900 dark:text-white">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
            </div>

            <div className="space-y-3">
              {groupedWorkouts[date].map((workout) => {
                const isExpanded = expandedWorkouts.has(workout.id);
                const totalSets =
                  workout.exercises?.reduce(
                    (sum, ex) => sum + ex.sets.length,
                    0
                  ) || 0;
                const totalVolume =
                  workout.exercises?.reduce(
                    (sum, ex) =>
                      sum +
                      ex.sets.reduce(
                        (setSum, set) => setSum + (set.weight || 0) * set.reps,
                        0
                      ),
                    0
                  ) || 0;

                return (
                  <Card key={workout.id} className="overflow-hidden">
                    <div className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-slate-900 dark:text-white mb-2">
                            {workout.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {workout.duration_minutes && (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {workout.duration_minutes} min
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {workout.exercises?.length || 0} exercises
                            </Badge>
                            <Badge variant="secondary">{totalSets} sets</Badge>
                            {totalVolume > 0 && (
                              <Badge variant="secondary">
                                {Math.round(totalVolume).toLocaleString()} lbs
                                total
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(workout.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(workout.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Notes */}
                      {workout.notes && !isExpanded && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {workout.notes}
                        </p>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {workout.notes && (
                            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {workout.notes}
                              </p>
                            </div>
                          )}

                          {workout.exercises &&
                            workout.exercises.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-sm text-slate-600 dark:text-slate-400">
                                  Exercises:
                                </h5>
                                <div className="space-y-2">
                                  {workout.exercises.map((exercise, index) => {
                                    const totalVolume = exercise.sets.reduce(
                                      (sum, set) =>
                                        sum + (set.weight || 0) * set.reps,
                                      0
                                    );
                                    const totalReps = exercise.sets.reduce(
                                      (sum, set) => sum + set.reps,
                                      0
                                    );

                                    return (
                                      <div
                                        key={index}
                                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-slate-900 dark:text-white">
                                                {exercise.name}
                                              </span>
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {exercise.category}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm text-slate-900 dark:text-white">
                                              {totalVolume > 0
                                                ? Math.round(totalVolume)
                                                : totalReps}
                                            </p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                              {totalVolume > 0
                                                ? "volume"
                                                : "total"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          {exercise.sets.map(
                                            (set, setIndex) => (
                                              <p
                                                key={setIndex}
                                                className="text-sm text-slate-600 dark:text-slate-400"
                                              >
                                                Set {setIndex + 1}: {set.reps}{" "}
                                                reps
                                                {set.weight &&
                                                  set.weight > 0 && (
                                                    <span>
                                                      {" "}
                                                      @ {set.weight}{" "}
                                                      {exercise.unit}
                                                    </span>
                                                  )}
                                              </p>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              workout and all associated exercises.
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
