import { useEffect, useState } from "react";
import {
  AlarmClock,
  Bell,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  MSG_GENERAL_SYNC,
  MSG_GENERAL_TEST_REMINDER,
} from "../constants";
import {
  formatReminderTime,
  loadGeneralReminders,
  nextOccurrence,
  saveGeneralReminders,
  type GeneralReminder,
} from "../general-reminders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const MAX_MESSAGE_LENGTH = 240;

type DraftTime = {
  hour: string;
  minute: string;
};

export function GeneralTab() {
  const [reminders, setReminders] = useState<GeneralReminder[]>([]);
  const [message, setMessage] = useState("");
  const [time, setTime] = useState<DraftTime>({ hour: "14", minute: "00" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    const next = await loadGeneralReminders();
    setReminders(next);
    setStatus("Reminders saved. Each will fire at its set time.");
  }

  function handleAddOrUpdate(): void {
    setError("");
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Enter a reminder message.");
      return;
    }
    const hour = clampInt(time.hour, 23);
    const minute = clampInt(time.minute, 59);
    setSaving(true);
    void (async () => {
      try {
        let next: GeneralReminder[];
        if (editingId) {
          next = reminders.map((item) =>
            item.id === editingId
              ? { ...item, message: trimmed, hour, minute }
              : item,
          );
        } else {
          next = [
            ...reminders,
            {
              id: crypto.randomUUID(),
              message: trimmed,
              hour,
              minute,
              enabled: true,
            },
          ];
        }
        await saveGeneralReminders(next);
        await syncOnBackground();
        setMessage("");
        setEditingId(null);
        setTime({ hour: "14", minute: "00" });
        await refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save the reminder.",
        );
      } finally {
        setSaving(false);
      }
    })();
  }

  function startEdit(reminder: GeneralReminder): void {
    setEditingId(reminder.id);
    setMessage(reminder.message);
    setTime({
      hour: reminder.hour.toString().padStart(2, "0"),
      minute: reminder.minute.toString().padStart(2, "0"),
    });
    setError("");
  }

  async function toggleReminder(reminder: GeneralReminder): Promise<void> {
    const next = reminders.map((item) =>
      item.id === reminder.id ? { ...item, enabled: !item.enabled } : item,
    );
    await saveGeneralReminders(next);
    await syncOnBackground();
    await refresh();
  }

  async function removeReminder(id: string): Promise<void> {
    if (editingId === id) {
      setEditingId(null);
      setMessage("");
    }
    const next = reminders.filter((item) => item.id !== id);
    await saveGeneralReminders(next);
    await syncOnBackground();
    await refresh();
  }

  function testReminder(reminder: GeneralReminder): void {
    setError("");
    void chrome.runtime.sendMessage({
      type: MSG_GENERAL_TEST_REMINDER,
      message: reminder.message,
    });
  }

  async function syncOnBackground(): Promise<void> {
    void chrome.runtime.sendMessage({ type: MSG_GENERAL_SYNC }).catch(() => {});
  }

  function handleTimeChange(field: "hour" | "minute", value: string): void {
    let digits = value.replace(/\D/g, "").slice(0, 2);
    if (field === "minute" && digits.length > 0) {
      digits = Math.min(59, Number(digits)).toString().padStart(2, "0");
    } else if (field === "hour" && digits.length > 0) {
      digits = Math.min(23, Number(digits)).toString().padStart(2, "0");
    }
    setTime((prev) => ({ ...prev, [field]: digits }));
  }

  function clampInt(value: string, max: number): number {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return 0;
    }
    return Math.min(max, Math.max(0, Math.floor(num)));
  }

  const formLabel = editingId ? "Edit reminder" : "New reminder";

  return (
    <div className="grid gap-3">
      <Card className="tape">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Pencil className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
            {formLabel}
          </CardTitle>
          <CardDescription>
            Pick a message and a time. It fires once, daily.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="general-message" className="text-xs font-bold text-muted-foreground">
                Reminder message
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="general-message"
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="e.g. Call the dentist"
              className="bg-background/60"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="general-time" className="text-xs font-bold text-muted-foreground">
              Time of day
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="general-time"
                  type="text"
                  inputMode="numeric"
                  value={time.hour}
                  onChange={(event) => handleTimeChange("hour", event.target.value)}
                  aria-label="Hour"
                  className="pl-8 text-center"
                  maxLength={2}
                />
              </div>
              <span className="text-muted-foreground">:</span>
              <Input
                type="text"
                inputMode="numeric"
                value={time.minute}
                onChange={(event) => handleTimeChange("minute", event.target.value)}
                aria-label="Minute"
                className="w-16 text-center"
                maxLength={2}
              />
              <div className="ml-auto text-right">
                <p className="text-lg font-black tabular-nums text-amber-500">
                  {formatReminderTime(
                    clampInt(time.hour, 23),
                    clampInt(time.minute, 59),
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  24-hour format
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={saving}
            onClick={handleAddOrUpdate}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? "Save changes" : "Add reminder"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setMessage("");
                setTime({ hour: "14", minute: "00" });
                setError("");
              }}
              className="w-full"
            >
              Cancel editing
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Bell className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
            Your reminders
          </CardTitle>
          <CardDescription>
            {reminders.length === 0
              ? "Nothing scheduled yet."
              : `${reminders.length} scheduled`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {reminders.length === 0 ? (
            <div className="hatch grid place-items-center gap-1 rounded-[10px] border-2 border-dashed border-foreground/40 py-6 text-center">
              <AlarmClock className="h-5 w-5 text-muted-foreground/70" strokeWidth={2.5} />
              <p className="text-xs font-medium text-muted-foreground">
                Add your first reminder above.
              </p>
            </div>
          ) : (
            reminders.map((reminder) => {
              const next = nextOccurrence(reminder.hour, reminder.minute);
              const isActive = reminder.enabled && next > Date.now();
              return (
                <div
                  key={reminder.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border-2 border-foreground bg-background p-3"
                >
                  <div
                    className={`hatch grid h-9 w-9 place-items-center rounded-[8px] border-2 border-foreground text-sm font-semibold ${
                      isActive ? "hatch-amber text-amber-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {reminder.message}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        isActive ? "text-amber-700" : "text-muted-foreground"
                      }`}
                    >
                      {formatReminderTime(reminder.hour, reminder.minute)}
                      {isActive ? " · daily" : " · paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={() => void toggleReminder(reminder)}
                      aria-label={`Enable or disable reminder`}
                      className="data-[state=checked]:bg-amber-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Test reminder"
                      title="Test now"
                      onClick={() => testReminder(reminder)}
                      className="h-8 w-8"
                    >
                      <Bell className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Edit reminder"
                      title="Edit"
                      onClick={() => startEdit(reminder)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete reminder"
                      title="Delete"
                      onClick={() => void removeReminder(reminder.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <p
          className="min-h-[1em] text-center text-xs text-muted-foreground"
          role="status"
        >
          {status}
        </p>
        <p
          className="min-h-[1em] text-center text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      </div>
    </div>
  );
}
