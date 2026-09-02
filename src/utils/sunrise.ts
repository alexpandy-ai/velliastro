import type { ChartPlace } from "./grahaPositions";
import { dateToJulianDate } from "./grahaPositions";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const JD_J2000 = 2451545.0;
/** Upper solar limb at horizon with atmospheric refraction. */
const SUNRISE_ALTITUDE = -0.833 * DEG_TO_RAD;

function julianCenturies(jd: number): number {
  return (jd - JD_J2000) / 36525.0;
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function sunApparentLongitude(jd: number): number {
  const T = julianCenturies(jd);
  const L0 = (280.46646 + 36000.76983 * T) * DEG_TO_RAD;
  const M = (357.52911 + 35999.05029 * T) * DEG_TO_RAD;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  return L0 + C * DEG_TO_RAD;
}

function meanObliquity(jd: number): number {
  const T = julianCenturies(jd);
  return (
    (23.439291 -
      0.0130042 * T -
      0.00000016 * T * T +
      0.000000504 * T * T * T) *
    DEG_TO_RAD
  );
}

function gmstDegrees(jd: number): number {
  const T = julianCenturies(jd);
  return normalizeDegrees(
    280.46061837 +
      360.98564736629 * (jd - JD_J2000) +
      0.000387933 * T * T -
      (T * T * T) / 38710000.0,
  );
}

function sunAltitudeRad(jd: number, latitude: number, longitude: number): number {
  const lambda = sunApparentLongitude(jd);
  const epsilon = meanObliquity(jd);
  const decl = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
  const ra = Math.atan2(
    Math.cos(epsilon) * Math.sin(lambda),
    Math.cos(lambda),
  );
  const lst = normalizeDegrees(gmstDegrees(jd) + longitude) * DEG_TO_RAD;
  const hourAngle = lst - ra;
  const latRad = latitude * DEG_TO_RAD;

  return Math.asin(
    Math.sin(latRad) * Math.sin(decl) +
      Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle),
  );
}

/** Local sunrise for the calendar day at `date` (time portion ignored). */
export function getSunriseTime(
  date: Date,
  place: ChartPlace,
): Date | null {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const dayStart = new Date(year, month, day, 0, 0, 0, 0).getTime();
  const solarNoon = new Date(year, month, day, 12, 0, 0, 0).getTime();

  const altitudeAtStart = sunAltitudeRad(
    dateToJulianDate(new Date(dayStart)),
    place.latitude,
    place.longitude,
  );
  const altitudeAtNoon = sunAltitudeRad(
    dateToJulianDate(new Date(solarNoon)),
    place.latitude,
    place.longitude,
  );

  if (altitudeAtNoon < SUNRISE_ALTITUDE) return null;

  let low = dayStart;
  let high = solarNoon;

  if (altitudeAtStart >= SUNRISE_ALTITUDE) {
    return new Date(dayStart);
  }

  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    const altitude = sunAltitudeRad(
      dateToJulianDate(new Date(mid)),
      place.latitude,
      place.longitude,
    );
    if (altitude < SUNRISE_ALTITUDE) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}

export function formatSunriseTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSunriseLabel(
  date: Date,
  place: ChartPlace,
): string {
  const sunrise = getSunriseTime(date, place);
  if (!sunrise) return "—";
  return formatSunriseTime(sunrise);
}
