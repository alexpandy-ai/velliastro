import type { Planet } from "../data/planets";

type Props = {
  planets: Planet[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function PlanetNav({ planets, selectedId, onSelect }: Props) {
  return (
    <nav className="nav" aria-label="Planet navigation">
      {planets.map((planet) => {
        const isActive = planet.id === selectedId;
        return (
          <button
            key={planet.id}
            className={`nav__item ${isActive ? "nav__item--active" : ""}`}
            onClick={() => onSelect(planet.id)}
            aria-current={isActive ? "true" : undefined}
          >
            <span
              className="nav__dot"
              style={{ backgroundColor: planet.color }}
            />
            {planet.name}
          </button>
        );
      })}
    </nav>
  );
}
