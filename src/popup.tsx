import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, Droplets, X } from "lucide-react";

import { GeneralTab } from "@/components/GeneralTab";
import { WaterTab } from "@/components/WaterTab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId = "water" | "general";

const TABS: { id: TabId; label: string; icon: typeof Droplets }[] = [
  { id: "water", label: "Water", icon: Droplets },
  { id: "general", label: "Reminders", icon: Bell },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("water");

  const isWater = activeTab === "water";

  return (
    <main className="grid gap-3 p-4">
      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.18em]",
              isWater ? "text-primary" : "text-amber-500",
            )}
          >
            {isWater ? "Hydration · control" : "General · reminders"}
          </p>
          <h1
            className={cn(
              "marker-underline mt-1 inline-block text-2xl font-black tracking-tight text-foreground",
              isWater ? "marker-teal" : "marker-amber",
            )}
          >
            {isWater ? "Water Reminder" : "General Reminders"}
          </h1>
          <p className="mt-2.5 text-xs font-medium text-muted-foreground">
            {isWater ? "Small prompts. Better rhythm." : "Never forget a task."}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Close extension"
          title="Close"
          onClick={() => window.close()}
          className="shrink-0 hover:bg-foreground hover:text-background"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-2 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-selected={isActive}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-foreground px-3 py-2 text-sm font-bold tracking-tight transition-transform active:translate-y-[2px]",
                isActive
                  ? tab.id === "water"
                    ? "bg-primary text-primary-foreground shadow-[2px_3px_0_0_hsl(var(--foreground))]"
                    : "bg-amber-400 text-amber-950 shadow-[2px_3px_0_0_hsl(var(--foreground))]"
                  : "bg-background text-muted-foreground shadow-[2px_3px_0_0_hsl(var(--foreground))] hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
              {tab.label}
              <span
                className={cn(
                  "text-[9px] font-bold",
                  isActive ? "opacity-70" : "opacity-50",
                )}
              >
                {tab.id === "water" ? "⌁" : "†"}
              </span>
            </button>
          );
        })}
      </div>

      {isWater ? <WaterTab /> : <GeneralTab />}
    </main>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
