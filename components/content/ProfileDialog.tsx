import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  TrendingUp,
  Dumbbell,
  Loader2,
  Save,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Habit } from "@/app/page";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SupabaseUser;
  habits: Habit[];
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  habits,
}: ProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.user_metadata?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [workoutCount, setWorkoutCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);

  useEffect(() => {
    if (open) {
      loadWorkoutStats();
    }
  }, [open]);

  const loadWorkoutStats = async () => {
    try {
      // Get workout count
      const { data: workouts, error: workoutsError } = await supabase
        .from("workouts")
        .select("id")
        .eq("user_id", user.id);

      if (workoutsError) throw workoutsError;

      // Get total exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("id")
        .eq("user_id", user.id);

      if (exercisesError) throw exercisesError;

      setWorkoutCount(workouts?.length || 0);
      setTotalExercises(exercises?.length || 0);
    } catch (error) {
      console.error("Error loading workout stats:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user metadata (name)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: name.trim() },
      });

      if (updateError) throw updateError;

      toast.success("Profile updated! ✅");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully! 🔒");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const getTotalCompletions = () => {
    return habits.reduce(
      (total, habit) => total + habit.completedDates.length,
      0
    );
  };

  const getAccountAge = () => {
    const created = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            View and manage your account information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Stats */}
          <div>
            <h3 className="mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Your Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <div className="text-2xl mb-1">{habits.length}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Active Habits
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl mb-1">{getTotalCompletions()}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Total Completions
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl mb-1">{workoutCount}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Workouts Logged
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="text-2xl mb-1">{totalExercises}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Exercises Done
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div>
            <h3 className="mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Account Information
            </h3>
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Email
                  </div>
                  <div className="text-sm">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Member Since
                  </div>
                  <div className="text-sm">{getAccountAge()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    User ID
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {user.id.slice(0, 20)}...
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Update Profile */}
          <div>
            <h3 className="mb-3">Update Profile</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This name will be displayed in the app header
                </p>
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </div>

          <Separator />

          {/* Change Password */}
          <div>
            <h3 className="mb-3">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must be at least 6 characters
                </p>
              </div>

              <Button
                type="submit"
                variant="outline"
                disabled={loading || !newPassword || !confirmPassword}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>🔒 Change Password</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
