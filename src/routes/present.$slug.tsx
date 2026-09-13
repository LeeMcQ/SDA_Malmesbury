"use client";

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getSong, SONGS, stanzaLabel } from "@/lib/songs";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type PresentSearch = { set?: string };

export const Route = createFileRoute("/present/$slug")({
  component: PresentPage,
  validateSearch: (search: Record<string, unknown>): PresentSearch => ({
    set: typeof search.set === "string" ? search.set : undefined,
  }),
  loader: ({ params }) => {
    const song = getSong(params.slug);
    if (!song) throw notFound();
    return { song };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Present · ${loaderData?.song.title ?? "Song"}` }],
  }),
});

function PresentPage() {
  const { song } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { set: setFlag } = Route.useSearch();
  const navigate = useNavigate();
  const planner = useAppStore((s) => s.planner);
  const [index, setIndex] = useState(0);

  const setSongs = useMemo(() => {
    if (setFlag !== "1" || planner.length === 0) return [song];
    const songs = planner
      .map((id) => SONGS.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return songs.length ? songs : [song];
  }, [planner, setFlag, song]);

  const current = setSongs.find((item) => item.id === slug) ?? song;
  const stanzas = current.stanzas;
  const stanza = stanzas[Math.min(index, stanzas.length - 1)]!;
  const songIndex = setSongs.findIndex((item) => item.id === current.id);

  useEffect(() => {
    setIndex(0);
  }, [current.id]);

  function go(delta: number) {
    const nextStanza = index + delta;
    if (nextStanza >= 0 && nextStanza < stanzas.length) {
      setIndex(nextStanza);
      return;
    }
    if (setFlag === "1") {
      const nextSong = setSongs[songIndex + delta];
      if (nextSong) {
        void navigate({
          to: "/present/$slug",
          params: { slug: nextSong.id },
          search: { set: "1" },
        });
      }
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "Escape") {
        void navigate({ to: "/songs/$slug", params: { slug: current.id } });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-shade text-on-shade"
      onClick={(event) => {
        const x = event.clientX;
        if (x < window.innerWidth / 3) go(-1);
        else go(1);
      }}
    >
      <header className="flex items-center justify-between px-4 pt-4">
        <p className="min-w-0 truncate font-display text-sm italic tracking-wide text-on-shade/70">
          No. {current.number} · {current.title}
        </p>
        <Link
          to="/songs/$slug"
          params={{ slug: current.id }}
          className="flex size-11 items-center justify-center rounded-full text-on-shade/80"
          onClick={(event) => event.stopPropagation()}
          aria-label="Exit presentation"
        >
          <X className="size-5" />
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-on-shade/55 uppercase">
          {stanzaLabel(stanza)}
        </p>
        <p
          className={cn(
            "mt-6 max-w-4xl font-display text-3xl leading-snug font-medium tracking-tight sm:text-5xl",
            (stanza.kind === "chorus" || stanza.kind === "refrain") && "italic",
          )}
        >
          {stanza.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>

      <footer className="flex items-center justify-between px-4 pb-6">
        <button
          type="button"
          className="flex size-12 items-center justify-center text-on-shade/70"
          onClick={(event) => {
            event.stopPropagation();
            go(-1);
          }}
          aria-label="Previous stanza"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="flex gap-1.5">
          {stanzas.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full",
                i === index ? "bg-on-shade" : "bg-on-shade/30",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          className="flex size-12 items-center justify-center text-on-shade/70"
          onClick={(event) => {
            event.stopPropagation();
            go(1);
          }}
          aria-label="Next stanza"
        >
          <ChevronRight className="size-6" />
        </button>
      </footer>
    </div>
  );
}
