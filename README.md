# Reminder

A lightweight Chrome Extension (Manifest V3) that keeps you on schedule in your browser. It delivers two kinds of reminders — **water** reminders that nudge you on a repeat interval, and **general** reminders that fire once daily at a time you choose — as a sound, an OS notification, and an in-page toast.

The UI is styled in a hand-drawn 2D "sketchbook" aesthetic: warm paper grid backgrounds, thick ink borders, hard offset shadows, and marker underlines.

## Screenshots

| Water Reminders | General Reminders |
| --- | --- |
| <img src="sampleUI/water-full.png" width="320" alt="Water reminder tab"> | <img src="sampleUI/general-full.png" width="320" alt="General reminders tab"> |

> Screenshots live in `public/sampleUI/` (mirrored to `dist/sampleUI/` on build).

## Features

- **Water reminders** — repeat every 20–180 minutes while enabled. Set the interval, custom message, notification volume, and an optional custom sound.
- **General reminders** — one-off daily reminders with a custom message and a precise time (hour / minute / second + AM / PM).
  - Scroll-wheel or arrow-key time picker (type to enter a value directly).
  - Live in-page notice showing when the reminder is set to fire (e.g. *“Call the dentist” is set for In 2h 0m.*).
  - Reminder list with red message text and a relative "fires in …" hint.
- **Delivery channels** — every reminder fires a sound, an OS notification, and an in-page toast (on the active http(s) tab).
- **Sketch-style UI** — tabbed popup (Water / Reminders), hand-drawn theme throughout.
- **Persistent and reliable** — alarms are re-synced on install and on browser startup; general reminders are rescheduled after each fire.

## Tech Stack

- Chrome Manifest V3 (service worker, alarms, notifications, offscreen audio, scripting)
- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Radix UI primitives + shadcn-style components
- lucide-react icons

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

Output is written to `dist/`. To rebuild on every file change:

```bash
npm run dev
```

### Type-check

```bash
npx tsc --noEmit
```

## Loading the Extension in Chrome

1. Run `npm run build` to generate `dist/`.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top-right).
4. Click **Load unpacked** and select the project's `dist/` folder.
5. Pin the **Reminder** icon to the toolbar and open the popup to configure reminders.

> After rebuilding, click the refresh (↻) button on the extension's card in `chrome://extensions` to reload the latest code.

## Project Structure

```
src/
  background.ts        # Service worker: alarm handling, sound/notification/toast delivery
  offscreen.ts         # Offscreen document that plays audio (closed after each sound)
  offscreen.html       # Offscreen document entry point
  sound-player.ts      # Plays the default beep or a custom sound blob
  beep.ts              # Built-in default beep generator
  audio-store.ts       # Loads the stored custom-sound blob
  alarms.ts            # Water + general alarm scheduling helpers
  settings.ts          # Water reminder settings (load/save via chrome.storage.local)
  general-reminders.ts # General reminder model, time/AM-PM formatting, next-occurrence math
  constants.ts         # Shared constants (alarm names, keys, message types)
  toast.ts             # Self-contained in-page toast (kept dependency-free for serialization)
  popup.tsx            # React popup — tabbed shell (Water / General)
  popup/index.css      # Sketch theme variables + utilities
  components/
    WaterTab.tsx       # Water reminder settings UI
    GeneralTab.tsx     # General reminder list + creation UI
    TimePicker.tsx     # Scroll-wheel/typeable hour-min-sec + AM/PM picker
    ui/                # shadcn-style, sketch-themed primitives (button, card, input, …)
public/
  manifest.json        # MV3 manifest (name, permissions, background, action)
  icons/               # Extension icons
```

## How It Works

- **Background service worker** listens for `chrome.alarms.onAlarm`:
  - The water alarm (name from `ALARM_NAME`) fires the water reminder.
  - General alarm names (`general-reminder-<id>`) fire the matching general reminder, then the alarm is rescheduled for the next day.
- On **install** and **startup**, both water and general alarms are synchronized so reminders survive browser restarts.
- When a reminder fires, `deliverReminder`:
  1. Plays a sound (via the offscreen audio document) — skipped when volume is `0`.
  2. Creates an OS notification.
  3. Injects an in-page toast into the active tab (only for `http`/`https` URLs).
- The **offscreen audio document is closed shortly after playing** so it doesn't sit in memory between reminders; it is re-created on demand for each firing. This keeps idle resource usage low.

## Permissions

The manifest requests:

| Permission | Why |
| --- | --- |
| `alarms` | Schedule and fire water/general reminders |
| `notifications` | Show OS-level notification banners |
| `storage` | Persist settings and reminders |
| `unlimitedStorage` | Store user-provided custom sounds |
| `offscreen` | Play audio via an offscreen document (MV3 audio requirement) |
| `scripting` | Inject the in-page toast into the active tab |
| `tabs` | Inspect the active tab URL before injecting |
| `<all_urls>` host | Deliver in-page toasts on any page |

## License

Private project.
