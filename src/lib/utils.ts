import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 80;
  }
  return Math.min(100, Math.max(0, Math.round(volume)));
}

export function volumeToGain(volume: number): number {
  return clampVolume(volume) / 100;
}
