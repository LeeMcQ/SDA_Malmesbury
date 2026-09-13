"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isIosDevice, isStandaloneDisplay } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "malmesbury-praise-install-help";

export function InstallApp() {
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [help, setHelp] = useState<"ios" | "menu" | null>(null);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelp(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setPromptEvent(null);
        setHelp(null);
      }
      return;
    }
    setHelp(isIosDevice() ? "ios" : "menu");
  };

  const dismissHelp = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHelp(null);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Install app"
        onClick={() => void install()}
        className="size-11 shrink-0 text-navy"
      >
        <Download className="size-5" />
      </Button>
      {help ? (
        <div className="absolute top-12 right-0 z-40 w-[min(18.5rem,calc(100vw-2rem))] rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-border-hover)]">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-base font-medium tracking-tight">
              Install Malmesbury Praise
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={dismissHelp}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted"
            >
              <X className="size-4" />
            </button>
          </div>
          {help === "ios" ? (
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
              Tap <Share className="mb-0.5 inline size-3.5" /> Share, then{" "}
              <strong className="font-medium text-ink">Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
              Open the browser menu and choose{" "}
              <strong className="font-medium text-ink">Install app</strong> or{" "}
              <strong className="font-medium text-ink">Add to Home screen</strong>.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
