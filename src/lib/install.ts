"use client";

import { useSyncExternalStore } from "react";

/** Chrome's install event (not in TypeScript's DOM types yet) */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = {
  /** Already opened from the home screen */
  installed: boolean;
  /** Chrome on Android (and desktop) can install with one tap */
  canPrompt: boolean;
  /** iPhone and iPad install by hand: Share, then "Add to Home Screen" */
  ios: boolean;
};

const SERVER: InstallState = { installed: false, canPrompt: false, ios: false };
let state = SERVER;
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let started = false;

function set(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const ua = navigator.userAgent;
  state = {
    installed:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    canPrompt: false,
    // iPadOS reports itself as a Mac, so check for touch too
    ios: /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1),
  };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    set({ canPrompt: true });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ installed: true, canPrompt: false });
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstall() {
  return useSyncExternalStore(
    subscribe,
    () => (start(), state),
    () => SERVER,
  );
}

/** Shows Chrome's own install dialog. Returns true if the person installed the app. */
export async function installApp() {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  set({ canPrompt: false });
  await e.prompt();
  return (await e.userChoice).outcome === "accepted";
}

/** Registers the service worker (production only: in development it would cache stale files) */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .catch(() => {});
}
