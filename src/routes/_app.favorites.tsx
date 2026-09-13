"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { SongCard } from "@/components/song-card";
import { Button } from "@/components/ui/button";
import { SONGS } from "@/lib/songs";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [{ title: "Saved · Malmesbury Praise" }] }),
});

function FavoritesPage() {
  const ids = useAppStore((s) => s.favorites);
  const songs = ids
    .map((id) => SONGS.find((song) => song.id === id))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  return (
    <div className="px-4 pt-8">
      <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
        Kept close
      </p>
      <h1 className="mt-2 font-display text-[1.85rem] font-medium tracking-tight sm:text-4xl">Saved songs</h1>
      <p className="mt-2 max-w-md font-serif text-base italic text-muted">
        Hearts stay on this device, ready for the next Sabbath.
      </p>

      {songs.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Heart className="size-8 text-navy" />
          <p className="mt-4 max-w-sm font-serif text-lg italic text-muted">
            Songs you keep close will gather here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Open the songbook</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {songs.map((song, index) => (
            <SongCard key={song.id} song={song} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
