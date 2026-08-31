import { GENERAL_STORAGE_KEY } from "./constants";

export type GeneralReminder = {
  id: string;
  message: string;
  hour: number;
  minute: number;
  second: number;
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
  const second = clampSecond(record.second);
  return {
    id:
      typeof record.id === "string" && record.id
        ? record.id
        : crypto.randomUUID(),
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    hour,
    minute,
    second,
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

function clampSecond(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }
  return Math.min(59, Math.max(0, Math.floor(num)));
}

export function nextOccurrence(
  hour: number,
  minute: number,
  second = 0,
): number {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hour, minute, second, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.getTime();
}

export function formatReminderTime(
  hour: number,
  minute: number,
  second = 0,
): string {
  const period = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) {
    displayHour = 12;
  }
  return `${displayHour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}:${second.toString().padStart(2, "0")} ${period}`;
}

export function toTwelveHour(
  hour24: number,
): { hour12: number; period: "AM" | "PM" } {
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12;
  return { hour12: hour12 === 0 ? 12 : hour12, period };
}

export function toTwentyFour(
  hour12: number,
  period: "AM" | "PM",
): number {
  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function formatRelativeTime(timestamp: number): string {
  const deltaMs = timestamp - Date.now();
  if (deltaMs <= 0) {
    return "Due now";
  }
  const totalMinutes = Math.ceil(deltaMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `In ${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `In ${hours}h ${minutes}m`;
  }
  return `In ${minutes}m`;
}
