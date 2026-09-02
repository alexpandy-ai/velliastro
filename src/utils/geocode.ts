export type PlaceCoords = {
  placeName: string;
  latitude: number;
  longitude: number;
};

export const DEFAULT_PLACE: PlaceCoords = {
  placeName: "Chennai, Tamil Nadu, India",
  latitude: 13.0827,
  longitude: 80.2707,
};

export const PLACE_PRESETS: PlaceCoords[] = [
  DEFAULT_PLACE,
  { placeName: "Coimbatore, Tamil Nadu, India", latitude: 11.0168, longitude: 76.9558 },
  { placeName: "Madurai, Tamil Nadu, India", latitude: 9.9252, longitude: 78.1198 },
  { placeName: "Trichy, Tamil Nadu, India", latitude: 10.7905, longitude: 78.7047 },
  { placeName: "Salem, Tamil Nadu, India", latitude: 11.6643, longitude: 78.146 },
  { placeName: "Bengaluru, Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
  { placeName: "Mumbai, Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { placeName: "Delhi, India", latitude: 28.7041, longitude: 77.1025 },
];

export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${latDir}, ${Math.abs(longitude).toFixed(4)}° ${lonDir}`;
}

export function toCoordinateInputValues(
  latitude: number,
  longitude: number,
): { latitude: string; longitude: string } {
  return {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
  };
}

function parseCoordinatePart(
  value: string,
  kind: "lat" | "lon",
): number | null {
  const trimmed = value.trim().replace(/°/g, "");
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([NnSsEeWw])?$/);
  if (!match) return null;

  let num = parseFloat(match[1]);
  const dir = match[2]?.toUpperCase();
  if (dir === "S" || dir === "W") num = -Math.abs(num);
  else if (dir === "N" || dir === "E") num = Math.abs(num);

  if (!Number.isFinite(num)) return null;
  if (kind === "lat" && Math.abs(num) > 90) return null;
  if (kind === "lon" && Math.abs(num) > 180) return null;
  return num;
}

export function parseCoordinateInputs(
  latitudeValue: string,
  longitudeValue: string,
): { latitude: number; longitude: number } | null {
  const latitude = parseCoordinatePart(latitudeValue, "lat");
  const longitude = parseCoordinatePart(longitudeValue, "lon");
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

/** Parse formatted coordinate text like `13.0827° N, 80.2707° E`. */
export function parseCoordinates(input: string): {
  latitude: number;
  longitude: number;
} | null {
  const parts = input.split(/[,，]/).map((part) => part.trim());
  if (parts.length !== 2) return null;
  return parseCoordinateInputs(parts[0], parts[1]);
}

export function isValidCoordinateInputs(
  latitudeValue: string,
  longitudeValue: string,
): boolean {
  return parseCoordinateInputs(latitudeValue, longitudeValue) !== null;
}

function matchPreset(query: string): PlaceCoords | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  return (
    PLACE_PRESETS.find((preset) => {
      const city = preset.placeName.split(",")[0].trim().toLowerCase();
      return (
        preset.placeName.toLowerCase().includes(normalized) ||
        normalized.includes(city) ||
        city.includes(normalized)
      );
    }) ?? null
  );
}

export async function geocodePlace(query: string): Promise<PlaceCoords | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const preset = matchPreset(trimmed);
  if (preset) return { ...preset, placeName: trimmed };

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", trimmed);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) return matchPreset(trimmed);

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) return matchPreset(trimmed);

    return {
      placeName: trimmed,
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
    };
  } catch {
    return matchPreset(trimmed);
  }
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) return formatCoordinates(latitude, longitude);

    const data = (await response.json()) as { display_name?: string };
    return data.display_name || formatCoordinates(latitude, longitude);
  } catch {
    return formatCoordinates(latitude, longitude);
  }
}

export function getBrowserGeolocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60_000,
    });
  });
}

export async function resolveCurrentLocationPlace(): Promise<PlaceCoords> {
  const position = await getBrowserGeolocation();
  const { latitude, longitude } = position.coords;
  const placeName = await reverseGeocodeCoordinates(latitude, longitude);
  return { placeName, latitude, longitude };
}
