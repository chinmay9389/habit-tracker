import { createBrowserClient } from "@supabase/ssr";
// Create a single, shared Supabase client for browser components

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
export const logout = async () => {
  console.log("logging out");
  await supabase.auth.signOut();
};
// Database types
export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          color: string;
          category: string;
          frequency: string;
          custom_days: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["habits"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>;
      };
      habit_completions: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          completed_date: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["habit_completions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["habit_completions"]["Insert"]
        >;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string | null;
          title: string;
          description: string;
          icon: string;
          unlocked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["achievements"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          date: string;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["workouts"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          workout_id: string;
          user_id: string;
          name: string;
          category: string;
          sets: { reps: number; weight: number | null }[];
          unit: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["exercises"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
    };
  };
}
