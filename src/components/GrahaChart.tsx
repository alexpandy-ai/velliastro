import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeSectorWedge,
  SECTOR_LABEL_LINE_HEIGHT,
  finalizeGrahaPositions,
  getGrahaPositions,
  formatBoundaryDegreeLabel,
  formatSectorStartTime,
  formatLagnamDegree,
  getBoundaryLabelRadiusOffset,
  getLagnamAngle,
  getSectorIndex,
  labelRadialInwardRotation,
  labelRadialRotation,
  LAGNAM_LABEL_RADIUS,
  layoutPlanetLabelAtLongitude,
  polarToChart,
  SECTOR_COUNT,
  SECTOR_DEGREES,
  updateGrahaPositionField,
  type GrahaPosition,
  type ChartLang,
} from "../utils/grahaPositions";
import {
  chartDateTimeFromLocalInputs,
  estimateTimezoneOffsetMinutes,
  formatDateInputForPlace,
  formatLocalInputDateTimeLabel,
  formatPlaceLabel,
  formatTimeInputForPlace,
  formatTimezoneOffsetLabel,
  formatUtcInstantLabel,
} from "../utils/chartDateTime";
import { DEFAULT_PLACE, formatCoordinates, type PlaceCoords } from "../utils/geocode";
import { getTamilRasi, type ZodiacSign } from "../utils/positions";
import { formatSunriseLabel } from "../utils/sunrise";
import { usePlaceGeocode } from "../hooks/usePlaceGeocode";
import {
  getAllSectorFillColors,
  getChartAccentColors,
  getClockMinutesFromDate,
  getSectorTextColors,
} from "../utils/timeOfDayColors";

const SEGMENTS = SECTOR_COUNT;
const DEGREES_PER_SEGMENT = SECTOR_DEGREES;

function toInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function parseDateTime(dateValue: string, timeValue: string): Date {
  const [y, m, d] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(y, m - 1, d, hours, minutes, 0);
}

