/**
 * Tiny scripts inlined into <head> so they run before the first paint.
 * Kept in a plain module (not "use client") so the server layout receives the
 * actual text.
 */

export const THEME_STORAGE_KEY = "hdf-theme";
export const INTRO_SEEN_KEY = "hdf-intro-seen";

/** Apply a saved light/dark choice. Dark is the default in the HTML. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** Hide the intro for visitors who already saw it this session or prefer reduced motion. */
export const preloaderSkipScript = `(function(){try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("intro-done")}catch(e){document.documentElement.classList.add("intro-done")}})()`;
