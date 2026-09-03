import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  SunPosition,
} from "astronomy-engine";
import { grahas, type Graha } from "../data/grahas";
import { longitudeToZodiac, normalizeDegrees } from "./positions";

export type GrahaPosition = {
  graha: Graha;
  longitude: number;
  formatted: string;
  sign: string;
};

export type ChartPlace = {
  latitude: number;
  longitude: number;
};

const JD_J2000 = 2451545.0;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Julian date (UTC) from a JavaScript Date. */
export function dateToJulianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

export function julianCenturies(jd: number): number {
  return (jd - JD_J2000) / 36525.0;
}

/** Lahiri ayanamsa (ICRC 1956 / Chitrapaksha) — matches AstroSage at J2000 ≈ 23°51′41″. */
export function getLahiriAyanamsa(jd: number): number {
  const T = julianCenturies(jd);
  return (
    23.860974 +
    1.395524 * T +
    0.000308 * T * T +
    0.0000005 * T * T * T
  );
}

export function tropicalToSidereal(
  tropicalLongitude: number,
  jd: number,
): number {
  return normalizeDegrees(tropicalLongitude - getLahiriAyanamsa(jd));
}

export function getRahuTropicalLongitude(jd: number): number {
  const T = julianCenturies(jd);
  return normalizeDegrees(
    125.0445479 -
      1934.1362891 * T +
      0.0020754 * T * T +
      (T * T * T) / 467441 -
      (T * T * T * T) / 60616000,
  );
}

const GRAHA_BODY: Partial<Record<string, Body>> = {
  chandra: Body.Moon,
  sevvai: Body.Mars,
  budhan: Body.Mercury,
  guru: Body.Jupiter,
  sukran: Body.Venus,
  sani: Body.Saturn,
};

/** Apparent geocentric tropical ecliptic longitude (degrees). */
export function getGeocentricTropicalLongitude(
  grahaId: string,
  date: Date,
): number {
  if (grahaId === "surya") {
    return normalizeDegrees(SunPosition(date).elon);
  }

  if (grahaId === "chandra") {
    return normalizeDegrees(EclipticGeoMoon(date).lon);
  }

  if (grahaId in GRAHA_BODY) {
    const body = GRAHA_BODY[grahaId] ?? Body.Moon;
    const vector = GeoVector(body, date, true);
    return normalizeDegrees(Ecliptic(vector).elon);
  }

  if (grahaId === "rahu") {
    return getRahuTropicalLongitude(dateToJulianDate(date));
  }

  return 0;
}

/** Sidereal ecliptic longitude for a graha at the given datetime. */
export function getGrahaLongitude(grahaId: string, date = new Date()): number {
  if (grahaId === "bhoomi" || grahaId === "earth") {
    return normalizeDegrees(getGrahaLongitude("surya", date) + 180);
  }

  if (grahaId === "ketu") {
    return normalizeDegrees(getGrahaLongitude("rahu", date) + 180);
  }

  const jd = dateToJulianDate(date);

  if (grahaId === "rahu") {
    return tropicalToSidereal(getRahuTropicalLongitude(jd), jd);
  }

  const tropical = getGeocentricTropicalLongitude(grahaId, date);
  return tropicalToSidereal(tropical, jd);
}

export function getGrahaPositions(
  date = new Date(),
  _place?: ChartPlace,
): GrahaPosition[] {
  void _place;
  return grahas.map((graha) => {
    const longitude = getGrahaLongitude(graha.id, date);
    const zodiac = longitudeToZodiac(longitude);

    return {
      graha,
      longitude,
      formatted: zodiac.formatted,
      sign: zodiac.sign,
    };
  });
}

export function grahaPositionFromLongitude(
  graha: Graha,
  longitude: number,
): GrahaPosition {
  const normalized = normalizeDegrees(longitude);
  const zodiac = longitudeToZodiac(normalized);

  return {
    graha,
    longitude: normalized,
    formatted: zodiac.formatted,
    sign: zodiac.sign,
  };
}

