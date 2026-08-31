import {
  ALARM_NAME,
  DEFAULT_MESSAGE,
  MSG_PLAY_SOUND,
  MSG_TEST_REMINDER,
  NOTIFICATION_ID,
} from "./constants";
import { loadSettings } from "./settings";
import { syncAlarm } from "./alarms";
import { showWaterReminderToast } from "./toast";

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
    justification: "Play the water reminder sound.",
  });
}

async function playReminderSound(volume?: number): Promise<void> {
  const settings = await loadSettings();
  const nextVolume = volume ?? settings.volume;
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

async function showOsNotification(message: string): Promise<boolean> {
  try {
    await chrome.notifications.create(NOTIFICATION_ID, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/icon128.png"),
      title: "Water Reminder",
      message,
      contextMessage: "A small pause for your next sip",
      silent: true,
      priority: 2,
    });
    return true;
  } catch (error) {
    console.error("Water Reminder notification failed", error);
    return false;
  }
}

async function showInPageToast(message: string): Promise<boolean> {
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
      func: showWaterReminderToast,
      args: [message],
    });
    return true;
  } catch (error) {
    console.error("Water Reminder browser toast failed", error);
    return false;
  }
}

async function deliverReminder(
  message: string,
  volume?: number,
): Promise<void> {
  await playReminderSound(volume).catch(() => undefined);

  const notificationShown = await showOsNotification(message);
  const toastShown = await showInPageToast(message);
  if (!notificationShown && !toastShown) {
    console.error("Water Reminder could not show a notification");
  }
}

async function fireReminder(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) {
    return;
  }
  await deliverReminder(settings.message, settings.volume);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void fireReminder();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void loadSettings().then(syncAlarm);
});

chrome.runtime.onStartup.addListener(() => {
  void loadSettings().then(syncAlarm);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== MSG_TEST_REMINDER) {
    return undefined;
  }

  void (async () => {
    const settings = await loadSettings();
    const nextMessage =
      typeof message.message === "string" && message.message.trim()
        ? message.message.trim()
        : settings.message || DEFAULT_MESSAGE;
    const nextVolume =
      typeof message.volume === "number" ? message.volume : settings.volume;
    await deliverReminder(nextMessage, nextVolume);
    sendResponse({ ok: true });
  })();

  return true;
});
