import type { CSSProperties } from "react";
import type { PlanetPosition } from "../utils/positions";
import { polarToCartesian } from "../utils/positions";

type Props = {
  positions: PlanetPosition[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const SIGNS = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];

export function PlanetPositionsMap({ positions, selectedId, onSelect }: Props) {
  const size = 520;
  const center = size / 2;
  const maxOrbit = 220;

  return (
    <div className="positions-map">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="positions-map__svg"
        role="img"
        aria-label="Top-down chart of current planet positions"
      >
        <circle
          cx={center}
          cy={center}
          r={maxOrbit + 28}
          className="positions-map__zodiac-ring"
        />

        {SIGNS.map((symbol, index) => {
          const angle = index * 30 + 15;
          const labelPos = polarToCartesian(angle, maxOrbit + 42, center);

          return (
            <text
              key={symbol}
              x={labelPos.x}
              y={labelPos.y}
              className="positions-map__sign"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {symbol}
            </text>
          );
        })}

        {[0, 90, 180, 270].map((angle) => {
          const outer = polarToCartesian(angle, maxOrbit + 20, center);
          const inner = polarToCartesian(angle, 36, center);

          return (
            <line
              key={angle}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              className="positions-map__axis"
            />
          );
        })}

        {positions[0] &&
          [0.25, 0.5, 0.75, 1].map((scale) => {
            const sample = positions[0].planet.orbitRadius;
            const r = (sample / 295) * maxOrbit * scale;
            return (
              <circle
                key={scale}
                cx={center}
                cy={center}
                r={r}
                className="positions-map__orbit-guide"
              />
            );
          })}

        <circle cx={center} cy={center} r={28} className="positions-map__sun" />
        <text
          x={center}
          y={center}
          className="positions-map__sun-label"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          ☉
        </text>

        {positions.map(({ planet, longitude }) => {
          const isSelected = planet.id === selectedId;
          const radius = (planet.orbitRadius / 295) * maxOrbit;
          const pos = polarToCartesian(longitude, radius, center);
          const dotSize = Math.max(planet.size * 0.45, 8);

          return (
            <g key={planet.id}>
              <line
                x1={center}
                y1={center}
                x2={pos.x}
                y2={pos.y}
                className={`positions-map__spoke ${
                  isSelected ? "positions-map__spoke--active" : ""
                }`}
              />
              <g
                className="positions-map__planet-hit"
                onClick={() => onSelect(planet.id)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={dotSize + 6}
                  className={`positions-map__planet-glow ${
                    isSelected ? "positions-map__planet-glow--active" : ""
                  }`}
                  style={
                    {
                      "--planet-glow": planet.glow,
                    } as CSSProperties
                  }
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={dotSize}
                  className={`positions-map__planet ${
                    isSelected ? "positions-map__planet--active" : ""
                  }`}
                  style={{ fill: planet.color }}
                />
                <text
                  x={pos.x}
                  y={pos.y - dotSize - 8}
                  className="positions-map__planet-label"
                  textAnchor="middle"
                >
                  {planet.name}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
