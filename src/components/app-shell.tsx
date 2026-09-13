"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Compass, Heart, ListMusic, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { HymnalMark } from "@/components/ornament";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Songbook", icon: BookOpen },
  { to: "/find", label: "Find", icon: Compass },
  { to: "/planner", label: "Set list", icon: ListMusic },
  { to: "/favorites", label: "Saved", icon: Heart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <div className="relative min-h-dvh bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-60" />
      <Toaster position="top-center" richColors={false} />
      <header
        className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2.5 text-navy">
            <HymnalMark className="size-6 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block font-sans text-[10px] font-medium tracking-[0.22em] text-muted uppercase">
                Malmesbury SDA
              </span>
              <span className="font-display text-lg font-medium tracking-tight text-ink">
                Praise
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "night" ? "Switch to paper light" : "Switch to night reading"}
            onClick={toggleTheme}
            className="size-11 shrink-0 text-navy"
          >
            {theme === "night" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </header>

      <main className="relative mx-auto w-full min-w-0 max-w-5xl overflow-x-hidden pb-[calc(6.75rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-paper/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-5xl grid-cols-4 px-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/" || pathname.startsWith("/songs/")
                : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide",
                    active ? "text-navy" : "text-muted",
                  )}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={active ? 2.2 : 1.8}
                    fill={item.to === "/favorites" && active ? "currentColor" : "none"}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
