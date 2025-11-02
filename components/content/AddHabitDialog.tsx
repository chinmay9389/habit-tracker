import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import type { Habit, HabitCategory, HabitFrequency } from "../../src/app/page";
import { Sparkles } from "lucide-react";

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (habit: Omit<Habit, "id" | "createdAt" | "completedDates">) => void;
}

const COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Emerald", value: "#10b981" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Blue", value: "#3b82f6" },
];

const CATEGORIES: { value: HabitCategory; label: string; emoji: string }[] = [
  { value: "health", label: "Health", emoji: "🏥" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "productivity", label: "Productivity", emoji: "⚡" },
  { value: "mindfulness", label: "Mindfulness", emoji: "🧘" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "social", label: "Social", emoji: "👥" },
  { value: "other", label: "Other", emoji: "✨" },
];

const TEMPLATES = [
  {
    name: "Drink Water",
    description: "8 glasses a day",
    category: "health" as HabitCategory,
    color: "#06b6d4",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Morning Exercise",
    description: "30 minutes workout",
    category: "fitness" as HabitCategory,
    color: "#f97316",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Read Books",
    description: "Read for 20 minutes",
    category: "learning" as HabitCategory,
    color: "#a855f7",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Meditation",
    description: "10 minutes mindfulness",
    category: "mindfulness" as HabitCategory,
    color: "#10b981",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Journal",
    description: "Daily reflection",
    category: "mindfulness" as HabitCategory,
    color: "#ec4899",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "No Sugar",
    description: "Avoid added sugar",
    category: "health" as HabitCategory,
    color: "#f43f5e",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Learn Code",
    description: "Practice programming",
    category: "learning" as HabitCategory,
    color: "#6366f1",
    frequency: "weekdays" as HabitFrequency,
  },
  {
    name: "Walk 10k Steps",
    description: "Daily step goal",
    category: "fitness" as HabitCategory,
    color: "#10b981",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Call Family",
    description: "Stay connected",
    category: "social" as HabitCategory,
    color: "#ec4899",
    frequency: "weekends" as HabitFrequency,
  },
  {
    name: "Deep Work",
    description: "2 hours focused work",
    category: "productivity" as HabitCategory,
    color: "#3b82f6",
    frequency: "weekdays" as HabitFrequency,
  },
  {
    name: "Stretch",
    description: "Morning stretches",
    category: "fitness" as HabitCategory,
    color: "#a855f7",
    frequency: "daily" as HabitFrequency,
  },
  {
    name: "Gratitude",
    description: "Write 3 things",
    category: "mindfulness" as HabitCategory,
    color: "#f97316",
    frequency: "daily" as HabitFrequency,
  },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AddHabitDialog({
  open,
  onOpenChange,
  onAdd,
}: AddHabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedCategory, setSelectedCategory] =
    useState<HabitCategory>("health");
  const [selectedFrequency, setSelectedFrequency] =
    useState<HabitFrequency>("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    if (selectedFrequency === "custom" && customDays.length === 0) {
      toast.error("Please select at least one day");
      return;
    }

    onAdd({
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      category: selectedCategory,
      frequency: selectedFrequency,
      customDays: selectedFrequency === "custom" ? customDays : undefined,
    });

    resetForm();
    onOpenChange(false);
    toast.success("Habit added successfully!");
  };

  const handleTemplateSelect = (template: (typeof TEMPLATES)[0]) => {
    setName(template.name);
    setDescription(template.description);
    setSelectedColor(template.color);
    setSelectedCategory(template.category);
    setSelectedFrequency(template.frequency);
    setCustomDays([]);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedColor(COLORS[0].value);
    setSelectedCategory("health");
    setSelectedFrequency("daily");
    setCustomDays([]);
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
          <DialogDescription>
            Create a custom habit or choose from our templates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Habit</TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Drink 8 glasses of water"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Stay hydrated throughout the day"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v as HabitCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.emoji} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={selectedFrequency}
                  onValueChange={(v) =>
                    setSelectedFrequency(v as HabitFrequency)
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekdays">
                      Weekdays only (Mon-Fri)
                    </SelectItem>
                    <SelectItem value="weekends">
                      Weekends only (Sat-Sun)
                    </SelectItem>
                    <SelectItem value="custom">Custom days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedFrequency === "custom" && (
                <div className="space-y-2">
                  <Label>Select Days</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map((day, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={
                          customDays.includes(index) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => toggleCustomDay(index)}
                        className="w-14"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className="w-8 h-8 rounded-full transition-all hover:scale-110"
                      style={{
                        backgroundColor: color.value,
                        border:
                          selectedColor === color.value
                            ? "3px solid #1e293b"
                            : "2px solid transparent",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

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
                  Add Habit
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
              {TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(template)}
                  className="p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {template.name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {
                            CATEGORIES.find(
                              (c) => c.value === template.category
                            )?.emoji
                          }{" "}
                          {
                            CATEGORIES.find(
                              (c) => c.value === template.category
                            )?.label
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {template.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {template.frequency === "daily" && "📅 Every day"}
                        {template.frequency === "weekdays" && "📅 Weekdays"}
                        {template.frequency === "weekends" && "📅 Weekends"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-900 dark:text-indigo-300">
              💡 Click any template to customize it before adding
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
