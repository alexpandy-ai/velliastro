import { useEffect, useMemo, useState } from "react";
import {
  describeInsetSectorWedge,
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
  groupPlanetsBySector,
  LAGNAM_LABEL_RADIUS,
  layoutSectorPlanetLabel,
  polarToChart,
  verifyGrahaPositions,
  SECTOR_COUNT,
  SECTOR_DEGREES,
  updateGrahaPositionField,
  type GrahaPosition,
  type ChartLang,
} from "../utils/grahaPositions";
import { getTamilRasi, type ZodiacSign } from "../utils/positions";
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

function formatDateTimeLabel(date: Date): string {
  const datePart = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
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
  const {
    placeInput,
    place,
    latitudeInput,
    longitudeInput,
    isGeocoding,
    handlePlaceInputChange,
    handlePlaceBlur,
    handlePlaceSearch,
    applyPlaceFromForm,
    handleLatitudeInputChange,
    handleLongitudeInputChange,
    handleCoordinateBlur,
  } = usePlaceGeocode();

  const chartPlace = {
    latitude: place.latitude,
    longitude: place.longitude,
  };
  const computedPositions = useMemo(
    () => getGrahaPositions(selectedDate, chartPlace),
    [selectedDate, chartPlace.latitude, chartPlace.longitude],
  );
  const [chartPositions, setChartPositions] =
    useState<GrahaPosition[]>(computedPositions);
  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [draftPositions, setDraftPositions] = useState<GrahaPosition[]>([]);
  const [lang, setLang] = useState<ChartLang>(() => {
    if (typeof window === "undefined") return "ta";
    return localStorage.getItem("velliastro-lang") === "en" ? "en" : "ta";
  });

  useEffect(() => {
    localStorage.setItem("velliastro-lang", lang);
    document.documentElement.lang = lang === "ta" ? "ta" : "en";
    document.title =
      lang === "ta" ? "கிரக நிலைகள் · Planet Positions" : "Planet Positions";
  }, [lang]);

  useEffect(() => {
    setChartPositions(computedPositions);
    setIsEditingPositions(false);
  }, [computedPositions]);

  const tablePositions = isEditingPositions ? draftPositions : chartPositions;
  const sectorPlanetGroups = groupPlanetsBySector(chartPositions);
  const positionConsistencyIssues = useMemo(
    () => verifyGrahaPositions(tablePositions),
    [tablePositions],
  );

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

  const dateLabel = formatDateTimeLabel(selectedDate);
  const zeroLeftLabel = lang === "ta" ? "0° இடது புறம்" : "0° on left";
  const sectorFillColors = getAllSectorFillColors();
  const chartAccents = getChartAccentColors(getClockMinutesFromDate(selectedDate));

  const zeroPoint = polarToChart(0, outerRadius, center);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextPlace = await applyPlaceFromForm();
    const nextDate = chartDateTimeFromLocalInputs(
      inputDate,
      inputTime,
      nextPlace,
    );
    const nextPositions = getGrahaPositions(nextDate, nextPlace);
    setSelectedDate(nextDate);
    setChartPositions(nextPositions);
    setIsEditingPositions(false);
    setDraftPositions([]);
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
    const nextPositions = getGrahaPositions(selectedDate, chartPlace);
    setChartPositions(nextPositions);
    setIsEditingPositions(false);
    setDraftPositions([]);
  };

  return (
    <div className={`graha-chart graha-chart--bright lang-${lang}`}>
      <header className="graha-chart__header">
        <div className="graha-chart__header-brand">
          <h1>
            <span className="graha-chart__bilingual">
              <span>கிரக நிலைகள்</span>
              <span className="graha-chart__bilingual-en">Planet Positions</span>
            </span>
          </h1>
          <p className="graha-chart__subtitle">
            <span className="graha-chart__bilingual">
              <span>நாள் 16 பாகங்கள் · காலை 6 மணி முதல்</span>
              <span className="graha-chart__bilingual-en">16 day sections · from 6 AM</span>
            </span>
            <span className="graha-chart__subtitle-meta">
              {` · ${zeroLeftLabel} · `}
              {dateLabel}
            </span>
          </p>
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
            <div className="graha-chart__form-group graha-chart__form-group--sunrise">
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
            <div className="graha-chart__form-group graha-chart__form-group--place">
              <label htmlFor="placeInput" className="graha-chart__location-label">
                <span className="graha-chart__bilingual">
                  <span>இடம்</span>
                  <span className="graha-chart__bilingual-en">Place</span>
                </span>
              </label>
              <div className="graha-chart__place-row">
                <input
                  type="text"
                  id="placeInput"
                  list="placePresets"
                  value={placeInput}
                  onChange={(e) => handlePlaceInputChange(e.target.value)}
                  onBlur={handlePlaceBlur}
                  placeholder="Chennai"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="graha-chart__place-search-btn"
                  onClick={handlePlaceSearch}
                  title="Search place"
                  aria-label="Search place"
                >
                  ⌕
                </button>
              </div>
            </div>
            <div className="graha-chart__form-group graha-chart__form-group--coords">
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
            </div>
            <button type="submit" className="graha-chart__submit-btn">
              <span className="graha-chart__bilingual">
                <span>சமர்ப்பி</span>
                <span className="graha-chart__bilingual-en">Submit</span>
              </span>
            </button>
          </div>
          <datalist id="placePresets">
            {PLACE_PRESETS.map((preset) => (
              <option key={preset.placeName} value={preset.placeName} />
            ))}
          </datalist>
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

            <defs>
              {Array.from({ length: SEGMENTS }, (_, sectorIndex) => {
                const startAngle = sectorIndex * DEGREES_PER_SEGMENT;
                return (
                  <clipPath
                    key={`sector-clip-${sectorIndex}`}
                    id={`sector-clip-${sectorIndex}`}
                  >
                    <path
                      d={describeInsetSectorWedge(
                        center,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        startAngle + DEGREES_PER_SEGMENT,
                      )}
                    />
                  </clipPath>
                );
              })}
            </defs>

            {sectorPlanetGroups.map(({ sectorIndex, planets }) => {
              const layout = layoutSectorPlanetLabel(
                planets,
                sectorIndex,
                center,
                innerRadius,
                outerRadius,
                lang,
              );
              if (!layout) return null;

              const textColors = getSectorTextColors(sectorIndex);
              const rotation = labelRadialRotation(layout.labelAngle);
              const lineHeight = layout.fontSize * SECTOR_LABEL_LINE_HEIGHT;
              const blockOffset =
                layout.lines.length > 1
                  ? -((layout.lines.length - 1) * lineHeight) / 2
                  : 0;

              return (
                <g
                  key={`sector-planets-${sectorIndex}`}
                  clipPath={`url(#sector-clip-${sectorIndex})`}
                >
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
          <p className="graha-chart__table-date">{dateLabel}</p>
          <div
            className={`graha-chart__position-consistency${
              positionConsistencyIssues.length === 0
                ? isEditingPositions
                  ? " graha-chart__position-consistency--edit"
                  : " graha-chart__position-consistency--ok"
                : " graha-chart__position-consistency--warn"
            }`}
            role="status"
            aria-live="polite"
          >
            {positionConsistencyIssues.length === 0 ? (
              isEditingPositions ? (
                <span className="graha-chart__bilingual">
                  <span>திருத்தம் — நிலை மற்றும் பாகை பொருந்துகின்றன</span>
                  <span className="graha-chart__bilingual-en">
                    Editing — position and degree match
                  </span>
                </span>
              ) : (
                <span className="graha-chart__bilingual">
                  <span>✓ நிலை மற்றும் பாகை பொருந்துகின்றன</span>
                  <span className="graha-chart__bilingual-en">
                    ✓ Position and degree values match
                  </span>
                </span>
              )
            ) : (
              <>
                <strong className="graha-chart__bilingual">
                  <span>பொருந்தாத மதிப்புகள்</span>
                  <span className="graha-chart__bilingual-en">Mismatched values</span>
                </strong>
                <ul>
                  {positionConsistencyIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
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
                        value={longitude.toFixed(1)}
                        onChange={(e) =>
                          updateDraftPosition(graha.id, "longitude", e.target.value)
                        }
                        inputMode="decimal"
                        aria-label={`${graha.nameEnglish} degree`}
                      />
                    ) : (
                      `${longitude.toFixed(1)}°`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
    </div>
  );
}
