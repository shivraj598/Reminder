export const ALARM_NAME = "water-reminder";
export const NOTIFICATION_ID = "water-reminder";
export const GENERAL_NOTIFICATION_ID = "general-reminder";

export const GENERAL_ALARM_PREFIX = "general-reminder-";
export const GENERAL_STORAGE_KEY = "general-reminders";

export function generalAlarmName(id: string): string {
  return `${GENERAL_ALARM_PREFIX}${id}`;
}

export function generalIdFromAlarm(name: string): string | null {
  if (!name.startsWith(GENERAL_ALARM_PREFIX)) {
    return null;
  }
  return name.slice(GENERAL_ALARM_PREFIX.length);
}

export const MIN_INTERVAL_MINUTES = 1;
export const MAX_INTERVAL_MINUTES = 180;

export const MAX_SOUND_BYTES = 10 * 1024 * 1024;
export const MAX_SOUND_SECONDS = 5;

export const DEFAULT_MESSAGE = "Time to drink water";
export const DEFAULT_INTERVAL_MINUTES = 40;
export const DEFAULT_VOLUME = 80;

export const MSG_PLAY_SOUND = "WATER_REMINDER_PLAY_SOUND";
export const MSG_TEST_REMINDER = "WATER_REMINDER_TEST_REMINDER";
export const MSG_GENERAL_TEST_REMINDER = "GENERAL_REMINDER_TEST_REMINDER";
export const MSG_GENERAL_SYNC = "GENERAL_REMINDERS_SYNC";
