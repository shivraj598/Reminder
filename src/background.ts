import {
  ALARM_NAME,
  DEFAULT_MESSAGE,
  GENERAL_NOTIFICATION_ID,
  MSG_GENERAL_SYNC,
  MSG_GENERAL_TEST_REMINDER,
  MSG_PLAY_SOUND,
  MSG_TEST_REMINDER,
  generalIdFromAlarm,
} from "./constants";
import { loadSettings } from "./settings";
import { loadGeneralReminders, nextOccurrence } from "./general-reminders";
import { syncAlarm, syncGeneralReminderAlarms } from "./alarms";
import { showReminderToast } from "./toast";

async function ensureOffscreen(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (existing.length > 0) {
    return;
  }
  await chrome.offscreen.createDocument({
    url: "src/offscreen.html",
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: "Play the reminder sound.",
  });
}

async function playReminderSound(volume?: number): Promise<void> {
  let nextVolume = volume;
  if (nextVolume === undefined) {
    const settings = await loadSettings();
    nextVolume = settings.volume;
  }
  if (nextVolume <= 0) {
    return;
  }
  await ensureOffscreen();
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await chrome.runtime.sendMessage({
        type: MSG_PLAY_SOUND,
        volume: nextVolume,
      });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Could not play reminder sound");
}

function canInjectIntoUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith("http://") || url?.startsWith("https://"));
}

async function showOsNotification(
  id: string,
  title: string,
  message: string,
  contextMessage: string,
): Promise<boolean> {
  try {
    await chrome.notifications.create(id, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title,
      message,
      contextMessage,
      silent: true,
      priority: 2,
    });
    return true;
  } catch (error) {
    console.error("Reminder notification failed", error);
    return false;
  }
}

async function showInPageToast(
  message: string,
  title: string,
  icon: string,
  theme: "water" | "general",
): Promise<boolean> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  if (!tab?.id || !canInjectIntoUrl(tab.url)) {
    return false;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showReminderToast,
      args: [title, message, icon, theme],
    });
    return true;
  } catch (error) {
    console.error("Reminder browser toast failed", error);
    return false;
  }
}

async function deliverReminder(
  notificationId: string,
  title: string,
  message: string,
  contextMessage: string,
  theme: "water" | "general",
  icon: string,
  volume?: number,
): Promise<void> {
  await playReminderSound(volume).catch(() => undefined);

  const notificationShown = await showOsNotification(
    notificationId,
    title,
    message,
    contextMessage,
  );
  const toastShown = await showInPageToast(message, title, icon, theme);
  if (!notificationShown && !toastShown) {
    console.error("Could not show a notification");
  }
}

async function fireWaterReminder(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) {
    return;
  }
  await deliverReminder(
    "water-reminder",
    "Water Reminder",
    settings.message,
    "A small pause for your next sip",
    "water",
    "💧",
    settings.volume,
  );
}

async function fireGeneralReminder(id: string): Promise<void> {
  const reminders = await loadGeneralReminders();
  const reminder = reminders.find((item) => item.id === id);
  if (!reminder || !reminder.enabled) {
    return;
  }
  const settings = await loadSettings();
  await deliverReminder(
    `${GENERAL_NOTIFICATION_ID}-${id}`,
    "Reminder",
    reminder.message,
    "A quick reminder for you",
    "general",
    "🔔",
    settings.volume,
  );
  await rescheduleGeneralAlarm(reminder);
}

async function rescheduleGeneralAlarm(reminder: {
  id: string;
  hour: number;
  minute: number;
  second: number;
  enabled: boolean;
}): Promise<void> {
  const alarmName = `general-reminder-${reminder.id}`;
  await chrome.alarms.clear(alarmName);
  if (!reminder.enabled) {
    return;
  }
  await chrome.alarms.create(alarmName, {
    when: nextOccurrence(reminder.hour, reminder.minute, reminder.second),
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void fireWaterReminder();
    return;
  }
  const generalId = generalIdFromAlarm(alarm.name);
  if (generalId) {
    void fireGeneralReminder(generalId);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(syncAlarm);
  void loadGeneralReminders().then(syncGeneralReminderAlarms);
});

chrome.runtime.onStartup.addListener(() => {
  void loadSettings().then(syncAlarm);
  void loadGeneralReminders().then(syncGeneralReminderAlarms);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === MSG_TEST_REMINDER) {
    void (async () => {
      const settings = await loadSettings();
      const nextMessage =
        typeof message.message === "string" && message.message.trim()
          ? message.message.trim()
          : settings.message || DEFAULT_MESSAGE;
      const nextVolume =
        typeof message.volume === "number" ? message.volume : settings.volume;
      await deliverReminder(
        "water-reminder",
        "Water Reminder",
        nextMessage,
        "A small pause for your next sip",
        "water",
        "💧",
        nextVolume,
      );
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message?.type === MSG_GENERAL_TEST_REMINDER) {
    void (async () => {
      const nextMessage =
        typeof message.message === "string" && message.message.trim()
          ? message.message.trim()
          : "Time for your reminder";
      await deliverReminder(
        "general-reminder",
        "Reminder",
        nextMessage,
        "A quick reminder for you",
        "general",
        "🔔",
      );
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message?.type === MSG_GENERAL_SYNC) {
    void (async () => {
      const reminders = await loadGeneralReminders();
      await syncGeneralReminderAlarms(reminders);
      sendResponse({ ok: true });
    })();
    return true;
  }

  return undefined;
});
