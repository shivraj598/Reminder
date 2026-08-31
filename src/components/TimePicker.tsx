import { useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Period = "AM" | "PM";

type UnitWheelProps = {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (value: number) => void;
};

function clampBetween(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function UnitWheel({
  value,
  min,
  max,
  ariaLabel,
  onChange,
}: UnitWheelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const step = (delta: number) =>
    onChange(clampBetween(value + delta, min, max));

  function beginEdit(): void {
    setDraft(String(value).padStart(2, "0"));
    setEditing(true);
  }

  function commitEdit(): void {
    onChange(clampBetween(Number(draft), min, max));
    setEditing(false);
  }

  function handleDraftKeyDown(event: React.KeyboardEvent): void {
    if (event.key === "Enter") {
      commitEdit();
    } else if (event.key === "Escape") {
      setEditing(false);
    }
  }

  return (
    <div
      className="grid select-none grid-rows-[1fr_auto_1fr] items-center gap-0.5 outline-none"
      onWheel={(event) => {
        if (editing) {
          return;
        }
        if (event.deltaY !== 0) {
          event.preventDefault();
          step(event.deltaY < 0 ? 1 : -1);
        }
      }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={`${ariaLabel} up`}
        onClick={() => step(1)}
        className="mx-auto grid h-6 w-9 place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <ChevronUp className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="grid h-9 w-11 place-items-center overflow-hidden rounded-lg border-2 border-foreground bg-background shadow-[inset_1px_1px_0_hsl(var(--foreground)/0.05)] focus-within:ring-2 focus-within:ring-ring">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value.replace(/\D/g, "").slice(0, 2))
            }
            onBlur={commitEdit}
            onKeyDown={handleDraftKeyDown}
            inputMode="numeric"
            aria-label={ariaLabel}
            className="h-full w-full bg-transparent text-center text-sm font-black tabular-nums text-foreground outline-none"
          />
        ) : (
          <button
            type="button"
            aria-label={`${ariaLabel}, change`}
            onClick={beginEdit}
            className="h-full w-full text-center text-sm font-black tabular-nums text-foreground outline-none"
          >
            {String(value).padStart(2, "0")}
          </button>
        )}
      </div>

      <button
        type="button"
        tabIndex={-1}
        aria-label={`${ariaLabel} down`}
        onClick={() => step(-1)}
        className="mx-auto grid h-6 w-9 place-items-center rounded-md text-foreground/45 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <ChevronDown className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}

type TimePickerProps = {
  hour: number;
  minute: number;
  second: number;
  period: Period;
  onHourChange: (value: number) => void;
  onMinuteChange: (value: number) => void;
  onSecondChange: (value: number) => void;
  onPeriodChange: (value: Period) => void;
};

export type { Period };

export function TimePicker({
  hour,
  minute,
  second,
  period,
  onHourChange,
  onMinuteChange,
  onSecondChange,
  onPeriodChange,
}: TimePickerProps) {
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid gap-2">
      <div
        className="flex items-center justify-center gap-3 rounded-[10px] border-2 border-foreground bg-background/70 p-3"
        onWheel={(event) => {
          if (event.deltaY === 0) {
            return;
          }
          const target = event.target as HTMLElement;
          const unit = target.closest("[data-unit]")?.getAttribute("data-unit");
          if (unit) {
            return;
          }
          event.preventDefault();
          if (typeof hour === "number") {
            const delta = event.deltaY < 0 ? 1 : -1;
            onHourChange(clampBetween(hour + delta, 1, 12));
            if (hourRef.current) {
              hourRef.current
                .querySelector<HTMLButtonElement>('[aria-label*="change"]')
                ?.click();
            }
          }
        }}
      >
        <div className="grid justify-items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Hour
          </span>
          <div ref={hourRef} data-unit="hour">
            <UnitWheel
              value={hour}
              min={1}
              max={12}
              ariaLabel="Hour"
              onChange={onHourChange}
            />
          </div>
        </div>

        <span className="text-xl font-black text-foreground/30">:</span>

        <div className="grid justify-items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Min
          </span>
          <div ref={minuteRef} data-unit="minute">
            <UnitWheel
              value={minute}
              min={0}
              max={59}
              ariaLabel="Minute"
              onChange={onMinuteChange}
            />
          </div>
        </div>

        <span className="text-xl font-black text-foreground/30">:</span>

        <div className="grid justify-items-center gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sec
          </span>
          <div ref={secondRef} data-unit="second">
            <UnitWheel
              value={second}
              min={0}
              max={59}
              ariaLabel="Second"
              onChange={onSecondChange}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <div className="grid grid-cols-2 gap-1 rounded-[10px] border-2 border-foreground bg-background p-1">
          {(["AM", "PM"] as Period[]).map((option) => {
            const active = period === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onPeriodChange(option)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border-2 border-transparent px-4 py-1.5 text-sm font-black tracking-wide transition-colors",
                  active
                    ? "border-foreground bg-amber-400 text-amber-950"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
