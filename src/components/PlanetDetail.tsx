import type { CSSProperties } from "react";
import type { Planet } from "../data/planets";

type Props = {
  planet: Planet;
};

export function PlanetDetail({ planet }: Props) {
  const stats = [
    { label: "Distance from Sun", value: planet.distanceFromSun },
    { label: "Diameter", value: planet.diameter },
    { label: "Day Length", value: planet.dayLength },
    { label: "Year Length", value: planet.yearLength },
    { label: "Known Moons", value: String(planet.moons) },
    { label: "Temperature", value: planet.temperature },
  ];

  return (
    <article className="detail" key={planet.id}>
      <header className="detail__header">
        <div
          className="detail__orb"
          style={
            {
              "--planet-color": planet.color,
              "--planet-glow": planet.glow,
            } as CSSProperties
          }
        />
        <div>
          <h2 className="detail__name">{planet.name}</h2>
          <p className="detail__tagline">{planet.tagline}</p>
        </div>
      </header>

      <p className="detail__description">{planet.description}</p>

      <dl className="detail__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="detail__stat">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
