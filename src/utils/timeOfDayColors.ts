import { DAY_START_HOUR, MINUTES_PER_SECTOR, SECTOR_COUNT } from "./grahaPositions";

/** Day palette — warm light tones (6:00–17:00). */
export const DAY_COLORS = ["#fff8e7", "#fef3c7", "#fde68a"] as const;

/** Sunset transition — orange → purple → indigo (17:00–19:00). */
export const SUNSET_COLORS = ["#fcd34d", "#a78bfa", "#6366f1"] as const;

/** Night palette — deep cool blues (19:00–5:00). */
export const NIGHT_COLORS = ["#1e1b4b", "#312e81", "#3730a3"] as const;

/** Sunrise transition — indigo → amber → day cream (5:00–6:00). */
export const SUNRISE_COLORS = ["#6366f1", "#fbbf24", "#fff8e7"] as const;

const MINUTES_PER_DAY = 24 * 60;
const DAY_START = 6 * 60;
const DAY_END = 17 * 60;
const SUNSET_END = 19 * 60;
const SUNRISE_START = 5 * 60;

type Hsl = { h: number; s: number; l: number };

export type SectorFillColors = {
  fill: string;
  fillAlt: string;
};

export type ChartAccentColors = {
  ring: string;
  spoke: string;
  panelGradient: string;
};

function normalizeMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }

  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Shortest-path hue interpolation for smooth sunset/sunrise blends. */
export function lerpHsl(a: string, b: string, t: number): string {
  const ha = hexToHsl(a);
  const hb = hexToHsl(b);
  const clamped = Math.max(0, Math.min(1, t));

  let dh = hb.h - ha.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return hslToHex(
    ha.h + dh * clamped,
    ha.s + (hb.s - ha.s) * clamped,
    ha.l + (hb.l - ha.l) * clamped,
  );
}

function lerpPalette(colors: readonly string[], t: number): string {
  if (colors.length === 0) return "#ffffff";
  if (colors.length === 1) return colors[0];
  const scaled = t * (colors.length - 1);
  const i = Math.min(Math.floor(scaled), colors.length - 2);
  return lerpHsl(colors[i], colors[i + 1], scaled - i);
}

/** Base fill color at a clock-time (minutes from midnight, 0–1440). */
export function getTimeOfDayColor(clockMinutes: number): string {
  const m = normalizeMinutes(clockMinutes);

  if (m >= DAY_START && m < DAY_END) {
    return lerpPalette(DAY_COLORS, (m - DAY_START) / (DAY_END - DAY_START));
  }

  if (m >= DAY_END && m < SUNSET_END) {
    return lerpPalette(SUNSET_COLORS, (m - DAY_END) / (SUNSET_END - DAY_END));
  }

  if (m >= SUNSET_END || m < SUNRISE_START) {
    const nightSpan = MINUTES_PER_DAY - SUNSET_END + SUNRISE_START;
    const nightElapsed =
      m >= SUNSET_END ? m - SUNSET_END : m + (MINUTES_PER_DAY - SUNSET_END);
    return lerpPalette(NIGHT_COLORS, nightElapsed / nightSpan);
  }

  return lerpPalette(SUNRISE_COLORS, (m - SUNRISE_START) / (DAY_START - SUNRISE_START));
}

function shiftLightness(hex: string, delta: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

/** Sector midpoint in clock minutes (sector 0 starts at 6:00 AM). */
export function getSectorMidpointClockMinutes(sectorIndex: number): number {
  const start = DAY_START_HOUR * 60 + sectorIndex * MINUTES_PER_SECTOR;
  return normalizeMinutes(start + MINUTES_PER_SECTOR / 2);
}

/** Alternating sector fills tinted by each sector's midpoint time. */
export function getSectorFillColors(sectorIndex: number): SectorFillColors {
  const base = getTimeOfDayColor(getSectorMidpointClockMinutes(sectorIndex));
  const { l } = hexToHsl(base);
  const evenDelta = l < 35 ? 4 : 3;
  const oddDelta = l < 35 ? -3 : -2;

  return {
    fill: shiftLightness(base, oddDelta),
    fillAlt: shiftLightness(base, evenDelta),
  };
}

export function getAllSectorFillColors(): SectorFillColors[] {
  return Array.from({ length: SECTOR_COUNT }, (_, i) => getSectorFillColors(i));
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [rs, gs, bs] = [r, g, b].map(linearize);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isDarkFill(hex: string): boolean {
  return relativeLuminance(hex) < 0.45;
}

export function getSectorDisplayFill(sectorIndex: number): string {
  const { fill, fillAlt } = getSectorFillColors(sectorIndex);
  return sectorIndex % 2 === 0 ? fillAlt : fill;
}

export function isDarkSector(sectorIndex: number): boolean {
  return isDarkFill(getSectorDisplayFill(sectorIndex));
}

export type SectorTextColors = {
  fill: string;
  stroke: string;
};

/** Adaptive text colors for labels drawn inside a sector wedge. */
export function getSectorTextColors(sectorIndex: number): SectorTextColors {
  const sectorFill = getSectorDisplayFill(sectorIndex);
  return {
    fill: getPlanetLabelFill(sectorFill),
    stroke: getPlanetLabelStroke(sectorFill),
  };
}

/** Planet label halo — light halo on day sectors, dark halo on night sectors. */
export function getPlanetLabelStroke(sectorFill: string): string {
  return isDarkFill(sectorFill)
    ? "rgba(30, 27, 75, 0.85)"
    : "rgba(255, 255, 255, 0.92)";
}

export function getPlanetLabelFill(sectorFill: string): string {
  return isDarkFill(sectorFill) ? "#f8fafc" : "#1a1a2e";
}

function nightBlend(minutes: number): number {
  const m = normalizeMinutes(minutes);
  if (m >= DAY_START && m < DAY_END) return 0;
  if (m >= DAY_END && m < SUNSET_END) return (m - DAY_END) / (SUNSET_END - DAY_END);
  if (m >= SUNSET_END || m < SUNRISE_START) return 1;
  return 1 - (m - SUNRISE_START) / (DAY_START - SUNRISE_START);
}

/** Ring, spoke, and panel accents from the selected datetime. */
export function getChartAccentColors(clockMinutes: number): ChartAccentColors {
  const night = nightBlend(clockMinutes);
  const ring = lerpHsl("#8b5cf6", "#5b5894", night);
  const spoke = lerpHsl("#c4b5fd", "#4a4678", night * 0.85);
  const base = getTimeOfDayColor(clockMinutes);
  const light = shiftLightness(base, 12);
  const warm = shiftLightness(lerpHsl(base, "#fff8f0", 0.35), 8);

  return {
    ring,
    spoke,
    panelGradient: `linear-gradient(145deg, ${light} 0%, #ffffff 55%, ${warm} 100%)`,
  };
}

export function getClockMinutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
