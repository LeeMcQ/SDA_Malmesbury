"use client";

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { RuleFlourish } from "@/components/ornament";
import { SongCard } from "@/components/song-card";
import {
  firstLine,
  searchSongs,
  songOfTheDay,
  SONGS,
  type Song,
} from "@/lib/songs";
import { useAppStore } from "@/lib/store";
import { publicUrl } from "@/lib/public-url";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Malmesbury Praise" }],
  }),
});

type Filter = "all" | "numbered" | "additional";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "numbered", label: "1–29" },
  { id: "additional", label: "30–48" },
];

function HomePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const recentIds = useAppStore((s) => s.recent);
  const today = useMemo(() => songOfTheDay(), []);

  const songs = useMemo(() => {
    const found = searchSongs(query);
    if (filter === "all") return found;
    return found.filter((song) => song.collection === filter);
  }, [query, filter]);

  const recent = recentIds
    .map((id) => SONGS.find((song) => song.id === id))
    .filter((song): song is Song => Boolean(song));

  return (
    <div>
      <section className="relative sm:px-4 sm:pt-4">
        <div className="relative overflow-hidden sm:rounded-[28px]">
          <img
            src={publicUrl("images/church-exterior.jpg")}
            alt="A white country church in the Swartland wheat fields"
            className="h-[min(16.5rem,58svh)] w-full object-cover sm:h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-shade via-shade/55 to-shade/15" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-on-shade sm:p-10">
            <div className="stagger-in max-w-xl">
              <p className="font-sans text-[11px] font-medium tracking-[0.28em] uppercase">
                Women's Ministries
              </p>
              <h1 className="mt-1 font-display text-[2.15rem] font-medium tracking-tight sm:text-6xl">
                Praise & Worship
              </h1>
              <p className="mt-2 max-w-md font-serif text-sm italic text-on-shade/85 sm:mt-3 sm:text-lg">
                Malmesbury Seventh-day Adventist Church — a hymnal for Sabbath,
                midweek, and the quiet hours in between.
              </p>
              <p className="mt-3 font-sans text-xs tracking-[0.18em] uppercase text-on-shade/70">
                {SONGS.length} songs · Western Cape
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 pt-5">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search songs"
            placeholder="Search title, number, or a line of lyric"
            className="h-12 w-full rounded-2xl bg-card pr-4 pl-11 font-sans text-base text-ink shadow-[var(--shadow-border)] outline-none placeholder:text-muted focus:shadow-[var(--shadow-border-hover)]"
          />
        </label>
      </div>

      <section className="px-4 pt-8">
        <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
          Song of the day
        </p>
        <Link
          to="/songs/$slug"
          params={{ slug: today.id }}
          className="mt-3 flex min-h-24 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
        >
          <img
            src={publicUrl("images/hymnal-still.jpg")}
            alt=""
            className="hidden w-36 object-cover sm:block"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
            <p className="font-display text-sm italic text-navy">
              No. {today.number}
            </p>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-balance">
              {today.title}
            </h2>
            <p className="mt-2 truncate font-serif text-sm italic text-muted">
              {firstLine(today)}
            </p>
          </div>
        </Link>
      </section>

      {recent.length > 0 && !query && (
        <section className="px-4 pt-8">
          <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
            Recently opened
          </p>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {recent.map((song) => (
              <Link
                key={song.id}
                to="/songs/$slug"
                params={{ slug: song.id }}
                className="inline-flex h-11 shrink-0 items-center rounded-full bg-card px-4 font-sans text-sm text-ink shadow-[var(--shadow-border)]"
              >
                {song.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="px-4 pt-8">
        <RuleFlourish />
      </div>

      <section className="px-4 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">The collection</h2>
            <p className="mt-1 font-sans text-sm text-muted">
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </p>
          </div>
          <div className="flex w-full rounded-full bg-card p-1 shadow-[var(--shadow-border)] sm:w-auto">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={
                  filter === item.id
                    ? "min-h-11 flex-1 rounded-full bg-navy px-3 font-sans text-xs font-medium text-paper sm:flex-none sm:px-4"
                    : "min-h-11 flex-1 rounded-full px-3 font-sans text-xs font-medium text-muted sm:flex-none sm:px-4"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {songs.length === 0 ? (
          <p className="mt-10 text-center font-serif text-base italic text-muted">
            No songs match that search. Try a first line, a number, or a word like
            grace.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {songs.map((song, index) => (
              <SongCard key={song.id} song={song} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
