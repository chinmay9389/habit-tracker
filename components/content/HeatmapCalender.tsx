import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface HeatmapCalendarProps {
  completedDates: string[];
  color: string;
  onToggleDate?: (date: string) => void;
}

export function HeatmapCalendar({
  completedDates,
  color,
  onToggleDate,
}: HeatmapCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const isDateCompleted = (day: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return completedDates.includes(dateString);
  };

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isFutureDate = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleDateClick = (day: number) => {
    if (isFutureDate(day) || !onToggleDate) return;
    const dateString = getDateString(day);
    onToggleDate(dateString);
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Create array of days with empty slots for alignment
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-700 text-sm sm:text-base">{monthName}</div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {onToggleDate && (
        <p className="text-xs text-slate-500 mb-2">
          Click any past date to mark/unmark
        </p>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-slate-500 p-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const completed = isDateCompleted(day);
          const today = isToday(day);
          const future = isFutureDate(day);
          const dateString = getDateString(day);
          const displayDate = new Date(year, month, day).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          );

          return (
            <TooltipProvider key={day}>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={future || !onToggleDate}
                    className={`aspect-square flex items-center justify-center rounded relative transition-all ${
                      !future && onToggleDate
                        ? "hover:scale-110 cursor-pointer"
                        : "cursor-default"
                    }`}
                    style={{
                      backgroundColor: completed
                        ? color
                        : future
                        ? "#f1f5f9"
                        : "#e2e8f0",
                      opacity: future ? 0.3 : 1,
                    }}
                  >
                    <span
                      className={`text-xs ${
                        completed ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {day}
                    </span>
                    {today && (
                      <div
                        className={`absolute inset-0 rounded ring-2 ring-offset-1`}
                        style={
                          { "--tw-ring-color": color } as React.CSSProperties
                        }
                      />
                    )}
                  </button>
                </TooltipTrigger>
                {onToggleDate && !future && (
                  <TooltipContent>
                    <p>{displayDate}</p>
                    <p className="text-xs">
                      {completed ? "Click to unmark" : "Click to mark complete"}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}
