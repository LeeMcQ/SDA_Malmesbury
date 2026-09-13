"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ListMusic, Maximize2, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PresentButton } from "@/components/present-button";
import { Button } from "@/components/ui/button";
import { displayNumber, firstLine, SONGS } from "@/lib/songs";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/planner")({
  component: PlannerPage,
  head: () => ({ meta: [{ title: "Set list · Malmesbury Praise" }] }),
});

function PlannerPage() {
  const planner = useAppStore((s) => s.planner);
  const movePlanner = useAppStore((s) => s.movePlanner);
  const removeFromPlanner = useAppStore((s) => s.removeFromPlanner);
  const clearPlanner = useAppStore((s) => s.clearPlanner);

  const songs = planner
    .map((id) => SONGS.find((song) => song.id === id))
    .filter((song): song is NonNullable<typeof song> => Boolean(song));

  async function shareSet() {
    const text = [
      "Malmesbury Praise — Set list",
      "",
      ...songs.map(
        (song, index) =>
          `${index + 1}. ${song.number} · ${song.title}`,
      ),
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sabbath set list", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Set list copied");
    } catch {
      await navigator.clipboard.writeText(text);
      toast.success("Set list copied");
    }
  }

  return (
    <div className="px-4 pt-8">
      <p className="font-sans text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
        Sabbath order
      </p>
      <h1 className="mt-2 font-display text-[1.85rem] font-medium tracking-tight sm:text-4xl">Set list</h1>
      <p className="mt-2 max-w-md font-serif text-base italic text-muted">
        Gather an opening, a prayer song, and a close — then present it to the
        room.
      </p>

      {songs.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <ListMusic className="size-8 text-navy" />
          <p className="mt-4 max-w-sm font-serif text-lg italic text-muted">
            Add songs from the book to build this week's service.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Browse songs</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <PresentButton slug={songs[0]!.id} set className="w-full sm:w-auto">
              <Maximize2 className="size-4" />
              Present set
            </PresentButton>
            <Button variant="secondary" onClick={shareSet} className="min-h-11 flex-1 sm:flex-none">
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="ghost" onClick={clearPlanner} className="min-h-11 flex-1 sm:flex-none">
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>

          <ol className="mt-6 space-y-3">
            {songs.map((song, index) => (
              <li
                key={song.id}
                className="flex items-center gap-2 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)] sm:gap-3"
              >
                <span className="w-7 shrink-0 text-center font-display text-xl italic text-navy tabular-nums sm:w-8">
                  {index + 1}
                </span>
                <Link
                  to="/songs/$slug"
                  params={{ slug: song.id }}
                  className="min-w-0 flex-1"
                >
                  <span className="block truncate font-display text-lg leading-snug">
                    {displayNumber(song)} {song.title}
                  </span>
                  <span className="block truncate font-serif text-sm italic text-muted">
                    {firstLine(song)}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Move up"
                      className="flex size-11 items-center justify-center text-muted disabled:opacity-30"
                      disabled={index === 0}
                      onClick={() => movePlanner(song.id, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className="flex size-11 items-center justify-center text-muted disabled:opacity-30"
                      disabled={index === songs.length - 1}
                      onClick={() => movePlanner(song.id, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove from set list"
                    className="flex size-11 items-center justify-center text-muted"
                    onClick={() => removeFromPlanner(song.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
