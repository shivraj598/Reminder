import { playDefaultBeep } from "./beep";
import { volumeToGain } from "./lib/utils";

export async function playReminderAudio(
  volume: number,
  blob?: Blob | null,
): Promise<void> {
  const normalizedVolume = volumeToGain(volume);

  if (blob) {
    const url = URL.createObjectURL(blob);
    try {
      const audio = new Audio(url);
      audio.volume = normalizedVolume;
      audio.preload = "auto";
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Could not play reminder sound"));
        window.setTimeout(() => resolve(), 6000);
        const playResult = audio.play();
        if (playResult) {
          playResult.catch(reject);
        }
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  await playDefaultBeep(volume);
}
