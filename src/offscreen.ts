import { DEFAULT_VOLUME, MSG_PLAY_SOUND } from "./constants";
import { getAudio } from "./audio-store";
import { playReminderAudio } from "./sound-player";

type PlaySoundMessage = {
  type: typeof MSG_PLAY_SOUND;
  volume?: number;
};

async function playSound(volume = DEFAULT_VOLUME): Promise<void> {
  const stored = await getAudio();
  await playReminderAudio(volume, stored?.blob ?? null);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const payload = message as PlaySoundMessage;
  if (payload?.type !== MSG_PLAY_SOUND) {
    return undefined;
  }

  playSound(payload.volume ?? DEFAULT_VOLUME)
    .then(() => sendResponse({ ok: true }))
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Sound failed",
      });
    });
  return true;
});
