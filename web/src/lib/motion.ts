import type { CSSProperties } from "react";

/** Delay for the .enter-* CSS animations: style={delay(120)}. */
export function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

/** The site's standard "settle into place" curve. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
