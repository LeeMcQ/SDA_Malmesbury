"use client";

import { Link } from "@tanstack/react-router";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayNumber, firstLine, type Song } from "@/lib/songs";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SongCard({ song, index = 0 }: { song: Song; index?: number }) {
  const favorite = useAppStore((s) => s.favorites.includes(song.id));
  const inPlanner = useAppStore((s) => s.planner.includes(song.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const addToPlanner = useAppStore((s) => s.addToPlanner);

  return (
    <article
      className="group relative min-w-0 w-full overflow-hidden rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[var(--shadow-border-hover)]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <Link
        to="/songs/$slug"
        params={{ slug: song.id }}
        className="flex min-h-16 min-w-0 gap-3 pr-20"
      >
        <span className="w-10 shrink-0 font-display text-2xl italic leading-none text-navy tabular-nums">
          {displayNumber(song)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-medium leading-snug tracking-tight text-pretty text-ink">
            {song.title}
          </span>
          <span className="mt-1 block truncate font-serif text-sm italic text-muted">
            {firstLine(song)}
          </span>
        </span>
      </Link>
      <div className="absolute top-2 right-2 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-muted hover:text-navy"
          aria-label={inPlanner ? "Already in set list" : "Add to set list"}
          onClick={() => addToPlanner(song.id)}
        >
          <Plus className={cn("size-4", inPlanner && "text-navy")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 text-muted hover:text-navy"
          aria-label={favorite ? "Remove from saved" : "Save song"}
          onClick={() => toggleFavorite(song.id)}
        >
          <Heart
            className={cn("size-4", favorite && "fill-navy text-navy")}
          />
        </Button>
      </div>
    </article>
  );
}
