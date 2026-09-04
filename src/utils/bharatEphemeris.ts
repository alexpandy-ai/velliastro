import { grahas } from "../data/grahas";
import { estimateTimezoneOffsetMinutes } from "./chartDateTime";
import {
  grahaPositionFromLongitude,
  type ChartPlace,
  type GrahaPosition,
} from "./grahaPositions";
import { normalizeDegrees } from "./positions";

const BHARAT_API_PROXY_PATH = "/api/bharat/chart";
const BHARAT_API_DIRECT_URL = "https://bharatephemeris.com/api/v1/bharat/chart";
/** CORS-enabled Cloudflare Worker proxy (Harvis static sites cannot run POST). */
const BHARAT_API_CORS_PROXY_URL =
  "https://velliastro-ephemeris.lead-fire.workers.dev/api/bharat/chart";
const BHARAT_API_NETLIFY_PROXY_URL =
  "https://velliastro-ephemeris.netlify.app/api/bharat/chart";

/** Ordered proxy URLs to try from the browser. */
export function getBharatApiUrls(): string[] {
  if (typeof window === "undefined") {
    return [BHARAT_API_DIRECT_URL];
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return [BHARAT_API_PROXY_PATH];
  }

  return [BHARAT_API_CORS_PROXY_URL, BHARAT_API_NETLIFY_PROXY_URL, BHARAT_API_PROXY_PATH];
}

/** @deprecated Use getBharatApiUrls() — returns first candidate only. */
export function getBharatApiUrl(): string {
  return getBharatApiUrls()[0];
}

const GRAHA_TO_BHARAT_KEY: Record<string, string> = {
  surya: "sun",
  chandra: "moon",
  sevvai: "mangala",
  budhan: "budha",
  guru: "guru",
  sukran: "shukra",
  sani: "shani",
  rahu: "rahu",
  ketu: "ketu",
};

type BharatChartResponse = {
  ok: boolean;
  nirayana?: Record<string, number>;
  error?: { code?: string; message?: string };
};

function getTimezoneId(place: ChartPlace): string {
  if (
    place.longitude >= 68 &&
    place.longitude <= 97 &&
    place.latitude >= 6 &&
    place.latitude <= 37.5
  ) {
    return "Asia/Kolkata";
  }

  if (
    place.longitude >= 80 &&
    place.longitude <= 89 &&
    place.latitude >= 26 &&
    place.latitude <= 31
  ) {
    return "Asia/Kathmandu";
  }

  const offsetMinutes = estimateTimezoneOffsetMinutes(
    place.longitude,
    place.latitude,
  );
  if (offsetMinutes === 0) return "UTC";

  const offsetHours = offsetMinutes / 60;
  if (offsetHours === Math.round(offsetHours)) {
    const sign = offsetHours > 0 ? "-" : "+";
    return `Etc/GMT${sign}${Math.abs(Math.round(offsetHours))}`;
  }

  return "UTC";
}

function toBirthTime(timeValue: string): string {
  const trimmed = timeValue.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

/** Fetch Lahiri nirayana longitudes from Bharat Ephemeris (no API key). */
export async function fetchBharatNirayanaLongitudes(
  dateValue: string,
  timeValue: string,
  place: ChartPlace,
): Promise<Record<string, number> | null> {
  const requestBody = JSON.stringify({
    birthDate: dateValue,
    birthTime: toBirthTime(timeValue),
    birthPlace: {
      lat: place.latitude,
      lon: place.longitude,
      tz: getTimezoneId(place),
    },
    ayanamsa: "lahiri",
  });

  for (const apiUrl of getBharatApiUrls()) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: requestBody,
      });

      if (!response.ok) continue;

      const data = (await response.json()) as BharatChartResponse;
      if (!data.ok || !data.nirayana) continue;

      const longitudes: Record<string, number> = {};
      for (const [grahaId, bharatKey] of Object.entries(GRAHA_TO_BHARAT_KEY)) {
        const value = data.nirayana[bharatKey];
        if (typeof value === "number" && Number.isFinite(value)) {
          longitudes[grahaId] = normalizeDegrees(value);
        }
      }

      if (typeof longitudes.surya === "number") {
        longitudes.bhoomi = normalizeDegrees(longitudes.surya + 180);
      }

      return longitudes;
    } catch {
      continue;
    }
  }

  return null;
}

export function grahaPositionsFromLongitudes(
  longitudes: Record<string, number>,
): GrahaPosition[] {
  return grahas.map((graha) => {
    const longitude = longitudes[graha.id];
    if (typeof longitude !== "number" || !Number.isFinite(longitude)) {
      return grahaPositionFromLongitude(graha, 0);
    }
    return grahaPositionFromLongitude(graha, longitude);
  });
}

export async function fetchBharatGrahaPositions(
  dateValue: string,
  timeValue: string,
  place: ChartPlace,
): Promise<GrahaPosition[] | null> {
  const longitudes = await fetchBharatNirayanaLongitudes(
    dateValue,
    timeValue,
    place,
  );
  if (!longitudes) return null;
  return grahaPositionsFromLongitudes(longitudes);
}
