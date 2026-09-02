import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PLACE,
  geocodePlace,
  parseCoordinateInputs,
  resolveCurrentLocationPlace,
  toCoordinateInputValues,
  type PlaceCoords,
} from "../utils/geocode";

export function usePlaceGeocode(initialPlace: PlaceCoords = DEFAULT_PLACE) {
  const [placeInput, setPlaceInput] = useState(initialPlace.placeName);
  const [place, setPlace] = useState<PlaceCoords>(initialPlace);
  const [latitudeInput, setLatitudeInput] = useState(() =>
    toCoordinateInputValues(initialPlace.latitude, initialPlace.longitude).latitude,
  );
  const [longitudeInput, setLongitudeInput] = useState(() =>
    toCoordinateInputValues(initialPlace.latitude, initialPlace.longitude).longitude,
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncCoordinateInputs = useCallback((coords: PlaceCoords) => {
    const values = toCoordinateInputValues(coords.latitude, coords.longitude);
    setLatitudeInput(values.latitude);
    setLongitudeInput(values.longitude);
  }, []);

  const lookupPlaceCoordinates = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsGeocoding(true);
    try {
      const resolved = await geocodePlace(trimmed);
      if (resolved) {
        syncCoordinateInputs(resolved);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, [syncCoordinateInputs]);

  const scheduleGeocode = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void lookupPlaceCoordinates(query);
      }, 500);
    },
    [lookupPlaceCoordinates],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePlaceInputChange = (value: string) => {
    setPlaceInput(value);
    scheduleGeocode(value);
  };

  const handlePlaceBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void lookupPlaceCoordinates(placeInput);
  };

  const handlePlaceSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    return lookupPlaceCoordinates(placeInput);
  };

  const commitCoordinateInputs = useCallback(() => {
    const parsed = parseCoordinateInputs(latitudeInput, longitudeInput);
    if (!parsed) {
      syncCoordinateInputs(place);
      return;
    }

    const nextPlace = {
      ...place,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
    setPlace(nextPlace);
    syncCoordinateInputs(nextPlace);
  }, [latitudeInput, longitudeInput, place, syncCoordinateInputs]);

  const applyPlaceFromForm = useCallback(async (): Promise<PlaceCoords> => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    let latitude = place.latitude;
    let longitude = place.longitude;
    const trimmed = placeInput.trim();

    if (trimmed) {
      setIsGeocoding(true);
      try {
        const resolved = await geocodePlace(trimmed);
        if (resolved) {
          latitude = resolved.latitude;
          longitude = resolved.longitude;
        }
      } finally {
        setIsGeocoding(false);
      }
    }

    const manual = parseCoordinateInputs(latitudeInput, longitudeInput);
    if (manual) {
      latitude = manual.latitude;
      longitude = manual.longitude;
    }

    const nextPlace = {
      placeName: trimmed || place.placeName,
      latitude,
      longitude,
    };
    setPlace(nextPlace);
    syncCoordinateInputs(nextPlace);
    return nextPlace;
  }, [latitudeInput, longitudeInput, place, placeInput, syncCoordinateInputs]);

  const handleLatitudeInputChange = (value: string) => {
    setLatitudeInput(value.slice(0, 12));
  };

  const handleLongitudeInputChange = (value: string) => {
    setLongitudeInput(value.slice(0, 12));
  };

  const handleCoordinateBlur = () => {
    commitCoordinateInputs();
  };

  const applyCurrentLocation = useCallback(async (): Promise<PlaceCoords | null> => {
    setIsLocating(true);
    try {
      const resolved = await resolveCurrentLocationPlace();
      setPlace(resolved);
      setPlaceInput(resolved.placeName);
      syncCoordinateInputs(resolved);
      return resolved;
    } catch {
      return null;
    } finally {
      setIsLocating(false);
    }
  }, [syncCoordinateInputs]);

  return {
    placeInput,
    place,
    latitudeInput,
    longitudeInput,
    isGeocoding,
    isLocating,
    setPlaceInput,
    handlePlaceInputChange,
    handlePlaceBlur,
    handlePlaceSearch,
    applyPlaceFromForm,
    applyCurrentLocation,
    handleLatitudeInputChange,
    handleLongitudeInputChange,
    handleCoordinateBlur,
    commitCoordinateInputs,
  };
}
