import type { PlanetPosition } from "../utils/positions";

type Props = {
  positions: PlanetPosition[];
  selectedId: string;
  onSelect: (id: string) => void;
  date: Date;
};

export function PlanetPositionsTable({
  positions,
  selectedId,
  onSelect,
  date,
}: Props) {
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="positions-table">
      <header className="positions-table__header">
        <h2>Current Positions</h2>
        <p>{formattedDate}</p>
      </header>

      <div className="positions-table__data-wrap">
        <table>
          <thead>
            <tr>
              <th>Planet</th>
              <th>Sign</th>
              <th>Degree</th>
              <th>Longitude</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(({ planet, sign, formatted, longitude }) => {
              const isSelected = planet.id === selectedId;

              return (
                <tr
                  key={planet.id}
                  className={isSelected ? "positions-table__row--active" : ""}
                  onClick={() => onSelect(planet.id)}
                >
                  <td>
                    <span
                      className="positions-table__dot"
                      style={{ backgroundColor: planet.color }}
                    />
                    {planet.name}
                  </td>
                  <td>{sign}</td>
                  <td>{formatted}</td>
                  <td>{longitude.toFixed(2)}°</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
