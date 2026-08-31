import { ALARM_NAME } from "./constants";
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
