import type { Planet } from "../data/planets";

export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type PlanetPosition = {
  planet: Planet;
  longitude: number;
  sign: ZodiacSign;
  degree: number;
  minute: number;
  formatted: string;
};

const SIGNS: ZodiacSign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const TAMIL_RASI: Record<ZodiacSign, string> = {
  Aries: "மேஷம்",
  Taurus: "ரிஷபம்",
  Gemini: "மிதுனம்",
  Cancer: "கடகம்",
  Leo: "சிம்மம்",
  Virgo: "கன்னி",
  Libra: "துலாம்",
  Scorpio: "விருச்சிகம்",
  Sagittarius: "தனுசு",
  Capricorn: "மகரம்",
  Aquarius: "கும்பம்",
  Pisces: "மீனம்",
};

export function getTamilRasi(sign: ZodiacSign): string {
  return TAMIL_RASI[sign];
}

const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);

/** Mean orbital period in days and longitude at J2000 (approximate). */
const ORBIT: Record<string, { period: number; longitude0: number }> = {
  mercury: { period: 87.969, longitude0: 252.25 },
  venus: { period: 224.701, longitude0: 181.98 },
  earth: { period: 365.256, longitude0: 100.46 },
  mars: { period: 686.98, longitude0: 355.43 },
  jupiter: { period: 4332.59, longitude0: 34.35 },
  saturn: { period: 10759.22, longitude0: 50.08 },
  uranus: { period: 30688.5, longitude0: 314.05 },
  neptune: { period: 60182.0, longitude0: 304.35 },
};

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function getPlanetLongitude(planetId: string, date = new Date()): number {
  const orbit = ORBIT[planetId];
  if (!orbit) return 0;

  const days = (date.getTime() - J2000) / 86_400_000;
  return normalizeDegrees(
    orbit.longitude0 + (360 / orbit.period) * days,
  );
}

export function longitudeToZodiac(longitude: number): {
  sign: ZodiacSign;
  degree: number;
  minute: number;
  formatted: string;
} {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized % 30;
  const degree = Math.floor(degreeInSign);
  const minute = Math.floor((degreeInSign - degree) * 60);

  return {
    sign: SIGNS[signIndex],
    degree,
    minute,
    formatted: `${degree}°${minute.toString().padStart(2, "0")}'`,
  };
}

export function getPlanetPositions(
  planetList: Planet[],
  date = new Date(),
): PlanetPosition[] {
  return planetList.map((planet) => {
    const longitude = getPlanetLongitude(planet.id, date);
    const zodiac = longitudeToZodiac(longitude);

    return {
      planet,
      longitude,
      ...zodiac,
    };
  });
}

export function polarToCartesian(
  angleDeg: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}
