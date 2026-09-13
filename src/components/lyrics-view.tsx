"use client";

import { lyricsText, stanzaLabel, type Song } from "@/lib/songs";
import { FONT_STEPS, useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LyricsView({ song }: { song: Song }) {
  const fontScale = useAppStore((s) => s.fontScale);

  return (
    <div
      className="lyric-block mx-auto max-w-2xl space-y-8 px-1 text-ink"
      style={{ ["--lyric-scale" as string]: String(fontScale) }}
    >
      {song.stanzas.map((stanza, index) => (
        <section key={`${stanza.kind}-${stanza.n ?? index}`} className="space-y-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
            {stanzaLabel(stanza)}
          </p>
          <p
            className={cn(
              "whitespace-pre-line leading-[1.55]",
              (stanza.kind === "chorus" || stanza.kind === "refrain") && "italic",
            )}
          >
            {stanza.lines.join("\n")}
          </p>
        </section>
      ))}
    </div>
  );
}

export function FontScaleControl({ className }: { className?: string }) {
  const fontScale = useAppStore((s) => s.fontScale);
  const setFontScale = useAppStore((s) => s.setFontScale);
  const index = FONT_STEPS.findIndex((step) => step === fontScale);
  const at = index >= 0 ? index : 1;

  return (
    <div className={cn("flex items-center rounded-full bg-card shadow-[var(--shadow-border)]", className)}>
      <button
        type="button"
        className="flex size-11 items-center justify-center font-display text-base text-navy disabled:opacity-30"
        aria-label="Decrease lyrics size"
        disabled={at <= 0}
        onClick={() => setFontScale(FONT_STEPS[Math.max(0, at - 1)]!)}
      >
        A-
      </button>
      <span className="px-1 font-sans text-[11px] tracking-wide text-muted tabular-nums">
        {Math.round(fontScale * 100)}%
      </span>
      <button
        type="button"
        className="flex size-11 items-center justify-center font-display text-lg text-navy disabled:opacity-30"
        aria-label="Increase lyrics size"
        disabled={at >= FONT_STEPS.length - 1}
        onClick={() => setFontScale(FONT_STEPS[Math.min(FONT_STEPS.length - 1, at + 1)]!)}
      >
        A+
      </button>
    </div>
  );
}

export function copyLyrics(song: Song) {
  return `${song.number}. ${song.title}\n\n${lyricsText(song)}`;
}
