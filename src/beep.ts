import { volumeToGain } from "./lib/utils";

export async function playDefaultBeep(volume = 80): Promise<void> {
  const gainLevel = volumeToGain(volume) * 0.35;
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.45);
  await new Promise((resolve) => window.setTimeout(resolve, 500));
  await ctx.close();
}
