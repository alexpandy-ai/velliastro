import type { GrahaPosition } from "./grahaPositions";
import { normalizeDegrees } from "./positions";

export const EPHEMERIS_COMPARE_TOLERANCE_DEG = 1;

export type EphemerisSource = "builtin" | "reference" | "api";

export function angularDistanceDegrees(a: number, b: number): number {
  const delta = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return delta > 180 ? 360 - delta : delta;
}

export function compareGrahaPositionsToLongitudes(
  positions: GrahaPosition[],
  referenceLongitudes: Record<string, number>,
  sourceLabel: string,
  toleranceDeg = EPHEMERIS_COMPARE_TOLERANCE_DEG,
): string[] {
  const issues: string[] = [];

  for (const position of positions) {
    const referenceLongitude = referenceLongitudes[position.graha.id];
    if (typeof referenceLongitude !== "number" || !Number.isFinite(referenceLongitude)) {
      continue;
    }

    const delta = angularDistanceDegrees(position.longitude, referenceLongitude);
    if (delta > toleranceDeg) {
      issues.push(
        `${position.graha.nameEnglish}: chart ${position.longitude.toFixed(1)}° vs ${sourceLabel} ${referenceLongitude.toFixed(1)}° (Δ ${delta.toFixed(1)}°)`,
      );
    }
  }

  return issues;
}

export function referenceLongitudesFromPositions(
  positions: GrahaPosition[],
): Record<string, number> {
  const longitudes: Record<string, number> = {};
  for (const position of positions) {
    longitudes[position.graha.id] = position.longitude;
  }
  return longitudes;
}
