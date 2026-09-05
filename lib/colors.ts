import { hsl } from "d3";

/**
 * A hand-tuned categorical palette for the "tide chart" aesthetic:
 * evenly spaced hues at a saturation/lightness that reads clearly
 * against the deep-navy chart-paper background, starting at teal
 * (matching the brand accent) and sweeping through to warm brass/coral.
 */
export function makePalette(names: string[]): Map<string, string> {
  const n = names.length;
  const startHue = 172; // tide teal
  const map = new Map<string, string>();
  names.forEach((name, i) => {
    const hue = (startHue + (i * 360) / n) % 360;
    const light = i % 2 === 0 ? 0.6 : 0.68;
    const sat = 0.5;
    map.set(name, hsl(hue, sat, light).formatHex());
  });
  return map;
}

export const NEUTRAL_LINE = "#3d5f70";
