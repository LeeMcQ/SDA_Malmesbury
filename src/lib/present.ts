export const PRESENT_CHANNEL = "malmesbury-praise-stage";
const PROJECTOR_WINDOW_NAME = "malmesbury-stage";

export type ScreenLike = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary?: boolean;
  isInternal?: boolean;
  label?: string;
};

export type PresentCast = {
  type: "cast";
  slug: string;
  index: number;
  blank: boolean;
  set?: string;
};

export type PresentWire =
  | PresentCast
  | { type: "close" }
  | { type: "hello" };

type ScreenDetailsLike = {
  screens: ScreenLike[];
  currentScreen: ScreenLike;
};

let projectorHandle: Window | null = null;
let filledWindow = false;
let previousBounds: { x: number; y: number; w: number; h: number } | null = null;

function asFs(el: HTMLElement) {
  return el as HTMLElement & {
    requestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };
}

function asDoc(doc: Document) {
  return doc as Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
    msFullscreenElement?: Element | null;
  };
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

export function isExtendedDisplay(): boolean {
  try {
    return Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
  } catch {
    return false;
  }
}

export function isFullscreen(doc: Document = document): boolean {
  const node = asDoc(doc);
  return Boolean(
    doc.fullscreenElement || node.webkitFullscreenElement || node.msFullscreenElement || filledWindow,
  );
}

export function subscribeFullscreen(cb: (on: boolean) => void, doc: Document = document): () => void {
  const handler = () => cb(isFullscreen(doc));
  doc.addEventListener("fullscreenchange", handler);
  doc.addEventListener("webkitfullscreenchange", handler);
  doc.addEventListener("MSFullscreenChange", handler);
  return () => {
    doc.removeEventListener("fullscreenchange", handler);
    doc.removeEventListener("webkitfullscreenchange", handler);
    doc.removeEventListener("MSFullscreenChange", handler);
  };
}

export async function enterFullscreen(
  el: HTMLElement = document.documentElement,
  screen?: ScreenLike | null,
  doc: Document = document,
): Promise<boolean> {
  const node = asFs(el);
  const options: FullscreenOptions & { screen?: ScreenLike } = { navigationUI: "hide" };
  if (screen) options.screen = screen;

  const win = el.ownerDocument.defaultView ?? window;

  try {
    if (node.requestFullscreen) {
      await node.requestFullscreen(options);
      if (isFullscreen(doc)) return true;
    }
  } catch {
    /* try without a target screen, then prefixed APIs */
  }

  try {
    if (node.requestFullscreen) {
      await node.requestFullscreen({ navigationUI: "hide" });
      if (isFullscreen(doc)) return true;
    }
    if (node.webkitRequestFullscreen) {
      await node.webkitRequestFullscreen();
      if (isFullscreen(doc)) return true;
    }
    if (node.webkitRequestFullScreen) {
      await node.webkitRequestFullScreen();
      if (isFullscreen(doc)) return true;
    }
    if (node.msRequestFullscreen) {
      await node.msRequestFullscreen();
      if (isFullscreen(doc)) return true;
    }
  } catch {
    /* installed PWAs on Windows can still fill the monitor */
  }

  if (win && (isStandalonePwa() || screen)) {
    fillWindowToScreen(win, screen ?? currentScreenFallback());
    return win === window ? filledWindow : true;
  }

  return isFullscreen(doc);
}

export async function exitFullscreen(doc: Document = document): Promise<void> {
  const node = asDoc(doc);
  try {
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (node.webkitFullscreenElement && node.webkitExitFullscreen) {
      await node.webkitExitFullscreen();
    } else if (node.webkitCancelFullScreen) {
      await node.webkitCancelFullScreen();
    } else if (node.msFullscreenElement && node.msExitFullscreen) {
      await node.msExitFullscreen();
    }
  } catch {
    /* preview iframes and some installed shells reject this */
  }
  restoreFilledWindow();
}

export function currentScreenFallback(): ScreenLike {
  const s = window.screen;
  const availLeft = "availLeft" in s ? Number(s.availLeft) || 0 : 0;
  const availTop = "availTop" in s ? Number(s.availTop) || 0 : 0;
  return {
    availLeft,
    availTop,
    availWidth: s.availWidth,
    availHeight: s.availHeight,
    left: "left" in s ? Number((s as Screen & { left?: number }).left) || availLeft : availLeft,
    top: "top" in s ? Number((s as Screen & { top?: number }).top) || availTop : availTop,
    width: s.width,
    height: s.height,
    isPrimary: true,
    label: "This screen",
  };
}

export function fillWindowToScreen(win: Window, screen: ScreenLike): boolean {
  try {
    if (win === window && !previousBounds) {
      previousBounds = {
        x: window.screenX,
        y: window.screenY,
        w: window.outerWidth,
        h: window.outerHeight,
      };
    }
    win.moveTo(Math.round(screen.availLeft), Math.round(screen.availTop));
    win.resizeTo(Math.round(screen.availWidth), Math.round(screen.availHeight));
    if (win === window) filledWindow = true;
    return true;
  } catch {
    return false;
  }
}

