"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Monitor, X } from "lucide-react";
import {
  acquireWakeLock,
  closeProjectorWindow,
  currentScreenFallback,
  enterFullscreen,
  exitFullscreen,
  findProjectorScreen,
  getProjectorWindow,
  isExtendedDisplay,
  isFullscreen,
  isSameScreen,
  openProjectorWindow,
  postPresentCast,
  queryScreenDetails,
  screenName,
  subscribeFullscreen,
  subscribePresentCast,
  type ScreenLike,
} from "@/lib/present";
import { getSong, SONGS, stanzaLabel } from "@/lib/songs";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type PresentSearch = { set?: string; stage?: string };

export const Route = createFileRoute("/present/$slug")({
  component: PresentPage,
  validateSearch: (search: Record<string, unknown>): PresentSearch => ({
    set: typeof search.set === "string" ? search.set : undefined,
    stage: typeof search.stage === "string" ? search.stage : undefined,
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
  const { set: setFlag, stage: stageFlag } = Route.useSearch();
  const navigate = useNavigate();
  const planner = useAppStore((s) => s.planner);
  const [index, setIndex] = useState(0);
  const [blank, setBlank] = useState(false);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [hint, setHint] = useState(true);
  const [picker, setPicker] = useState(false);
  const [screens, setScreens] = useState<ScreenLike[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenLike | null>(null);
  const [onOther, setOnOther] = useState(false);
  const pointer = useRef({ x: 0, y: 0, moved: false });
  const applyingRemote = useRef(false);
  const isStage = stageFlag === "1";

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
  const isSet = setFlag === "1" && setSongs.length > 1;
  const lastStanza = index >= stanzas.length - 1;
  const firstStanza = index <= 0;
  const canPrev = !firstStanza || (isSet && songIndex > 0);
  const canNext = !lastStanza || (isSet && songIndex < setSongs.length - 1);
  const nextSong = lastStanza && isSet ? setSongs[songIndex + 1] : undefined;
  const coming = !lastStanza ? stanzas[index + 1] : nextSong?.stanzas[0];

  const searchOf = useCallback(
    (extra?: PresentSearch): PresentSearch => ({
      set: setFlag,
      stage: isStage ? "1" : undefined,
      ...extra,
    }),
    [isStage, setFlag],
  );

  useEffect(() => {
    setIndex(0);
    setBlank(false);
  }, [current.id]);

  const emit = useCallback(
    (next: { slug?: string; index?: number; blank?: boolean }) => {
      if (applyingRemote.current) return;
      postPresentCast({
        type: "cast",
        slug: next.slug ?? current.id,
        index: next.index ?? index,
        blank: next.blank ?? blank,
        set: setFlag,
      });
    },
    [blank, current.id, index, setFlag],
  );

  const go = useCallback(
    (delta: number) => {
      setBlank(false);
      const nextStanza = index + delta;
      if (nextStanza >= 0 && nextStanza < stanzas.length) {
        setIndex(nextStanza);
        emit({ index: nextStanza, blank: false });
        return;
      }
      if (setFlag === "1") {
        const next = setSongs[songIndex + delta];
        if (next) {
          emit({ slug: next.id, index: 0, blank: false });
          void navigate({
            to: "/present/$slug",
            params: { slug: next.id },
            search: searchOf(),
          });
        }
      }
    },
    [emit, index, navigate, searchOf, setFlag, setSongs, songIndex, stanzas.length],
  );

  const leave = useCallback(() => {
    if (isStage) {
      if (window.opener) window.close();
      else void navigate({ to: "/songs/$slug", params: { slug: current.id } });
      return;
    }
    closeProjectorWindow();
    void exitFullscreen();
    void navigate({ to: "/songs/$slug", params: { slug: current.id } });
  }, [current.id, isStage, navigate]);

  const sendToScreen = useCallback(
    async (screen: ScreenLike | null, here: boolean) => {
      setPicker(false);
      if (here || !screen) {
        closeProjectorWindow();
        setOnOther(false);
        await enterFullscreen(document.documentElement, screen);
        return;
      }
      const opened = openProjectorWindow(current.id, { set: setFlag, screen });
      setOnOther(Boolean(opened));
      if (opened) {
        emit({ slug: current.id, index, blank });
        void exitFullscreen();
      } else {
        await enterFullscreen(document.documentElement, screen);
      }
    },
    [blank, current.id, emit, index, setFlag],
  );

  async function openDisplayPicker() {
    const details = await queryScreenDetails();
    const list = details?.screens?.length ? details.screens : [currentScreenFallback()];
    const here = details?.currentScreen ?? currentScreenFallback();
    setScreens(list);
    setCurrentScreen(here);
    if (list.length <= 1) {
      await sendToScreen(here, true);
      return;
    }
    setPicker((open) => !open);
  }

  useEffect(() => {
    document.documentElement.classList.add("presenting");
    const meta = document.querySelector('meta[name="theme-color"]');
    const previous = meta?.getAttribute("content");
    meta?.setAttribute("content", "#142433");
    const releaseWake = acquireWakeLock();
    const unsub = subscribeFullscreen(setFull);
    setFull(isFullscreen());
    const hintTimer = window.setTimeout(() => setHint(false), 4200);
    if (isStage) {
      void enterFullscreen();
    }
    return () => {
      document.documentElement.classList.remove("presenting");
      if (previous) meta?.setAttribute("content", previous);
      else meta?.removeAttribute("content");
      releaseWake();
      unsub();
      window.clearTimeout(hintTimer);
      if (!isStage) void exitFullscreen();
    };
  }, [isStage]);

  useEffect(() => {
    const tick = () => setOnOther(Boolean(getProjectorWindow()));
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return subscribePresentCast((message) => {
      if (message.type === "close") {
        if (isStage) window.close();
        else setOnOther(false);
        return;
      }
      if (message.type === "hello") {
        if (!isStage) emit({});
        return;
      }
      if (message.type !== "cast") return;
      applyingRemote.current = true;
      if (message.slug !== current.id) {
        void navigate({
          to: "/present/$slug",
          params: { slug: message.slug },
          search: searchOf(),
        });
      }
      setIndex(message.index);
      setBlank(message.blank);
      window.setTimeout(() => {
        applyingRemote.current = false;
      }, 50);
    });
  }, [current.id, emit, isStage, navigate, searchOf]);

  useEffect(() => {
    if (isStage) postPresentCast({ type: "hello" });
  }, [isStage]);

  useEffect(() => {
    let timer = 0;
    const bump = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 2400);
    };
    bump();
    window.addEventListener("pointermove", bump);
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat && event.key === " ") return;
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp" || event.key === "Backspace") {
        event.preventDefault();
        go(-1);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (blank) {
          setBlank(false);
          emit({ blank: false });
          return;
        }
        leave();
      }
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (isFullscreen()) void exitFullscreen();
        else void enterFullscreen();
      }
      if (event.key === "d" || event.key === "D" || event.key === "p" || event.key === "P") {
        event.preventDefault();
        void (async () => {
          const projector = isExtendedDisplay() ? await findProjectorScreen() : null;
          await sendToScreen(projector, !projector);
        })();
      }
      if (event.key === "b" || event.key === "B" || event.key === ".") {
        event.preventDefault();
        setBlank((value) => {
          emit({ blank: !value });
          return !value;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blank, emit, go, leave, sendToScreen]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isStage && !isFullscreen()) void enterFullscreen();
    pointer.current = { x: event.clientX, y: event.clientY, moved: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (Math.abs(event.clientX - pointer.current.x) > 14) pointer.current.moved = true;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (blank) {
      setBlank(false);
      emit({ blank: false });
      return;
    }
    const dx = event.clientX - pointer.current.x;
    if (pointer.current.moved && Math.abs(dx) > 48) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (pointer.current.moved) return;
    if (event.clientX < window.innerWidth / 3) go(-1);
    else go(1);
  }

  function stopStage(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }

  const progress = ((index + 1) / stanzas.length) * 100;
  const showChrome = !isStage && (hint || !idle);
  const otherScreens = screens.filter((screen) =>
    currentScreen ? !isSameScreen(screen, currentScreen) : !screen.isPrimary,
  );

  return (
    <div
      className={cn(
        "present-stage relative isolate h-dvh w-full overflow-hidden bg-shade text-on-shade select-none",
        isStage && idle && "cursor-none",
      )}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col present-copy"
        style={{
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        }}
      >
        <p className="text-center font-sans text-[11px] font-medium tracking-[0.28em] text-on-shade/55 uppercase">
          {stanzaLabel(stanza)}
        </p>
        <div className="mt-3 min-h-0 min-w-0 flex-1">
          <FittedLyrics
            stanzaKey={`${current.id}-${index}`}
            lines={stanza.lines}
            italic={stanza.kind === "chorus" || stanza.kind === "refrain"}
          />
        </div>
        {!isStage && coming ? (
          <p className="mt-2 text-center font-sans text-xs tracking-wide text-on-shade/40">
            Coming · {stanzaLabel(coming)} · {coming.lines[0]}
          </p>
        ) : nextSong ? (
          <p className="mt-2 text-center font-sans text-xs tracking-wide text-on-shade/40">
            Next · {nextSong.title}
          </p>
        ) : null}
      </div>

      {showChrome ? (
        <header
          className="pointer-events-auto absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3"
          style={{ paddingTop: "max(0.6rem, env(safe-area-inset-top))" }}
        >
          <p className="min-w-0 truncate font-display text-sm italic tracking-wide text-on-shade/75">
            {onOther ? "On the other screen · " : null}
            {isSet ? `${songIndex + 1}/${setSongs.length} · ` : null}
            No. {current.number} · {current.title}
          </p>
          <div className="relative flex shrink-0 items-center">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-on-shade/85"
              aria-label="Choose display"
              onPointerDown={stopStage}
              onPointerUp={stopStage}
              onClick={(event) => {
                event.stopPropagation();
                void openDisplayPicker();
              }}
            >
              <Monitor className="size-5" />
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-on-shade/85"
              aria-label={full ? "Exit full screen" : "Enter full screen"}
              onPointerDown={stopStage}
              onPointerUp={stopStage}
              onClick={(event) => {
                event.stopPropagation();
                void (async () => {
                  if (full) await exitFullscreen();
                  else await enterFullscreen();
                  setFull(isFullscreen());
                })();
              }}
            >
              {full ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-on-shade/85"
              aria-label="Exit presentation"
              onPointerDown={stopStage}
              onPointerUp={stopStage}
              onClick={(event) => {
                event.stopPropagation();
                leave();
              }}
            >
              <X className="size-5" />
            </button>
            {picker ? (
              <div
                className="absolute top-12 right-0 z-40 min-w-52 rounded-2xl bg-navy-deep p-2 text-on-shade shadow-[var(--shadow-border)]"
                onPointerDown={stopStage}
                onPointerUp={stopStage}
              >
                <p className="px-2 pt-1 pb-2 font-sans text-[11px] tracking-[0.16em] text-on-shade/60 uppercase">
                  Show lyrics on
                </p>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left font-sans text-sm hover:bg-on-shade/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    void sendToScreen(currentScreen, true);
                  }}
                >
                  This screen
                </button>
                {otherScreens.map((screen, i) => (
                  <button
                    key={`${screen.left}-${screen.top}-${i}`}
                    type="button"
                    className="flex min-h-11 w-full items-center rounded-xl px-3 text-left font-sans text-sm hover:bg-on-shade/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      void sendToScreen(screen, false);
                    }}
                  >
                    {screenName(screen, currentScreen)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      {showChrome ? (
        <footer
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex items-center justify-between px-2"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            className="flex size-12 items-center justify-center text-on-shade/80 disabled:opacity-25"
            onPointerDown={stopStage}
            onPointerUp={stopStage}
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
            disabled={!canPrev}
            aria-label="Previous stanza"
          >
            <ChevronLeft className="size-7" />
          </button>
          <div className="flex max-w-[60%] flex-wrap items-center justify-center gap-1.5">
            {stanzas.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-2 rounded-full",
                  i === index ? "bg-on-shade" : "bg-on-shade/30",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            className="flex size-12 items-center justify-center text-on-shade/80 disabled:opacity-25"
            onPointerDown={stopStage}
            onPointerUp={stopStage}
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
            disabled={!canNext}
            aria-label="Next stanza"
          >
            <ChevronRight className="size-7" />
          </button>
        </footer>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-on-shade/15">
        <div
          className="h-full bg-on-shade/85 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {hint && !isStage ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-16 z-20 px-6 text-center font-sans text-xs tracking-wide text-on-shade/55">
          {onOther
            ? "Lyrics are on the other screen · arrows turn the page · D to move the display"
            : "Tap sides to turn the page · F full screen · monitor icon for another display"}
        </p>
      ) : null}

      {blank ? (
        <div
          className="absolute inset-0 z-40 bg-shade"
          onPointerDown={stopStage}
          onPointerUp={(event) => {
            event.stopPropagation();
            setBlank(false);
            emit({ blank: false });
          }}
          aria-label="Screen blanked. Tap to show lyrics."
        />
      ) : null}
    </div>
  );
}

function FittedLyrics({
  lines,
  italic,
  stanzaKey,
}: {
  lines: string[];
  italic?: boolean;
  stanzaKey: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(42);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const fit = () => {
      const maxW = box.clientWidth;
      const maxH = box.clientHeight;
      if (maxW < 32 || maxH < 32) return;
      let lo = 18;
      let hi = Math.min(160, Math.floor(maxH / Math.max(lines.length, 1)));
      for (let i = 0; i < 16; i += 1) {
        const mid = (lo + hi) / 2;
        text.style.fontSize = `${mid}px`;
        const fits = text.scrollHeight <= maxH + 1 && text.scrollWidth <= maxW + 1;
        if (fits) lo = mid;
        else hi = mid;
      }
      text.style.fontSize = `${lo}px`;
      setFontSize(lo);
      setReady(true);
    };

    setReady(false);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [lines, stanzaKey]);

  return (
    <div ref={boxRef} className="flex h-full w-full min-h-0 min-w-0 items-center justify-center overflow-hidden">
      <p
        ref={textRef}
        key={stanzaKey}
        aria-live="polite"
        className={cn(
          "present-lyric w-full max-w-6xl px-1 transition-opacity duration-200",
          italic && "italic",
          ready ? "present-lyric-in opacity-100" : "opacity-0",
        )}
        style={{ fontSize }}
      >
        {lines.map((line, lineIndex) => (
          <span key={`${stanzaKey}-${lineIndex}`} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}
