"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/** "14:30" -> "2:30 PM" for display; the stored value stays 24h. */
function formatTimeLabel(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" into a local Date. */
function parseValue(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date as "YYYY-MM-DD" in local time — handy for minDate/maxDate. */
export function todayDateValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Format a Date to the input value format. */
function toValue(d: Date, includeTime: boolean, time: string): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return includeTime ? `${date}T${time}` : date;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export interface DatePickerProps {
  id?: string;
  /** "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (with includeTime). */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** "YYYY-MM-DD" bounds for selectable days. */
  minDate?: string;
  maxDate?: string;
  /** Show a time field inside the panel; value becomes "YYYY-MM-DDTHH:mm". */
  includeTime?: boolean;
  className?: string;
}

/** Theme-matched calendar popover replacing the native date input. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  minDate,
  maxDate,
  includeTime = false,
  className,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseValue(value);
  const today = useMemo(() => new Date(), []);
  const min = parseValue(minDate);
  const max = parseValue(maxDate);

  const [view, setView] = useState(() => selected ?? today);
  const time = includeTime ? (value?.slice(11, 16) || "09:00") : "";

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (rootRef.current?.contains(target)) return;
      // Radix Select portals its listbox to document.body — don't treat
      // clicks inside the month/year dropdowns as "outside".
      if (target.closest?.("[data-datepicker-inner]")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Let an open Select dropdown consume Escape first.
      if (document.querySelector("[data-datepicker-inner]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isDisabledDay = (d: Date) =>
    (min && d < min) || (max && d > max) || false;

  const select = (d: Date) => {
    onChange?.(toValue(d, includeTime, time || "09:00"));
    if (!includeTime) setOpen(false);
  };

  const setTimePart = (part: "h" | "m", v: string) => {
    const [h = "09", m = "00"] = (time || "09:00").split(":");
    const next = part === "h" ? `${v}:${m}` : `${h}:${v}`;
    // Picking a time before a date defaults the date to today.
    onChange?.(toValue(selected ?? today, true, next));
  };

  const shiftMonth = (delta: number) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  // 6x7 grid starting on the Sunday of the first visible week.
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  const years = useMemo(() => {
    const from = (min?.getFullYear() ?? today.getFullYear() - 100);
    const to = max?.getFullYear() ?? today.getFullYear() + 10;
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, maxDate]);

  const headerSelectTrigger =
    "h-7 w-auto gap-1 rounded-md border-transparent bg-transparent px-1.5 py-0 text-sm font-semibold shadow-none hover:bg-muted focus:ring-ring/30 [&>svg]:h-3.5 [&>svg]:w-3.5";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Trigger — styled like Input */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          // Reset the visible month to the selected date when opening.
          if (!open) setView(selected ?? today);
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-9 w-full items-center rounded-lg border border-input bg-card px-3 py-1 text-base shadow-2xs transition-all md:text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary ring-2 ring-ring/30"
        )}
      >
        <CalendarIcon className="mr-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "truncate text-left",
            selected ? "text-foreground" : "text-muted-foreground/70"
          )}
        >
          {selected
            ? selected.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }) + (includeTime ? ` · ${formatTimeLabel(time)}` : "")
            : placeholder}
        </span>
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {/* Calendar panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-[272px] rounded-xl border border-border/80 bg-card p-3 shadow-lg animate-fade-up">
          {/* Month / year header */}
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-0.5">
              <Select
                value={String(view.getMonth())}
                onValueChange={(v) =>
                  setView(new Date(view.getFullYear(), +v, 1))
                }
              >
                <SelectTrigger
                  className={headerSelectTrigger}
                  aria-label="Month"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent data-datepicker-inner>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(view.getFullYear())}
                onValueChange={(v) =>
                  setView(new Date(+v, view.getMonth(), 1))
                }
              >
                <SelectTrigger
                  className={headerSelectTrigger}
                  aria-label="Year"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent data-datepicker-inner>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="mt-2 grid grid-cols-7 text-center">
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                className="py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const out = d.getMonth() !== view.getMonth();
              const isSel = selected ? sameDay(d, selected) : false;
              const isToday = sameDay(d, today);
              const disabledDay = isDisabledDay(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => select(d)}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    isSel
                      ? "bg-primary font-bold text-primary-foreground shadow-xs"
                      : isToday
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted",
                    out && !isSel && "text-muted-foreground/50",
                    disabledDay &&
                      "cursor-not-allowed text-muted-foreground/30 hover:bg-transparent"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Optional time field (datetime mode) — themed hour/minute selects */}
          {includeTime && (
            <div className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="mr-auto text-xs font-semibold text-muted-foreground">
                Time
              </span>

              <Select
                value={time.split(":")[0] ?? "09"}
                onValueChange={(v) => setTimePart("h", v)}
              >
                <SelectTrigger
                  className="h-7 w-[52px] gap-0.5 rounded-md border-input bg-card px-1.5 py-0 text-xs font-semibold shadow-none focus:ring-ring/30 [&>svg]:h-3 [&>svg]:w-3"
                  aria-label="Hour"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent data-datepicker-inner className="min-w-[4.5rem]">
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h} className="text-xs">
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-sm font-bold text-muted-foreground">:</span>

              <Select
                value={time.split(":")[1] ?? "00"}
                onValueChange={(v) => setTimePart("m", v)}
              >
                <SelectTrigger
                  className="h-7 w-[52px] gap-0.5 rounded-md border-input bg-card px-1.5 py-0 text-xs font-semibold shadow-none focus:ring-ring/30 [&>svg]:h-3 [&>svg]:w-3"
                  aria-label="Minute"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent data-datepicker-inner className="min-w-[4.5rem]">
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2.5">
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => select(today)}
              className="text-xs font-semibold text-primary hover:text-primary/80"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