function restoreFilledWindow() {
  if (!filledWindow) return;
  filledWindow = false;
  if (!previousBounds) return;
  try {
    window.moveTo(previousBounds.x, previousBounds.y);
    window.resizeTo(previousBounds.w, previousBounds.h);
  } catch {
    /* ignore */
  }
  previousBounds = null;
}

export async function queryScreenDetails(): Promise<ScreenDetailsLike | null> {
  const getter = (
    window as Window & {
      getScreenDetails?: () => Promise<ScreenDetailsLike>;
    }
  ).getScreenDetails;
  if (typeof getter !== "function") return null;
  try {
    return await getter.call(window);
  } catch {
    return null;
  }
}

export async function listScreens(): Promise<ScreenLike[]> {
  const details = await queryScreenDetails();
  if (details?.screens?.length) return details.screens;
  return [currentScreenFallback()];
}

export function isSameScreen(a: ScreenLike, b: ScreenLike): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}

export function screenName(screen: ScreenLike, current?: ScreenLike | null): string {
  if (current && isSameScreen(screen, current)) return "This screen";
  const label = screen.label?.trim();
  if (label && !label.startsWith("\\\\")) return label;
  if (screen.isPrimary) return "Main display";
  return "Other display";
}

export async function findProjectorScreen(): Promise<ScreenLike | null> {
  if (!isExtendedDisplay()) return null;
  const details = await queryScreenDetails();
  if (!details || details.screens.length < 2) return null;
  const current = details.currentScreen;
  const others = details.screens.filter((screen) => !isSameScreen(screen, current));
  const pool = others.length ? others : details.screens.filter((screen) => !screen.isPrimary);
  if (!pool.length) return null;
  const external = pool.find((screen) => screen.isInternal === false);
  if (external) return external;
  return [...pool].sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

export function presentHref(slug: string, opts: { set?: string; stage?: boolean }): string {
  const url = new URL(
    `${import.meta.env.BASE_URL}present/${encodeURIComponent(slug)}`,
    window.location.origin,
  );
  if (opts.set) url.searchParams.set("set", opts.set);
  if (opts.stage) url.searchParams.set("stage", "1");
  return url.pathname + url.search;
}

export function getProjectorWindow(): Window | null {
  if (projectorHandle && projectorHandle.closed) projectorHandle = null;
  return projectorHandle;
}

export function closeProjectorWindow() {
  const win = getProjectorWindow();
  try {
    win?.close();
  } catch {
    /* ignore */
  }
  projectorHandle = null;
  postPresentCast({ type: "close" });
}

export function openProjectorWindow(
  slug: string,
  opts: { set?: string; screen: ScreenLike },
): Window | null {
  const href = presentHref(slug, { set: opts.set, stage: true });
  const s = opts.screen;
  const features = [
    `left=${Math.round(s.availLeft)}`,
    `top=${Math.round(s.availTop)}`,
    `width=${Math.round(s.availWidth)}`,
    `height=${Math.round(s.availHeight)}`,
    "popup=yes",
  ].join(",");

  let win: Window | null = null;
  try {
    win = window.open(href, PROJECTOR_WINDOW_NAME, features);
  } catch {
    win = null;
  }
  projectorHandle = win && !win.closed ? win : null;
  if (!projectorHandle) return null;

  const fill = () => {
    const open = getProjectorWindow();
    if (!open) return;
    fillWindowToScreen(open, s);
    const el = open.document.documentElement;
    void enterFullscreen(el, s, open.document);
  };
  projectorHandle.addEventListener("load", fill);
  window.setTimeout(fill, 250);
  window.setTimeout(fill, 800);
  return projectorHandle;
}

export function postPresentCast(message: PresentWire) {
  try {
    const channel = new BroadcastChannel(PRESENT_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    /* private mode / old engines */
  }
}

export function subscribePresentCast(handler: (message: PresentWire) => void): () => void {
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(PRESENT_CHANNEL);
    channel.onmessage = (event: MessageEvent<PresentWire>) => {
      if (event.data && typeof event.data === "object") handler(event.data);
    };
  } catch {
    return () => {};
  }
  return () => channel?.close();
}

export function acquireWakeLock(): () => void {
  let sentinel: WakeLockSentinel | null = null;
  let stopped = false;

  async function request() {
    if (stopped || document.visibilityState !== "visible") return;
    try {
      if ("wakeLock" in navigator) {
        sentinel = await navigator.wakeLock.request("screen");
      }
    } catch {
      sentinel = null;
    }
  }

  void request();
  const onVis = () => {
    void request();
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    stopped = true;
    document.removeEventListener("visibilitychange", onVis);
    void sentinel?.release();
  };
}
