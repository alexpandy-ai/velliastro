import type { ChartPlace } from "./grahaPositions";

export type PlaceLocalParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

/** Estimate civil timezone offset from geographic coordinates (minutes east of UTC). */
export function estimateTimezoneOffsetMinutes(
  longitude: number,
  latitude: number,
): number {
  // India Standard Time (UTC+5:30)
  if (
    longitude >= 68 &&
    longitude <= 97 &&
    latitude >= 6 &&
    latitude <= 37.5
  ) {
    return 5 * 60 + 30;
  }

  // Nepal Standard Time (UTC+5:45)
  if (
    longitude >= 80 &&
    longitude <= 89 &&
    latitude >= 26 &&
    latitude <= 31
  ) {
    return 5 * 60 + 45;
  }

  // South Africa Standard Time (UTC+2)
  if (
    longitude >= 16 &&
    longitude <= 33 &&
    latitude >= -35 &&
    latitude <= -22
  ) {
    return 2 * 60;
  }

  // Standard-time approximation: 15° longitude ≈ 1 hour
  return Math.round(longitude / 15) * 60;
}

/** Civil date/time components at the chart place for a UTC instant. */
export function placeLocalParts(
  utcDate: Date,
  place: ChartPlace,
): PlaceLocalParts {
  const offsetMinutes = estimateTimezoneOffsetMinutes(
    place.longitude,
    place.latitude,
  );
  const placeMs = utcDate.getTime() + offsetMinutes * 60 * 1000;
  const shifted = new Date(placeMs);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

export function formatDateInputForPlace(utcDate: Date, place: ChartPlace): string {
  const parts = placeLocalParts(utcDate, place);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatTimeInputForPlace(utcDate: Date, place: ChartPlace): string {
  const parts = placeLocalParts(utcDate, place);
  return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}`;
}

export function formatDateTimeLabelForPlace(
  utcDate: Date,
  place: ChartPlace,
): string {
  const parts = placeLocalParts(utcDate, place);
  const localDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes),
  );
  const datePart = localDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const timePart = localDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
  return `${datePart}, ${timePart}`;
}
/** Local date/time at the chart place → UTC instant for ephemeris. */
export function chartDateTimeFromLocalInputs(
  dateValue: string,
  timeValue: string,
  place: ChartPlace,
): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const offsetMinutes = estimateTimezoneOffsetMinutes(
    place.longitude,
    place.latitude,
  );
  const utcMs =
    Date.UTC(year, month - 1, day, hours, minutes, 0) -
    offsetMinutes * 60 * 1000;
  return new Date(utcMs);
}

export function formatTimezoneOffsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return mins === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

export function formatUtcInstantLabel(utcDate: Date): string {
  return utcDate.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export function formatInputDateLabel(dateValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const local = new Date(Date.UTC(year, month - 1, day));
  return local.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatInputTimeLabel(timeValue: string): string {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const local = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return local.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

export function formatLocalInputDateTimeLabel(
  dateValue: string,
  timeValue: string,
): string {
  return `${formatInputDateLabel(dateValue)}, ${formatInputTimeLabel(timeValue)}`;
}

/** Trim verbose geocoded names to city/district, state, and country. */
export function formatPlaceLabel(placeName: string): string {
  const trimmed = placeName?.trim();
  if (!trimmed) return "—";

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d{5,7}$/.test(part))
    .filter((part) => !/^ward\s+\d+/i.test(part))
    .map((part) =>
      part
        .replace(/^Greater\s+/i, "")
        .replace(/\s+District$/i, "")
        .trim(),
    )
    .filter(Boolean);

  if (parts.length === 0) return trimmed;
  if (parts.length <= 3) return parts.join(", ");

  const country = parts[parts.length - 1];
  const state = parts[parts.length - 2];
  const city = parts[parts.length - 3];
  return [city, state, country].join(", ");
}

/** Local date/time in the browser timezone → Date instant (for “now” at device). */
export function chartDateTimeFromBrowserInputs(
  dateValue: string,
  timeValue: string,
): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
}
