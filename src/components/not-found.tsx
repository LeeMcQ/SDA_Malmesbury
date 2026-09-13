import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center text-ink">
      <p className="font-sans text-[11px] tracking-[0.22em] text-muted uppercase">Missing page</p>
      <h1 className="font-display text-3xl font-medium tracking-tight">This hymn is not in the book</h1>
      <p className="max-w-md font-serif italic text-muted">
        The page you opened is not part of the Malmesbury Praise collection.
      </p>
      <Button asChild>
        <Link to="/">Return to the songbook</Link>
      </Button>
    </main>
  );
}