/** Parse in-sign position text such as `15°30'`. */
export function parseFormattedPositionInSign(formatted: string): number | null {
  const trimmed = formatted.trim();
  const dmsMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*°\s*(\d{1,2})?'?$/);
  if (dmsMatch) {
    const degrees = parseFloat(dmsMatch[1]);
    const minutes = parseInt(dmsMatch[2], 10);
    const inSign = degrees + minutes / 60;
    if (inSign >= 0 && inSign < 30) return inSign;
  }

  const simple = parseFloat(trimmed.replace(/[°'"]/g, " ").trim());
  if (Number.isFinite(simple) && simple >= 0 && simple < 30) return simple;
  return null;
}

export function updateGrahaPositionField(
  position: GrahaPosition,
  field: "longitude" | "formatted",
  rawValue: string,
): GrahaPosition {
  if (field === "longitude") {
    const value = parseFloat(rawValue.replace(/°$/, "").trim());
    if (!Number.isFinite(value)) return position;
    return grahaPositionFromLongitude(position.graha, value);
  }

  const degreeInSign = parseFormattedPositionInSign(rawValue);
  if (degreeInSign === null) return position;

  const signIndex = Math.floor(normalizeDegrees(position.longitude) / 30);
  return grahaPositionFromLongitude(
    position.graha,
    signIndex * 30 + degreeInSign,
  );
}

export function finalizeGrahaPositions(
  positions: GrahaPosition[],
): GrahaPosition[] {
  return positions.map((position) =>
    grahaPositionFromLongitude(position.graha, position.longitude),
  );
}

/** 0° on the left; degrees increase counter-clockwise. */
export function polarToChart(
  longitude: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  const rad = ((longitude + 180) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

export const SECTOR_COUNT = 16;
export const SECTOR_DEGREES = 360 / SECTOR_COUNT;
export const PLANET_LABEL_RADIUS = 139;
export const PLANET_MIN_FONT_SIZE = 7;
export const PLANET_MAX_FONT_SIZE = 8;
export const SECTOR_LABEL_RADIAL_MARGIN = 10;
export const SECTOR_ANGULAR_MARGIN = 1.5;
export const SECTOR_LABEL_LINE_HEIGHT = 1.15;

export type SectorPlanetGroup = {
  sectorIndex: number;
  startAngle: number;
  endAngle: number;
  planets: GrahaPosition[];
};

export type SectorPlanetLabelLayout = {
  x: number;
  y: number;
  labelAngle: number;
  fontSize: number;
  text: string;
  lines: string[];
};

/** Sector index for a longitude: floor(longitude / 22.5) % 16 */
export function getSectorIndex(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / SECTOR_DEGREES) % SECTOR_COUNT;
}

export function getSectorStartAngle(sectorIndex: number): number {
  return sectorIndex * SECTOR_DEGREES;
}

export function getSectorEndAngle(sectorIndex: number): number {
  return (sectorIndex + 1) * SECTOR_DEGREES;
}

export function getSectorMidAngle(sectorIndex: number): number {
  return sectorIndex * SECTOR_DEGREES + SECTOR_DEGREES / 2;
}

/** SVG wedge path for sector clipPath or fill. */
export function describeSectorWedge(
  cx: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToChart(startAngle, outerR, cx);
  const endOuter = polarToChart(endAngle, outerR, cx);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  if (innerR <= 0) {
    return [
      `M ${cx} ${cx}`,
      `L ${startOuter.x} ${startOuter.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      "Z",
    ].join(" ");
  }

  const startInner = polarToChart(endAngle, innerR, cx);
  const endInner = polarToChart(startAngle, innerR, cx);

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

/** Sector wedge inset for planet label clipPath (radial + angular margins). */
export function describeInsetSectorWedge(
  cx: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  radialMargin = SECTOR_LABEL_RADIAL_MARGIN,
  angularMargin = SECTOR_ANGULAR_MARGIN,
): string {
  return describeSectorWedge(
    cx,
    innerR + radialMargin,
    outerR - radialMargin,
    startAngle + angularMargin,
    endAngle - angularMargin,
  );
}

function formatPlanetLongitude(longitude: number): string {
  return `${longitude.toFixed(1)}°`;
}

export type ChartLang = "ta" | "en";

function formatPlanetLabelPart(
  position: GrahaPosition,
  lang: ChartLang = "ta",
): string {
  const name =
    lang === "ta" ? position.graha.nameTamil : position.graha.nameEnglish;
  return `${name} (${formatPlanetLongitude(position.longitude)})`;
}

/** Comma-separated label for all planets in a sector, sorted by longitude. */
export function formatSectorPlanetLabel(
  planets: GrahaPosition[],
  lang: ChartLang = "ta",
): string {
  return [...planets]
    .sort((a, b) => a.longitude - b.longitude)
    .map((position) => formatPlanetLabelPart(position, lang))
    .join(", ");
}

function estimateLabelTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const ch of text) {
    width += /[\u0B80-\u0BFF]/.test(ch) ? fontSize * 0.78 : fontSize * 0.52;
  }
  return width;
}

/** Chord width at radius R across sector half-span minus angular margin. */
export function getSectorLabelMaxWidth(radius: number): number {
  const halfSpanDeg = SECTOR_DEGREES / 2 - SECTOR_ANGULAR_MARGIN;
  return 2 * radius * Math.sin((halfSpanDeg * Math.PI) / 180);
}

/** Pack comma-separated planet parts into lines that fit maxWidth at fontSize. */
export function wrapSectorText(
  text: string,
  maxWidth: number,
  fontSize: number,
): string[] {
  const parts = text.split(", ");
  const lines: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? `${current}, ${part}` : part;
    if (estimateLabelTextWidth(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = part;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function fitSectorLabelLayout(
  text: string,
  radius: number,
): { fontSize: number; lines: string[] } {
  const maxWidth = getSectorLabelMaxWidth(radius);

  for (let size = PLANET_MAX_FONT_SIZE; size >= PLANET_MIN_FONT_SIZE; size -= 0.5) {
    const lines = wrapSectorText(text, maxWidth, size);
    const allFit = lines.every(
      (line) => estimateLabelTextWidth(line, size) <= maxWidth,
    );
    if (allFit) return { fontSize: size, lines };
  }

  const fontSize = PLANET_MIN_FONT_SIZE;
  return { fontSize, lines: wrapSectorText(text, maxWidth, fontSize) };
}

/**
 * Lay out one planet label at its sidereal longitude on the ring.
 */
export function layoutPlanetLabelAtLongitude(
  position: GrahaPosition,
  center: number,
): SectorPlanetLabelLayout & { sectorIndex: number } {
  const angle = normalizeDegrees(position.longitude);
  const { x, y } = polarToChart(angle, PLANET_LABEL_RADIUS, center);
  const text = formatPlanetLabelPart(position);
  const { fontSize, lines } = fitSectorLabelLayout(text, PLANET_LABEL_RADIUS);

  return {
    x,
    y,
    labelAngle: angle,
    fontSize,
    text,
    lines,
    sectorIndex: getSectorIndex(angle),
  };
}

/** Verify table Position column matches Degree column for each graha. */
export function verifyGrahaPositionConsistency(
  position: GrahaPosition,
): string | null {
  const derived = grahaPositionFromLongitude(position.graha, position.longitude);
  if (derived.formatted !== position.formatted) {
    return `${position.graha.nameEnglish}: position ${position.formatted} does not match degree ${position.longitude.toFixed(1)}° (expected ${derived.formatted})`;
  }
  return null;
}

export function verifyGrahaPositions(positions: GrahaPosition[]): string[] {
  return positions
    .map((position) => verifyGrahaPositionConsistency(position))
    .filter((issue): issue is string => issue !== null);
}

/**
 * Lay out one comma-separated planet label at the sector mid-angle.
 * Planets are grouped by sector, not placed at exact longitude spokes.
 * @deprecated Prefer layoutPlanetLabelAtLongitude for degree-accurate placement.
 */
export function layoutSectorPlanetLabel(
  planets: GrahaPosition[],
  sectorIndex: number,
  center: number,
  _innerRadius?: number,
  _outerRadius?: number,
  lang: ChartLang = "ta",
): SectorPlanetLabelLayout | null {
  if (planets.length === 0) return null;

  const midAngle = getSectorMidAngle(sectorIndex);
  const { x, y } = polarToChart(midAngle, PLANET_LABEL_RADIUS, center);
  const text = formatSectorPlanetLabel(planets, lang);
  const { fontSize, lines } = fitSectorLabelLayout(text, PLANET_LABEL_RADIUS);

  return {
    x,
    y,
    labelAngle: midAngle,
    fontSize,
    text,
    lines,
  };
}

/** Group planets by 22.5° sector for clipped wedge labels. */
export function groupPlanetsBySector(
  positions: GrahaPosition[],
): SectorPlanetGroup[] {
  const groups = new Map<number, GrahaPosition[]>();

  for (const pos of positions) {
    const idx = getSectorIndex(pos.longitude);
    const list = groups.get(idx) ?? [];
    list.push(pos);
    groups.set(idx, list);
  }

  return Array.from(groups.entries())
    .map(([sectorIndex, planets]) => ({
      sectorIndex,
      startAngle: getSectorStartAngle(sectorIndex),
      endAngle: getSectorEndAngle(sectorIndex),
      planets: [...planets].sort((a, b) => a.longitude - b.longitude),
    }))
    .sort((a, b) => a.sectorIndex - b.sectorIndex);
}

/** Tamil day convention: 16 sectors of 90 min each, starting 6:00 AM. */
export const DAY_START_HOUR = 6;
export const SECTORS_PER_DAY = 16;
export const MINUTES_PER_SECTOR = (24 * 60) / SECTORS_PER_DAY;
export const BOUNDARY_LABEL_RADIUS_OFFSET = 31;
/** Alternate radius so adjacent combined labels do not overlap. */
export const BOUNDARY_LABEL_RADIUS_STAGGER = 12;
export const DEGREE_LABEL_RADIUS_OFFSET = BOUNDARY_LABEL_RADIUS_OFFSET;
export const TIME_LABEL_RADIUS_OFFSET = BOUNDARY_LABEL_RADIUS_OFFSET;

export function formatBoundaryDegreeLabel(angle: number): string {
  const text = angle % 1 === 0 ? String(angle) : angle.toFixed(1);
  return `${text}°`;
}

export function formatSectorStartTime(
  sectorIndex: number,
  dayStartHour = DAY_START_HOUR,
): string {
  const sectorStart = dayStartHour * 60 + sectorIndex * MINUTES_PER_SECTOR;
  const mins = ((sectorStart % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = String(Math.floor(mins / 60)).padStart(2, "0");
  const minutes = String(mins % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Combined outside label: e.g. `0° (06:00)`. */
export function formatBoundaryDegreeTimeLabel(
  angle: number,
  sectorIndex: number,
  dayStartHour = DAY_START_HOUR,
): string {
  return `${formatBoundaryDegreeLabel(angle)} (${formatSectorStartTime(sectorIndex, dayStartHour)})`;
}

export function getBoundaryLabelRadiusOffset(sectorIndex: number): number {
  return (
    BOUNDARY_LABEL_RADIUS_OFFSET +
    (sectorIndex % 2) * BOUNDARY_LABEL_RADIUS_STAGGER
  );
}

export type SectorTimeLabel = {
  index: number;
  angle: number;
  label: string;
};

/** @deprecated Use formatSectorStartTime — kept for callers expecting bracketed time. */
export function formatSectorStartTimeBracket(
  sectorIndex: number,
  dayStartHour = DAY_START_HOUR,
): string {
  return `[${formatSectorStartTime(sectorIndex, dayStartHour)}]`;
}

/** Start times at each degree boundary, in chronological order around the ring. */
export function getSectorTimeLabels(
  dayStartHour = DAY_START_HOUR,
): SectorTimeLabel[] {
  const degreesPerSector = 360 / SECTORS_PER_DAY;

  return Array.from({ length: SECTORS_PER_DAY }, (_, index) => ({
    index,
    angle: index * degreesPerSector,
    label: formatBoundaryDegreeTimeLabel(index * degreesPerSector, index, dayStartHour),
  }));
}

/** Rotate labels tangent to the ring; flip on the lower half for readability. */
export function labelTangentRotation(angle: number): number {
  let rotation = angle - 90;
  if (Math.sin(((angle + 180) * Math.PI) / 180) > 0) {
    rotation += 180;
  }
  return rotation;
}

/** Rotate planet labels along the spoke (radius); flip on the left half for readability. */
export function labelRadialRotation(angle: number): number {
  let rotation = angle;
  if (Math.cos((angle * Math.PI) / 180) < 0) {
    rotation += 180;
  }
  return rotation;
}

/** Text reads from outside toward center along spoke at angle. */
export function labelRadialInwardRotation(angle: number): number {
  let rotation = angle;
  if (angle >= 90 && angle <= 270) {
    rotation += 180;
  }
  return rotation;
}

/** Rotate outer time labels radially inward toward center. */
export function getTimeLabelRotation(midAngle: number): number {
  return labelRadialInwardRotation(midAngle);
}

/**
 * Sidereal ascendant (Lagna) ecliptic longitude from datetime and place.
 * Uses GMST + longitude → RAMC, standard obliquity formula, Lahiri ayanamsa.
 */
export function getAscendantLongitude(
  date: Date,
  place: ChartPlace,
): number {
  const jd = dateToJulianDate(date);
  const T = julianCenturies(jd);

  const obliquity =
    (23.439291 - 0.0130042 * T) * DEG_TO_RAD;

  const gmst = normalizeDegrees(
    280.46061837 +
      360.98564736629 * (jd - JD_J2000) +
      0.000387933 * T * T -
      (T * T * T) / 38710000.0,
  );

  const lst = normalizeDegrees(gmst + place.longitude);
  const lstRad = lst * DEG_TO_RAD;
  const latRad = place.latitude * DEG_TO_RAD;

  const y = Math.sin(lstRad);
  const x =
    Math.cos(lstRad) * Math.cos(obliquity) -
    Math.tan(latRad) * Math.sin(obliquity);
  const ascTropical = normalizeDegrees(Math.atan2(y, x) * RAD_TO_DEG);

  return tropicalToSidereal(ascTropical, jd);
}

/** Chart-wheel angle for the lagnam spoke (= sidereal ascendant longitude). */
export function getLagnamAngle(date: Date, place: ChartPlace): number {
  return getAscendantLongitude(date, place);
}

/** @deprecated Use getLagnamAngle with place for location-aware ascendant. */
export function timeToLagnamAngle(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const dayStart = DAY_START_HOUR * 60;
  let elapsed = minutes - dayStart;
  if (elapsed < 0) elapsed += 24 * 60;
  const fraction = elapsed / (24 * 60);
  return fraction * 360;
}

export const LAGNAM_LABEL_RADIUS = 124;

export function formatLagnamDegree(longitude: number): string {
  return `${longitude.toFixed(1)}°`;
}

export function formatLagnamTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

