import {
  DEFAULT_INTERVAL_MINUTES,
  DEFAULT_MESSAGE,
  DEFAULT_VOLUME,
  MAX_INTERVAL_MINUTES,
  MIN_INTERVAL_MINUTES,
} from "./constants";
import { clampVolume } from "./lib/utils";

export type Settings = {
  enabled: boolean;
  intervalMinutes: number;
  message: string;
  hasCustomSound: boolean;
  volume: number;
};

const STORAGE_KEY = "settings";

export const DEFAULT_SETTINGS: Settings = {
  enabled: false,
  intervalMinutes: DEFAULT_INTERVAL_MINUTES,
  message: DEFAULT_MESSAGE,
  hasCustomSound: false,
  volume: DEFAULT_VOLUME,
};

export function clampInterval(minutes: number): number {
  if (!Number.isFinite(minutes)) {
    return DEFAULT_INTERVAL_MINUTES;
  }
  return Math.min(
    MAX_INTERVAL_MINUTES,
    Math.max(MIN_INTERVAL_MINUTES, Math.round(minutes)),
  );
}

export async function loadSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<Settings> | undefined;
  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    enabled: Boolean(stored.enabled),
    intervalMinutes: clampInterval(
      stored.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES,
    ),
    message:
      typeof stored.message === "string" && stored.message.trim()
        ? stored.message.trim()
        : DEFAULT_MESSAGE,
    hasCustomSound: Boolean(stored.hasCustomSound),
    volume: clampVolume(stored.volume ?? DEFAULT_VOLUME),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const next: Settings = {
    enabled: settings.enabled,
    intervalMinutes: clampInterval(settings.intervalMinutes),
    message: settings.message.trim() || DEFAULT_MESSAGE,
    hasCustomSound: settings.hasCustomSound,
    volume: clampVolume(settings.volume),
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
}
