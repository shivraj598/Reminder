import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Loader2,
  Minus,
  Play,
  Plus,
  Trash2,
  Volume1,
  Volume2,
  X,
  Zap,
} from "lucide-react";

import { getNextAlarmTime, syncAlarm } from "./alarms";
import { clearAudio, getAudio, saveAudio, type StoredAudio } from "./audio-store";
import { playDefaultBeep } from "./beep";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_SOUND_BYTES,
  MAX_SOUND_SECONDS,
  MSG_TEST_REMINDER,
} from "./constants";
import { volumeToGain } from "./lib/utils";
import { loadSettings, saveSettings, type Settings } from "./settings";

type PendingSound = {
  blob: Blob;
  mimeType: string;
  fileName: string;
};

const PRESETS = [20, 40, 60];
const MAX_MESSAGE_LENGTH = 240;

function formatNextAlarm(
  timestamp: number | undefined,
  enabled: boolean,
): string {
  if (!enabled) {
    return "Reminders are off.";
  }
  if (!timestamp) {
    return "Reminders saved. The next alert will follow your interval.";
  }
  const deltaMs = timestamp - Date.now();
  const minutes = Math.max(1, Math.round(deltaMs / 60000));
  return `Next reminder in about ${minutes} min.`;
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(duration)) {
        reject(new Error("Could not read that audio file."));
        return;
      }
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file does not look like playable audio."));
    };
    audio.src = url;
  });
}

async function validateSound(file: File): Promise<void> {
  if (file.size > MAX_SOUND_BYTES) {
    throw new Error("Sound must be 10 MB or smaller.");
  }
  const duration = await readAudioDuration(file);
  if (duration > MAX_SOUND_SECONDS) {
    throw new Error("Sound must be 5 seconds or shorter.");
  }
}

export default function App() {
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(40);
  const [message, setMessage] = useState("");
  const [volume, setVolume] = useState(80);
  const [storedSound, setStoredSound] = useState<StoredAudio | null>(null);
  const [pendingSound, setPendingSound] = useState<PendingSound | null>(null);
  const [removeSound, setRemoveSound] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const soundLabel = pendingSound?.fileName ?? storedSound?.fileName ?? null;
  const hasSound = Boolean(storedSound || pendingSound);

  async function refresh(): Promise<void> {
    const settings = await loadSettings();
    setEnabled(settings.enabled);
    setIntervalMinutes(settings.intervalMinutes);
    setMessage(settings.message);
    setVolume(settings.volume);
    setStoredSound(settings.hasCustomSound ? await getAudio() : null);
    setPendingSound(null);
    setRemoveSound(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    const next = await getNextAlarmTime();
    setStatus(formatNextAlarm(next, settings.enabled));
  }

  useEffect(() => {
    void refresh();
  }, []);

  function setErrorAndClear(message: string): void {
    setError(message);
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    setError("");
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      await validateSound(file);
      setPendingSound({
        blob: file,
        mimeType: file.type || "audio/mpeg",
        fileName: file.name,
      });
      setRemoveSound(false);
    } catch (err) {
      setPendingSound(null);
      event.target.value = "";
      setErrorAndClear(
        err instanceof Error ? err.message : "Could not use that sound.",
      );
    }
  }

  async function previewSound(): Promise<void> {
    setError("");
    const blob = pendingSound?.blob ?? storedSound?.blob ?? null;
    if (!blob) {
      try {
        await playDefaultBeep(volume);
      } catch {
        setErrorAndClear("Could not play the default beep.");
      }
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volumeToGain(volume);
    try {
      await audio.play();
    } catch {
      setErrorAndClear(
        "The browser blocked sound playback. Try again after clicking.",
      );
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 6000);
    }
  }

  function clearSound(): void {
    setPendingSound(null);
    setRemoveSound(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError("");
  }

  async function testReminder(): Promise<void> {
    setError("");
    setTesting(true);
    try {
      await chrome.runtime.sendMessage({
        type: MSG_TEST_REMINDER,
        volume,
        message,
      });
      setStatus("Preview sent — sound should be playing now.");
    } catch (err) {
      setErrorAndClear(
        err instanceof Error ? err.message : "Could not run a preview.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function save(): Promise<void> {
    setError("");
    setSaving(true);
    const settings: Settings = {
      enabled,
      intervalMinutes,
      message,
      volume,
      hasCustomSound: false,
    };
    try {
      if (pendingSound) {
        await saveAudio(
          pendingSound.blob,
          pendingSound.mimeType,
          pendingSound.fileName,
        );
        settings.hasCustomSound = true;
      } else if (removeSound) {
        await clearAudio();
        settings.hasCustomSound = false;
      } else {
        const current = await loadSettings();
        settings.hasCustomSound = current.hasCustomSound;
      }

      await saveSettings(settings);
      await syncAlarm(settings);
      await refresh();
    } catch (err) {
      setErrorAndClear(
        err instanceof Error ? err.message : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid gap-3 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Hydration · control
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Water Reminder
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Small prompts. Better rhythm.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close extension"
          title="Close"
          onClick={() => window.close()}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="grid gap-1">
            <Label htmlFor="enabled" className="text-sm font-medium">
              Reminders on
            </Label>
            <CardDescription>Keep your next sip on schedule</CardDescription>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Toggle reminders"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Schedule</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="interval" className="text-xs text-muted-foreground">
                Interval (minutes)
              </Label>
              <span className="text-xs tabular-nums text-primary">
                {intervalMinutes}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                id="interval"
                type="number"
                min={1}
                max={180}
                step={1}
                value={intervalMinutes}
                onChange={(event) =>
                  setIntervalMinutes(Number(event.target.value) || 1)
                }
                className="flex-1"
              />
              <div className="flex gap-1">
                {PRESETS.map((minutes) => (
                  <Button
                    key={minutes}
                    type="button"
                    size="sm"
                    variant={intervalMinutes === minutes ? "secondary" : "outline"}
                    onClick={() => setIntervalMinutes(minutes)}
                    className="px-2.5"
                  >
                    {minutes}m
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="text-xs text-muted-foreground">
                Notification message
              </Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {message.length} / {MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <Textarea
              id="message"
              rows={3}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Time to drink water"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sound &amp; preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Notification volume
              </Label>
              <span className="flex items-center gap-1 text-xs tabular-nums text-primary">
                {volume === 0 ? (
                  <Volume1 className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {volume}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease volume"
                title="Decrease volume"
                onClick={() => setVolume((value) => Math.max(0, value - 5))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                id="volume"
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value ?? 0)}
                aria-label="Notification volume"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase volume"
                title="Increase volume"
                onClick={() => setVolume((value) => Math.min(100, value + 5))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="sound-file" className="text-xs text-muted-foreground">
              Custom sound{" "}
              <span className="font-normal">(optional, 5s or less, under 10 MB)</span>
            </Label>
            <Input
              id="sound-file"
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(event) => void handleFileChange(event)}
              className="cursor-pointer file:cursor-pointer"
            />
            <p className="truncate text-xs text-muted-foreground">
              {soundLabel ? `Using ${soundLabel}` : "Using the default beep"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void previewSound()}
              >
                <Play className="h-3.5 w-3.5" />
                Preview sound
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={testing}
                onClick={() => void testReminder()}
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Test reminder
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasSound}
                onClick={clearSound}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Button type="button" disabled={saving} onClick={() => void save()} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <p
          className="min-h-[1em] text-center text-xs text-muted-foreground"
          role="status"
        >
          {status}
        </p>
        <p
          className="min-h-[1em] text-center text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      </div>
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}