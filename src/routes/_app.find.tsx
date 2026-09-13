"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, LoaderCircle, Search } from "lucide-react";
import { recommendSongs, type AiResult } from "@/lib/ai";
import { searchSongs, SONGS, type Song } from "@/lib/songs";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/find")({
  component: FindPage,
  head: () => ({ meta: [{ title: "Find a song · Malmesbury Praise" }] }),
});

const PROMPTS = [
  "Opening worship for Women's Ministries Sabbath",
  "Songs of comfort after a hard week",
  "A closing hymn of heaven and hope",
  "Prayer, surrender, and still waters",
  "Praise that lifts the room",
];

function FindPage() {
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  const local = useMemo(() => (query.trim() ? searchSongs(query).slice(0, 8) : []), [query]);

  async function ask(prompt: string) {
    const text = prompt.trim();
    if (!text || pending) return;
    setPending(true);
    setResult(null);
    try {
      const response = await recommendSongs({ data: { query: text } });
      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error: error instanceof Error ? error.message : "Could not find songs just then.",
      });
    } finally {
      setPending(false);
    }
  }

  const picks: Song[] =
    result && result.ok
      ? result.picks
          .map((pick) => SONGS.find((song) => song.id === pick.id))
          .filter((song): song is Song => Boolean(song))
      : [];

  return (
    <div className="px-4 pt-8">
      <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
        Song finder
      </p>
      <h1 className="mt-2 font-display text-[1.85rem] font-medium tracking-tight sm:text-4xl">
        What is the hour asking for?
      </h1>
      <p className="mt-2 max-w-lg font-serif text-base italic text-muted">
        Search the book, or describe the moment — opening praise, a prayer song,
        a close of heaven — and we'll gather a handful from this hymnal.
      </p>

      <label className="relative mt-8 block">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the collection"
          aria-label="Search the collection"
          className="h-12 w-full rounded-2xl bg-card pr-4 pl-11 font-sans text-base text-ink shadow-[var(--shadow-border)] outline-none placeholder:text-muted"
        />
      </label>

      {local.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {local.map((song, index) => (
            <SongCard key={song.id} song={song} index={index} />
          ))}
        </div>
      )}

      <form
        className="mt-10"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(theme);
        }}
      >
        <label htmlFor="theme" className="font-sans text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
          Describe a theme
        </label>
        <textarea
          id="theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value)}
          rows={3}
          placeholder="Four songs for a quiet Friday evening of prayer…"
          className="mt-2 w-full resize-none rounded-2xl bg-card p-4 font-sans text-base text-ink shadow-[var(--shadow-border)] outline-none placeholder:text-muted"
        />
        <Button type="submit" className="mt-3 w-full sm:w-auto" disabled={pending || !theme.trim()}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Compass className="size-4" />}
          {pending ? "Listening…" : "Find songs"}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setTheme(prompt);
              void ask(prompt);
            }}
            className="min-h-11 rounded-full bg-card px-3.5 py-2 text-left font-sans text-xs text-ink shadow-[var(--shadow-border)]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {result && !result.ok && (
        <p className="mt-8 font-serif text-base italic text-muted">{result.error}</p>
      )}

      {result && result.ok && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-medium tracking-tight">{result.title}</h2>
          {result.notes && (
            <p className="mt-2 max-w-xl font-serif text-base italic text-muted">{result.notes}</p>
          )}
          <ol className="mt-6 space-y-3">
            {result.picks.map((pick, index) => {
              const song = picks.find((item) => item.id === pick.id);
              if (!song) return null;
              return (
                <li key={pick.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
                  <Link to="/songs/$slug" params={{ slug: song.id }} className="block min-h-11">
                    <p className="font-display text-sm italic text-navy">
                      {index + 1}. No. {song.number}
                    </p>
                    <p className="mt-1 font-display text-xl font-medium">{song.title}</p>
                    <p className="mt-2 font-sans text-sm text-muted">{pick.reason}</p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
