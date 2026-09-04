const SEGMENTS = 16;
const DEGREES_PER_SEGMENT = 360 / SEGMENTS;

function polarToCartesian(
  angleDeg: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  const rad = ((angleDeg + 180) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

export function DividedCircle() {
  const size = 480;
  const center = size / 2;
  const outerRadius = 180;
  const innerRadius = 48;

  const boundaries = Array.from(
    { length: SEGMENTS },
    (_, i) => i * DEGREES_PER_SEGMENT,
  );

  return (
    <div className="divided-circle">
      <header className="divided-circle__header">
        <h1>Circle — 16 Divisions</h1>
        <p className="divided-circle__subtitle">
          360° divided into 16 equal parts · {DEGREES_PER_SEGMENT}° each
        </p>
      </header>

      <div className="divided-circle__panel">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="divided-circle__svg"
          role="img"
          aria-label="Circle divided into 16 equal parts of 22.5 degrees"
        >
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            className="divided-circle__ring"
          />

          <line
            x1={center}
            y1={center}
            x2={polarToCartesian(0, outerRadius, center).x}
            y2={polarToCartesian(0, outerRadius, center).y}
            className="divided-circle__zero-axis"
          />

          {boundaries.map((angle, index) => {
            const outer = polarToCartesian(angle, outerRadius, center);
            const inner = polarToCartesian(angle, innerRadius, center);
            const labelPos = polarToCartesian(
              angle + DEGREES_PER_SEGMENT / 2,
              outerRadius * 0.62,
              center,
            );
            const degreePos = polarToCartesian(angle, outerRadius + 22, center);

            return (
              <g key={angle}>
                <path
                  d={describeSector(
                    center,
                    innerRadius,
                    outerRadius,
                    angle,
                    angle + DEGREES_PER_SEGMENT,
                  )}
                  className={
                    index % 2 === 0
                      ? "divided-circle__sector divided-circle__sector--even"
                      : "divided-circle__sector"
                  }
                />
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  className="divided-circle__spoke"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  className="divided-circle__segment-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {index + 1}
                </text>
                <text
                  x={degreePos.x}
                  y={degreePos.y}
                  className="divided-circle__degree-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {angle}°
                </text>
              </g>
            );
          })}

          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            className="divided-circle__hub"
          />
          <text
            x={center}
            y={center - 6}
            className="divided-circle__hub-label"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            16
          </text>
          <text
            x={center}
            y={center + 14}
            className="divided-circle__hub-sublabel"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            × 22.5°
          </text>
        </svg>

        <ul className="divided-circle__legend">
          {boundaries.map((angle, index) => (
            <li key={angle}>
              <span className="divided-circle__legend-index">{index + 1}</span>
              <span>
                {angle}° – {angle + DEGREES_PER_SEGMENT}°
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function describeSector(
  cx: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = polarToCartesian(startAngle, outerR, cx);
  const endOuter = polarToCartesian(endAngle, outerR, cx);
  const startInner = polarToCartesian(endAngle, innerR, cx);
  const endInner = polarToCartesian(startAngle, innerR, cx);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}
