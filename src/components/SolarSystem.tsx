import type { CSSProperties } from "react";
import type { Planet } from "../data/planets";

type Props = {
  planets: Planet[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SolarSystem({ planets, selectedId, onSelect }: Props) {
  return (
    <div className="solar-system">
      <div className="sun" aria-label="The Sun">
        <div className="sun__core" />
        <div className="sun__glow" />
      </div>

      {planets.map((planet, index) => {
        const isSelected = planet.id === selectedId;
        const duration = 20 + index * 8;

        return (
          <div
            key={planet.id}
            className="orbit"
            style={
              {
                "--orbit-radius": `${planet.orbitRadius}px`,
                "--orbit-duration": `${duration}s`,
                "--orbit-delay": `${-index * 3}s`,
              } as CSSProperties
            }
          >
            <div className="orbit__ring" />
            <button
              className={`planet ${isSelected ? "planet--selected" : ""}`}
              style={
                {
                  "--planet-color": planet.color,
                  "--planet-glow": planet.glow,
                  "--planet-size": `${planet.size}px`,
                } as CSSProperties
              }
              onClick={() => onSelect(planet.id)}
              aria-label={`Select ${planet.name}`}
              aria-pressed={isSelected}
            >
              <span className="planet__body" />
              {planet.id === "saturn" && <span className="planet__rings" />}
              <span className="planet__label">{planet.name}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
