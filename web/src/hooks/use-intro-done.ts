"use client";

import { useSyncExternalStore } from "react";

/** Fired on window when the intro loader has finished (or was skipped). */
export const INTRO_DONE_EVENT = "hdf:intro-done";

/**
 * Let page entrances start (the doors are opening). Uses data-intro, not the
 * "intro-done" class: that class hides the loader instantly via CSS and is
 * reserved for the head script (returning visitors, reduced motion).
 */
export function markIntroDone() {
  document.documentElement.dataset.intro = "done";
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

function isDone() {
  const html = document.documentElement;
  return html.dataset.intro === "done" || html.classList.contains("intro-done");
}

function subscribe(onChange: () => void) {
  window.addEventListener(INTRO_DONE_EVENT, onChange);
  return () => window.removeEventListener(INTRO_DONE_EVENT, onChange);
}

/**
 * True once the intro loader is out of the way, so page entrances can start
 * when they're actually visible. Returning visitors never see the intro, so
 * for them this is true immediately (the head script set the class).
 */
export function useIntroDone() {
  return useSyncExternalStore(
    subscribe,
    isDone,
    () => false,
  );
}
