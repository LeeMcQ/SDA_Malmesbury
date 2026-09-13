import { cn } from "@/lib/utils";

export function HymnalMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-7", className)}
    >
      <path
        d="M5 8.5c5 2.6 5 2.6 11 0 6 2.6 6 2.6 11 0v15c-5-2.6-5-2.6-11 0-6-2.6-6-2.6-11 0v-15z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M16 8.5v15" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function RuleFlourish({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center gap-3 text-navy/70", className)}
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-line" />
      <svg viewBox="0 0 12 12" className="size-3 fill-current">
        <path d="M6 0.8 7.4 4.6 11.2 6 7.4 7.4 6 11.2 4.6 7.4 0.8 6 4.6 4.6Z" />
      </svg>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
