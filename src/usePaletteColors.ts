import { useEffect, useState } from "react";

const SCHEME = "(prefers-color-scheme: light)";

function readTokens(names: readonly string[]): string[] {
  const style = getComputedStyle(document.documentElement);
  return names.map((n) => style.getPropertyValue(n).trim());
}

export function usePaletteColors(tokens: readonly string[]): string[] {
  const key = tokens.join(",");
  const [values, setValues] = useState(() => readTokens(tokens));

  useEffect(() => {
    const media = window.matchMedia(SCHEME);
    const sync = () => setValues(readTokens(key.split(",")));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [key]);

  return values;
}