export function GrahaChart() {
  const size = 560;
  const center = size / 2;
  const outerRadius = 235;
  const innerRadius = 0;

  const now = new Date();
  const [inputDate, setInputDate] = useState(() => toInputValue(now));
  const [inputTime, setInputTime] = useState(() => toTimeInputValue(now));
  const [selectedDate, setSelectedDate] = useState(() => now);
  const [chartPositions, setChartPositions] = useState<GrahaPosition[]>(() =>
    getGrahaPositions(now, { latitude: DEFAULT_PLACE.latitude, longitude: DEFAULT_PLACE.longitude }),
  );
  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [draftPositions, setDraftPositions] = useState<GrahaPosition[]>([]);
  const inputDateRef = useRef(inputDate);
  const inputTimeRef = useRef(inputTime);
  inputDateRef.current = inputDate;
  inputTimeRef.current = inputTime;
  const placeUserCommittedRef = useRef(false);
  const isEditingPositionsRef = useRef(false);
  isEditingPositionsRef.current = isEditingPositions;

  const recalculateChart = useCallback((nextPlace: PlaceCoords) => {
    placeUserCommittedRef.current = true;
    if (isEditingPositionsRef.current) return;
    const nextDate = chartDateTimeFromLocalInputs(
      inputDateRef.current,
      inputTimeRef.current,
      nextPlace,
    );
    setSelectedDate(nextDate);
    setChartPositions(getGrahaPositions(nextDate, nextPlace));
    setIsEditingPositions(false);
    setDraftPositions([]);
  }, []);

  const {
    placeInput,
    place,
    latitudeInput,
    longitudeInput,
    placeSuggestions,
    activeSuggestionIndex,
    isGeocoding,
    isSearchingPlaces,
    isLocating,
    handlePlaceInputChange,
    handlePlaceBlur,
    handlePlaceSearch,
    handlePlaceKeyDown,
    selectPlaceSuggestion,
    applyPlaceFromForm,
    applyCurrentLocation,
    handleLatitudeInputChange,
    handleLongitudeInputChange,
    handleCoordinateBlur,
    commitCoordinateInputs,
  } = usePlaceGeocode(undefined, recalculateChart);

  const chartPlace = {
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const [lang, setLang] = useState<ChartLang>(() => {
    if (typeof window === "undefined") return "ta";
    return localStorage.getItem("velliastro-lang") === "en" ? "en" : "ta";
  });
  useEffect(() => {
    localStorage.setItem("velliastro-lang", lang);
    localStorage.setItem("velliastro-ephemeris", "builtin");
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
    document.title =
      lang === "ta" ? "கிரக நிலைகள் · Planet Positions" : "Planet Positions";
  }, [lang]);

  const tablePositions = isEditingPositions ? draftPositions : chartPositions;

  const lagnamAngle = getLagnamAngle(selectedDate, chartPlace);
  const lagnamDegree = formatLagnamDegree(lagnamAngle);
  const lagnamOuter = polarToChart(lagnamAngle, outerRadius, center);
  const lagnamLabelPos = polarToChart(lagnamAngle, LAGNAM_LABEL_RADIUS, center);
  const lagnamLabelRotation = labelRadialRotation(lagnamAngle);
  const lagnamTextColors = getSectorTextColors(getSectorIndex(lagnamAngle));

  const boundaries = Array.from(
    { length: SEGMENTS },
    (_, i) => i * DEGREES_PER_SEGMENT,
  );

  const timezoneOffsetMinutes = estimateTimezoneOffsetMinutes(
    chartPlace.longitude,
    chartPlace.latitude,
  );
  const calcInputsSummary = {
    placeName: formatPlaceLabel(placeInput.trim() || place.placeName),
    dateTimeLabel: formatLocalInputDateTimeLabel(inputDate, inputTime),
    coordinatesLabel: formatCoordinates(chartPlace.latitude, chartPlace.longitude),
    timezoneLabel: formatTimezoneOffsetLabel(timezoneOffsetMinutes),
    utcInstantLabel: formatUtcInstantLabel(selectedDate),
  };
  const sectorFillColors = getAllSectorFillColors();
  const chartAccents = getChartAccentColors(getClockMinutesFromDate(selectedDate));

  const zeroPoint = polarToChart(0, outerRadius, center);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyPlaceFromForm();
  };

  const startPositionEdit = () => {
    setDraftPositions(chartPositions.map((position) => ({ ...position })));
    setIsEditingPositions(true);
  };

  const finishPositionEdit = () => {
    setChartPositions(finalizeGrahaPositions(draftPositions));
    setIsEditingPositions(false);
  };

  const updateDraftPosition = (
    grahaId: string,
    field: "longitude" | "formatted",
    value: string,
  ) => {
    setDraftPositions((current) =>
      current.map((position) =>
        position.graha.id === grahaId
          ? updateGrahaPositionField(position, field, value)
          : position,
      ),
    );
  };

  const refreshPositions = () => {
    setChartPositions(getGrahaPositions(selectedDate, chartPlace));
    setIsEditingPositions(false);
    setDraftPositions([]);
  };

  const showNowAtCurrentLocation = useCallback(async () => {
    const nextPlace = await applyCurrentLocation();
    if (!nextPlace || placeUserCommittedRef.current) return;

    const chartNow = new Date();
    const dateValue = formatDateInputForPlace(chartNow, nextPlace);
    const timeValue = formatTimeInputForPlace(chartNow, nextPlace);
    const chartDate = chartDateTimeFromLocalInputs(dateValue, timeValue, nextPlace);
    setInputDate(dateValue);
    setInputTime(timeValue);
    setSelectedDate(chartDate);
    setChartPositions(getGrahaPositions(chartDate, nextPlace));
    setIsEditingPositions(false);
    setDraftPositions([]);
  }, [applyCurrentLocation]);

  const locationRequestedRef = useRef(false);
  const autoRecalcReadyRef = useRef(false);
  useEffect(() => {
    if (locationRequestedRef.current) return;
    locationRequestedRef.current = true;
    void showNowAtCurrentLocation().finally(() => {
      autoRecalcReadyRef.current = true;
    });
  }, [showNowAtCurrentLocation]);

  useEffect(() => {
    if (!autoRecalcReadyRef.current || isEditingPositions) return;
    const nextDate = chartDateTimeFromLocalInputs(inputDate, inputTime, chartPlace);
    setSelectedDate(nextDate);
    setChartPositions(getGrahaPositions(nextDate, chartPlace));
  }, [inputDate, inputTime, chartPlace.latitude, chartPlace.longitude, isEditingPositions]);

  return (
    <div className={`graha-chart graha-chart--bright lang-${lang}`}>
      <header className="graha-chart__header">
        <div className="graha-chart__header-top-bar">
          <div className="graha-chart__header-brand">
            <h1>
              <span className="graha-chart__bilingual">
                <span>கிரக நிலைகள்</span>
                <span className="graha-chart__bilingual-en">Planet Positions</span>
              </span>
            </h1>
          </div>
          <nav className="graha-chart__lang-tabs" role="tablist" aria-label="Language">
            <button
              type="button"
              className={`graha-chart__lang-tab${lang === "ta" ? " is-active" : ""}`}
              role="tab"
              aria-selected={lang === "ta"}
              onClick={() => setLang("ta")}
            >
              தமிழ்
            </button>
            <button
              type="button"
              className={`graha-chart__lang-tab${lang === "en" ? " is-active" : ""}`}
              role="tab"
              aria-selected={lang === "en"}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </nav>
        </div>
        <form className="graha-chart__date-form" onSubmit={handleSubmit}>
          <div className="graha-chart__form-card">
            <div className="graha-chart__form-group graha-chart__form-group--datetime">
              <div className="graha-chart__form-field">
                <label htmlFor="dateInput">
                  <span className="graha-chart__bilingual">
                    <span>தேதி</span>
                    <span className="graha-chart__bilingual-en">Select date</span>
                  </span>
                </label>
                <input
                  type="date"
                  id="dateInput"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  required
                />
              </div>
              <div className="graha-chart__form-field">
                <label htmlFor="timeInput">
                  <span className="graha-chart__bilingual">
                    <span>நேரம்</span>
                    <span className="graha-chart__bilingual-en">Time</span>
                  </span>
                </label>
                <input
                  type="time"
                  id="timeInput"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="graha-chart__form-group graha-chart__form-group--place">
              <label htmlFor="placeInput" className="graha-chart__location-label">
                <span className="graha-chart__bilingual">
                  <span>இடம்</span>
                  <span className="graha-chart__bilingual-en">Place</span>
                </span>
              </label>
              <div className="graha-chart__place-row">
                <div className="graha-chart__place-autocomplete">
                  <input
                    type="text"
                    id="placeInput"
                    value={placeInput}
                    onChange={(e) => handlePlaceInputChange(e.target.value)}
                    onBlur={handlePlaceBlur}
                    onKeyDown={handlePlaceKeyDown}
                    placeholder="Chennai"
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={placeSuggestions.length > 0}
                    aria-controls="placeSuggestions"
                    aria-autocomplete="list"
                  />
                  {placeSuggestions.length > 0 && (
                    <ul
                      id="placeSuggestions"
                      className="graha-chart__place-suggestions"
                      role="listbox"
                    >
                      {placeSuggestions.map((suggestion, index) => (
                        <li key={suggestion.id} role="option" aria-selected={index === activeSuggestionIndex}>
                          <button
                            type="button"
                            className={`graha-chart__place-suggestion${index === activeSuggestionIndex ? " is-active" : ""}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectPlaceSuggestion(suggestion)}
                          >
                            {suggestion.placeName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isSearchingPlaces && placeSuggestions.length === 0 && placeInput.trim().length >= 2 && (
                    <div className="graha-chart__place-suggestions graha-chart__place-suggestions--loading" aria-live="polite">
                      <span className="graha-chart__bilingual">
                        <span>தேடுகிறது…</span>
                        <span className="graha-chart__bilingual-en">Searching…</span>
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="graha-chart__place-location-btn"
                  onClick={() => {
                    placeUserCommittedRef.current = false;
                    void showNowAtCurrentLocation();
                  }}
                  disabled={isLocating}
                  title="Use current location and time"
                  aria-label="Use current location and time"
                >
                  {isLocating ? "…" : "⌖"}
                </button>
                <button
                  type="button"
                  className="graha-chart__place-search-btn"
                  onClick={() => void handlePlaceSearch()}
                  title="Search place"
                  aria-label="Search place"
                >
                  ⌕
                </button>
              </div>
            </div>
            <div className="graha-chart__form-group graha-chart__form-group--coords">
              <div className="graha-chart__coords-sunrise-row">
                <div className="graha-chart__coords-display">
                  <span className="graha-chart__bilingual">
                    <span>ஆயத்தொலைவு</span>
                    <span className="graha-chart__bilingual-en">Coordinates</span>
                  </span>
                  <span className="graha-chart__coords-fields">
                    <input
                      type="text"
                      className={`graha-chart__coords-input${isGeocoding ? " is-loading" : ""}`}
                      value={latitudeInput}
                      onChange={(e) => handleLatitudeInputChange(e.target.value)}
                      onBlur={handleCoordinateBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCoordinateInputs();
                        }
                      }}
                      inputMode="decimal"
                      maxLength={12}
                      aria-label="Latitude"
                      placeholder="Lat"
                    />
                    <span className="graha-chart__coords-sep">,</span>
                    <input
                      type="text"
                      className={`graha-chart__coords-input${isGeocoding ? " is-loading" : ""}`}
                      value={longitudeInput}
                      onChange={(e) => handleLongitudeInputChange(e.target.value)}
                      onBlur={handleCoordinateBlur}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitCoordinateInputs();
                        }
                      }}
                      inputMode="decimal"
                      maxLength={12}
                      aria-label="Longitude"
                      placeholder="Lon"
                    />
                  </span>
                </div>
                <span className="graha-chart__sunrise-display" aria-live="polite">
                  <span className="graha-chart__bilingual">
                    <span>சூரிய உதயம்</span>
                    <span className="graha-chart__bilingual-en">Sunrise</span>
                  </span>
                  <span className="graha-chart__sunrise-value">
                    {formatSunriseLabel(
                      chartDateTimeFromLocalInputs(inputDate, "06:00", chartPlace),
                      chartPlace,
                    )}
                  </span>
                </span>
              </div>
            </div>
            <button type="submit" className="graha-chart__submit-btn">
              <span className="graha-chart__bilingual">
                <span>சமர்ப்பி</span>
                <span className="graha-chart__bilingual-en">Submit</span>
              </span>
            </button>
          </div>
        </form>
      </header>

      <div className="graha-chart__layout">
        <div
          className="graha-chart__panel"
          style={{ background: chartAccents.panelGradient }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="graha-chart__svg"
            role="img"
            aria-label="Graha chart with Tamil planet names"
          >
            <circle
              cx={center}
              cy={center}
              r={outerRadius}
              className="graha-chart__ring"
              style={{ stroke: chartAccents.ring }}
            />

            <line
              x1={center}
              y1={center}
              x2={zeroPoint.x}
              y2={zeroPoint.y}
              className="graha-chart__zero-axis"
              style={{ stroke: chartAccents.ring }}
            />

            {boundaries.map((angle, index) => {
              const outer = polarToChart(angle, outerRadius, center);
              const labelOffset = getBoundaryLabelRadiusOffset(index);
              const labelPos = polarToChart(
                angle,
                outerRadius + labelOffset,
                center,
              );
              const labelRotation = labelRadialInwardRotation(angle);

              return (
                <g key={angle}>
                  <path
                    d={describeSectorWedge(
                      center,
                      innerRadius,
                      outerRadius,
                      angle,
                      angle + DEGREES_PER_SEGMENT,
                    )}
                    className="graha-chart__sector"
                    fill={
                      index % 2 === 0
                        ? sectorFillColors[index].fillAlt
                        : sectorFillColors[index].fill
                    }
                  />
                  <line
                    x1={center}
                    y1={center}
                    x2={outer.x}
                    y2={outer.y}
                    className="graha-chart__spoke"
                    style={{ stroke: chartAccents.spoke }}
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    className="graha-chart__boundary-label"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
                  >
                    <tspan x={labelPos.x} dy="-0.55em">
                      {formatBoundaryDegreeLabel(angle)}
                    </tspan>
                    <tspan x={labelPos.x} dy="1.1em">
                      {formatSectorStartTime(index)}
                    </tspan>
                  </text>
                </g>
              );
            })}

            {[...chartPositions]
              .sort((a, b) => a.longitude - b.longitude)
              .map((position) => {
                const layout = layoutPlanetLabelAtLongitude(position, center);
                const textColors = getSectorTextColors(layout.sectorIndex);
                const rotation = labelRadialRotation(layout.labelAngle);
                const lineHeight = layout.fontSize * SECTOR_LABEL_LINE_HEIGHT;
                const blockOffset =
                  layout.lines.length > 1
                    ? -((layout.lines.length - 1) * lineHeight) / 2
                    : 0;

                return (
                  <g key={position.graha.id}>
                    <g transform={`rotate(${rotation}, ${layout.x}, ${layout.y})`}>
                      <text
                        x={layout.x}
                        y={layout.y}
                        className="graha-chart__graha-label"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: layout.fontSize,
                          fill: textColors.fill,
                          stroke: textColors.stroke,
                        }}
                      >
                        {layout.lines.map((line, lineIndex) => (
                          <tspan
                            key={lineIndex}
                            x={layout.x}
                            dy={
                              lineIndex === 0
                                ? blockOffset
                                : lineHeight
                            }
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  </g>
                );
              })}

            <line
              x1={center}
              y1={center}
              x2={lagnamOuter.x}
              y2={lagnamOuter.y}
              className="graha-chart__lagnam-spoke"
            />
            <g
              transform={`rotate(${lagnamLabelRotation}, ${lagnamLabelPos.x}, ${lagnamLabelPos.y})`}
            >
              <text
                x={lagnamLabelPos.x}
                y={lagnamLabelPos.y}
                className="graha-chart__lagnam-label"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: lagnamTextColors.fill,
                  stroke: lagnamTextColors.stroke,
                }}
              >
                {`${lang === "ta" ? "லக்னம்" : "Lagnam"} (${lagnamDegree})`}
              </text>
            </g>

          </svg>
        </div>

        <aside className="graha-chart__table">
          <div className="graha-chart__table-header">
            <h2>
              <span className="graha-chart__bilingual">
                <span>கிரக நிலைகள்</span>
                <span className="graha-chart__bilingual-en">Planet Positions</span>
              </span>
            </h2>
            <div className="graha-chart__table-toolbar">
              <button
                type="button"
                className="graha-chart__table-refresh-btn"
                onClick={refreshPositions}
                title="Reset planet positions and degrees"
              >
                <span className="graha-chart__bilingual">
                  <span>புதுப்பி</span>
                  <span className="graha-chart__bilingual-en">Refresh</span>
                </span>
              </button>
              {!isEditingPositions ? (
                <button
                  type="button"
                  className="graha-chart__table-edit-btn"
                  onClick={startPositionEdit}
                >
                  <span className="graha-chart__bilingual">
                    <span>திருத்து</span>
                    <span className="graha-chart__bilingual-en">Edit</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="graha-chart__table-done-btn"
                  onClick={finishPositionEdit}
                >
                  <span className="graha-chart__bilingual">
                    <span>முடிந்தது</span>
                    <span className="graha-chart__bilingual-en">Done</span>
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="graha-chart__calc-inputs label-box">
            <div className="label-box__row">
              <span className="label-box__key">
                <span className="graha-chart__bilingual">
                  <span>இடம்</span>
                  <span className="graha-chart__bilingual-en">Place</span>
                </span>
              </span>
              <span className="label-box__value">{calcInputsSummary.placeName}</span>
            </div>
            <div className="label-box__row">
              <span className="label-box__key">
                <span className="graha-chart__bilingual">
                  <span>தேதி & நேரம்</span>
                  <span className="graha-chart__bilingual-en">Date & time</span>
                </span>
              </span>
              <span className="label-box__value">{calcInputsSummary.dateTimeLabel}</span>
            </div>
            <div className="label-box__row">
              <span className="label-box__key">
                <span className="graha-chart__bilingual">
                  <span>ஆள்கூறு</span>
                  <span className="graha-chart__bilingual-en">Coordinates</span>
                </span>
              </span>
              <span className="label-box__value">{calcInputsSummary.coordinatesLabel}</span>
            </div>
            <div className="label-box__row">
              <span className="label-box__key">
                <span className="graha-chart__bilingual">
                  <span>நேர மண்டலம்</span>
                  <span className="graha-chart__bilingual-en">Timezone</span>
                </span>
              </span>
              <span className="label-box__value">{calcInputsSummary.timezoneLabel}</span>
            </div>
            <div className="label-box__row">
              <span className="label-box__key">
                <span className="graha-chart__bilingual">
                  <span>UTC</span>
                  <span className="graha-chart__bilingual-en">UTC instant</span>
                </span>
              </span>
              <span className="label-box__value">{calcInputsSummary.utcInstantLabel}</span>
            </div>
          </div>
          <div className="graha-chart__table-data-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <span className="graha-chart__bilingual">
                      <span>கிரகம்</span>
                      <span className="graha-chart__bilingual-en">Planet</span>
                    </span>
                  </th>
                  <th>
                    <span className="graha-chart__bilingual">
                      <span>ராசி</span>
                      <span className="graha-chart__bilingual-en">Rasi</span>
                    </span>
                  </th>
                  <th>
                    <span className="graha-chart__bilingual">
                      <span>நிலை</span>
                      <span className="graha-chart__bilingual-en">Position</span>
                    </span>
                  </th>
                  <th>
                    <span className="graha-chart__bilingual">
                      <span>பாகை</span>
                      <span className="graha-chart__bilingual-en">Degree</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tablePositions.map(({ graha, longitude, formatted, sign }) => (
                  <tr key={graha.id}>
                    <td>
                      <span className="graha-chart__table-cell-planet">
                        <span
                          className="graha-chart__table-symbol"
                          style={{ color: graha.color }}
                          aria-hidden="true"
                        >
                          {graha.symbol}
                        </span>
                        <span className="graha-chart__table-name">
                          <span>{graha.nameTamil}</span>
                          <span className="graha-chart__table-name-en">{graha.nameEnglish}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="graha-chart__table-name">
                        <span>{getTamilRasi(sign as ZodiacSign)}</span>
                        <span className="graha-chart__table-name-en">{sign}</span>
                      </span>
                    </td>
                    <td>
                      {isEditingPositions ? (
                        <input
                          type="text"
                          className="graha-chart__table-input"
                          value={formatted}
                          onChange={(e) =>
                            updateDraftPosition(graha.id, "formatted", e.target.value)
                          }
                          aria-label={`${graha.nameEnglish} position`}
                        />
                      ) : (
                        formatted
                      )}
                    </td>
                    <td>
                      {isEditingPositions ? (
                        <input
                          type="text"
                          className="graha-chart__table-input"
                          value={longitude.toFixed(2)}
                          onChange={(e) =>
                            updateDraftPosition(graha.id, "longitude", e.target.value)
                          }
                          inputMode="decimal"
                          aria-label={`${graha.nameEnglish} degree`}
                        />
                      ) : (
                        `${longitude.toFixed(2)}°`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </div>
  );
}
