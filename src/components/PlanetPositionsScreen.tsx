import { useMemo, useState } from "react";
import { planets } from "../data/planets";
import { getPlanetPositions } from "../utils/positions";
import { PlanetPositionsMap } from "./PlanetPositionsMap";
import { PlanetPositionsTable } from "./PlanetPositionsTable";

export function PlanetPositionsScreen() {
  const [selectedId, setSelectedId] = useState("earth");
  const date = useMemo(() => new Date(), []);
  const positions = useMemo(() => getPlanetPositions(planets, date), [date]);
  const selected = positions.find((p) => p.planet.id === selectedId);

  return (
    <div className="positions-screen">
      <header className="positions-screen__header">
        <div>
          <h1>Planet Positions</h1>
          <p className="positions-screen__subtitle">
            Live orbital positions around the Sun, shown on the ecliptic
          </p>
        </div>
        {selected && (
          <div className="positions-screen__highlight">
            <span
              className="positions-screen__highlight-dot"
              style={{ backgroundColor: selected.planet.color }}
            />
            <div>
              <strong>{selected.planet.name}</strong>
              <p>
                {selected.sign} {selected.formatted} ·{" "}
                {selected.longitude.toFixed(2)}° ecliptic
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="positions-screen__layout">
        <section className="positions-screen__map-panel">
          <PlanetPositionsMap
            positions={positions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <p className="positions-screen__note">
            Top-down view · 0° Aries at top · Distances not to scale
          </p>
        </section>

        <aside className="positions-screen__table-panel">
          <PlanetPositionsTable
            positions={positions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            date={date}
          />
        </aside>
      </div>
    </div>
  );
}
