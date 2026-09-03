import {
  Body,
  Ecliptic,
  Equator,
  HelioVector,
  Observer,
  RotateVector,
  Rotation_EQD_ECL,
  SphereFromVector,
} from "astronomy-engine";
import { grahas } from "../data/grahas";
import {
  dateToJulianDate,
  getGeocentricTropicalLongitude,
  getRahuTropicalLongitude,
  grahaPositionFromLongitude,
  tropicalToSidereal,
  type ChartPlace,
  type GrahaPosition,
} from "./grahaPositions";
import { normalizeDegrees } from "./positions";

export type ReferenceFrame = "geocentric" | "topocentric" | "heliocentric";

const GRAHA_BODY: Partial<Record<string, Body>> = {
  chandra: Body.Moon,
  sevvai: Body.Mars,
  budhan: Body.Mercury,
  guru: Body.Jupiter,
  sukran: Body.Venus,
  sani: Body.Saturn,
};

function tropicalFromEquator(body: Body, date: Date, place: ChartPlace): number {
  const observer = new Observer(place.latitude, place.longitude, 0);
  const equ = Equator(body, date, observer, true, true);
  const eclVec = RotateVector(Rotation_EQD_ECL(date), equ.vec);
  return normalizeDegrees(SphereFromVector(eclVec).lon);
}

function getTopocentricTropicalLongitude(
  grahaId: string,
  date: Date,
  place: ChartPlace,
): number | null {
  if (grahaId === "ketu") {
    const rahu = getTopocentricTropicalLongitude("rahu", date, place);
    return rahu == null ? null : normalizeDegrees(rahu + 180);
  }
  if (grahaId === "rahu") return getRahuTropicalLongitude(dateToJulianDate(date));
  if (grahaId === "surya" || grahaId === "chandra") {
    const body = grahaId === "surya" ? Body.Sun : Body.Moon;
    return tropicalFromEquator(body, date, place);
  }
  const body = GRAHA_BODY[grahaId];
  if (!body) return null;
  return tropicalFromEquator(body, date, place);
}

function getHeliocentricTropicalLongitude(grahaId: string, date: Date): number | null {
  if (grahaId === "surya" || grahaId === "rahu" || grahaId === "ketu") return null;
  if (grahaId === "chandra") {
    return normalizeDegrees(Ecliptic(HelioVector(Body.Moon, date)).elon);
  }
  const body = GRAHA_BODY[grahaId];
  if (!body) return null;
  return normalizeDegrees(Ecliptic(HelioVector(body, date)).elon);
}

/** Swiss Ephemeris–compatible sidereal longitude (Lahiri ICRC 1956) for a reference frame. */
export function getReferenceGrahaLongitude(
  grahaId: string,
  date = new Date(),
  frame: ReferenceFrame = "geocentric",
  place?: ChartPlace,
): number | null {
  if (grahaId === "bhoomi" || grahaId === "earth") {
    const surya = getReferenceGrahaLongitude("surya", date, frame, place);
    return surya == null ? null : normalizeDegrees(surya + 180);
  }

  const jd = dateToJulianDate(date);

  if (frame === "geocentric") {
    if (grahaId === "ketu") {
      return normalizeDegrees(getReferenceGrahaLongitude("rahu", date, frame, place)! + 180);
    }
    if (grahaId === "rahu") {
      return tropicalToSidereal(getRahuTropicalLongitude(jd), jd);
    }
    const tropical = getGeocentricTropicalLongitude(grahaId, date);
    return tropicalToSidereal(tropical, jd);
  }

  if (frame === "topocentric") {
    if (!place) return null;
    const tropical = getTopocentricTropicalLongitude(grahaId, date, place);
    return tropical == null ? null : tropicalToSidereal(tropical, jd);
  }

  const tropical = getHeliocentricTropicalLongitude(grahaId, date);
  return tropical == null ? null : tropicalToSidereal(tropical, jd);
}

export function getReferenceLongitudesByFrame(
  date: Date,
  place: ChartPlace,
): Record<ReferenceFrame, Record<string, number | null>> {
  const frames: ReferenceFrame[] = ["geocentric", "topocentric", "heliocentric"];
  const result = {} as Record<ReferenceFrame, Record<string, number | null>>;
  for (const frame of frames) {
    result[frame] = {};
    for (const graha of grahas) {
      result[frame][graha.id] = getReferenceGrahaLongitude(graha.id, date, frame, place);
    }
  }
  return result;
}

export function getReferenceGrahaPositions(
  date = new Date(),
  place?: ChartPlace,
): GrahaPosition[] {
  return grahas.map((graha) =>
    grahaPositionFromLongitude(
      graha,
      getReferenceGrahaLongitude(graha.id, date, "geocentric", place) ?? 0,
    ),
  );
}

