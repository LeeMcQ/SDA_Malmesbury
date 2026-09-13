"use client";

import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Heart, ListPlus, Maximize2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { FontScaleControl, LyricsView, copyLyrics } from "@/components/lyrics-view";
import { Button } from "@/components/ui/button";
import { displayNumber, getSong, neighbors } from "@/lib/songs";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/songs/$slug")({
  component: SongPage,
  loader: ({ params }) => {
    const song = getSong(params.slug);
    if (!song) throw notFound();
    return { song };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.song.title ?? "Song"} · Malmesbury Praise` }],
  }),
});

function SongPage() {
  const { song } = Route.useLoaderData();
  const { prev, next } = neighbors(song.id);
  const favorite = useAppStore((s) => s.favorites.includes(song.id));
  const inPlanner = useAppStore((s) => s.planner.includes(song.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addToPlanner = useAppStore((s) => s.addToPlanner);
  const addRecent = useAppStore((s) => s.addRecent);

  useEffect(() => {
    addRecent(song.id);
  }, [song.id, addRecent]);

  async function share() {
    const text = copyLyrics(song);
    try {
      if (navigator.share) {
        await navigator.share({ title: song.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Lyrics copied");
    } catch {
      await navigator.clipboard.writeText(text);
      toast.success("Lyrics copied");
    }
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-1 font-sans text-sm text-muted"
        >
          <ChevronLeft className="size-4" />
          Songbook
        </Link>
        <FontScaleControl />
      </div>

      <header className="mt-6 text-center">
        <p className="font-display text-sm italic text-navy">
          {`No. ${displayNumber(song)}`}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          {song.title}
        </h1>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {song.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-paper-deep px-2.5 py-1 font-sans text-[11px] tracking-wide text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="no-print mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
        <Button
          variant={favorite ? "primary" : "secondary"}
          onClick={() => toggleFavorite(song.id)}
        >
          <Heart className={favorite ? "size-4 fill-current" : "size-4"} />
          {favorite ? "Saved" : "Save"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            addToPlanner(song.id);
            toast.success(inPlanner ? "Already in the set list" : "Added to set list");
          }}
        >
          <ListPlus className="size-4" />
          Set list
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/present/$slug" params={{ slug: song.id }}>
            <Maximize2 className="size-4" />
            Present
          </Link>
        </Button>
        <Button variant="secondary" onClick={share}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      <div className="mt-10 mb-8">
        <LyricsView song={song} />
      </div>

      <nav className="no-print flex items-stretch justify-between gap-3 border-t border-line pt-4">
        {prev ? (
          <Link
            to="/songs/$slug"
            params={{ slug: prev.id }}
            className="min-w-0 flex-1 rounded-2xl p-3 hover:bg-paper-deep"
          >
            <span className="flex items-center gap-1 font-sans text-[11px] tracking-wide text-muted uppercase">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="mt-1 block truncate font-display text-lg">{prev.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            to="/songs/$slug"
            params={{ slug: next.id }}
            className="min-w-0 flex-1 rounded-2xl p-3 text-right hover:bg-paper-deep"
          >
            <span className="flex items-center justify-end gap-1 font-sans text-[11px] tracking-wide text-muted uppercase">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="mt-1 block truncate font-display text-lg">{next.title}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
