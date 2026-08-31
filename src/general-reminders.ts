import { GENERAL_STORAGE_KEY } from "./constants";

export type GeneralReminder = {
  id: string;
  message: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

const MAX_MESSAGE_LENGTH = 240;

export async function loadGeneralReminders(): Promise<GeneralReminder[]> {
  const result =
    await chrome.storage.local.get<Record<string, unknown>>(GENERAL_STORAGE_KEY);
  const stored = result[GENERAL_STORAGE_KEY];
  if (!Array.isArray(stored)) {
    return [];
  }
  const reminders: GeneralReminder[] = [];
  for (const item of stored) {
    const reminder = sanitizeReminder(item);
    if (reminder) {
      reminders.push(reminder);
    }
  }
  return reminders;
}

export async function saveGeneralReminders(
  reminders: GeneralReminder[],
): Promise<void> {
  const clean = reminders
    .map(sanitizeReminder)
    .filter((r): r is GeneralReminder => Boolean(r));
  await chrome.storage.local.set({ [GENERAL_STORAGE_KEY]: clean });
}

function sanitizeReminder(value: unknown): GeneralReminder | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const message =
    typeof record.message === "string" ? record.message.trim() : "";
  if (!message) {
    return null;
  }
  const hour = clampHour(record.hour);
  const minute = clampMinute(record.minute);
  return {
    id:
      typeof record.id === "string" && record.id
        ? record.id
        : crypto.randomUUID(),
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    hour,
    minute,
    enabled: Boolean(record.enabled),
  };
}

function clampHour(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.min(23, Math.max(0, Math.floor(num)));
}

function clampMinute(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.min(59, Math.max(0, Math.floor(num)));
}

export function nextOccurrence(hour: number, minute: number): number {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.getTime();
}

export function formatReminderTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) {
    displayHour = 12;
  }
  return `${displayHour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${period}`;
}
