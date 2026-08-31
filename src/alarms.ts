import { ALARM_NAME, generalAlarmName } from "./constants";
import {
  nextOccurrence,
  type GeneralReminder,
} from "./general-reminders";
import type { Settings } from "./settings";

export async function syncAlarm(settings: Settings): Promise<void> {
  await chrome.alarms.clear(ALARM_NAME);
  if (!settings.enabled) {
    return;
  }
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: settings.intervalMinutes,
    periodInMinutes: settings.intervalMinutes,
  });
}

export async function getNextAlarmTime(): Promise<number | undefined> {
  const alarm = await chrome.alarms.get(ALARM_NAME);
  return alarm?.scheduledTime;
}

export async function syncGeneralReminderAlarms(
  reminders: GeneralReminder[],
): Promise<void> {
  const all = await chrome.alarms.getAll();
  for (const alarm of all) {
    if (alarm.name.startsWith("general-reminder-")) {
      await chrome.alarms.clear(alarm.name);
    }
  }
  for (const reminder of reminders) {
    if (!reminder.enabled) {
      continue;
    }
    await chrome.alarms.create(generalAlarmName(reminder.id), {
      when: nextOccurrence(reminder.hour, reminder.minute),
    });
  }
}

export async function getNextGeneralAlarmTimes(): Promise<
  Map<string, number>
> {
  const all = await chrome.alarms.getAll();
  const map = new Map<string, number>();
  for (const alarm of all) {
    if (alarm.name.startsWith("general-reminder-")) {
      map.set(alarm.name, alarm.scheduledTime);
    }
  }
  return map;
}
