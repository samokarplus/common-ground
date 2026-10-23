import { useId } from "react";
import { axisRange, describeChart, formatTick, formatValue, type Chart } from "@/lib/briefing";

const COLORS = ["#2b5a4c", "#a8461f", "#9a6b12", "#5b4d41"];
const W = 760;
const H = 360;
const M = { l: 62, r: 30, t: 16, b: 48 };

/** Accessible SVG chart. Gaps (null) are drawn as breaks, never as zero. A data table is always available. */
export default function ChartView({ chart }: { chart: Chart }) {
  const uid = useId();
  const { min, max, truncated, ticks } = axisRange(chart);
  const xs = [...new Set(chart.series.flatMap((s) => s.points.map((p) => String(p.x))))];
  const slot = (W - M.l - M.r) / xs.length;
  // Bars sit in the middle of equal slots so the first and last bars are not cut off; lines run edge to edge with a small inset.
  const px = (x: string) => (chart.kind === "bar" ? M.l + slot * (xs.indexOf(x) + 0.5) : M.l + 8 + (xs.indexOf(x) / Math.max(xs.length - 1, 1)) * (W - M.l - M.r - 16));
  const barW = Math.min(46, (slot * 0.7) / chart.series.length);
  const py = (y: number) => M.t + (1 - (y - min) / (max - min)) * (H - M.t - M.b);
  const every = Math.ceil(xs.length / 8);
  return (
    <figure className="chart">
      <figcaption>
        <strong id={`${uid}-t`}>{chart.title}</strong>
        <span className="chart-range">{chart.dateRange}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${uid}-t ${uid}-d`} className="chart-svg">
        <desc id={`${uid}-d`}>{describeChart(chart)}</desc>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={py(t)} y2={py(t)} stroke="#e0d3bd" />
            <text x={M.l - 8} y={py(t) + 4} textAnchor="end" fontSize="13" fill="#5b4d41">
              {formatTick(t, chart.format)}
            </text>
          </g>
        ))}
        {xs.map((x, i) =>
          i % every === 0 || i === xs.length - 1 ? (
            <text key={x} x={px(x)} y={H - M.b + 20} textAnchor="middle" fontSize="13" fill="#5b4d41">
              {x}
            </text>
          ) : null,
        )}
        <text x={(W + M.l) / 2} y={H - 6} textAnchor="middle" fontSize="13" fill="#5b4d41">
          {chart.xLabel}
        </text>
        {chart.kind === "bar"
          ? chart.series.map((s, si) =>
              s.points.map((p) =>
                p.y === null ? null : (
                  <rect key={`${s.id}-${p.x}`} x={px(String(p.x)) - (barW * chart.series.length) / 2 + si * barW} y={py(p.y)} width={barW} height={Math.max(0, py(Math.max(min, 0)) - py(p.y))} fill={COLORS[si % COLORS.length]} opacity={s.estimate ? 0.55 : 1}>
                    <title>{`${s.label}, ${p.x}: ${formatValue(p.y, chart.format)}`}</title>
                  </rect>
                ),
              ),
            )
          : chart.series.map((s, si) => {
              const segs: string[] = [];
              let cur = "";
              for (const p of s.points) {
                if (p.y === null) {
                  if (cur) segs.push(cur);
                  cur = "";
                } else cur += `${cur ? "L" : "M"}${px(String(p.x)).toFixed(1)},${py(p.y).toFixed(1)}`;
              }
              if (cur) segs.push(cur);
              return (
                <g key={s.id}>
                  {segs.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth={2.5} strokeDasharray={s.estimate ? "6 4" : undefined} />
                  ))}
                  {s.points.map((p) =>
                    p.y === null ? null : (
                      <circle key={`${s.id}-${p.x}`} cx={px(String(p.x))} cy={py(p.y)} r={3.6} fill={COLORS[si % COLORS.length]}>
                        <title>{`${s.label}, ${p.x}: ${formatValue(p.y, chart.format)}${s.estimate ? " (estimate)" : ""}`}</title>
                      </circle>
                    ),
                  )}
                </g>
              );
            })}
      </svg>
      <div className="chart-legend">
        {chart.series.map((s, si) => (
          <span key={s.id}>
            <i style={{ background: COLORS[si % COLORS.length] }} /> {s.label}
            {s.estimate ? " (estimate)" : ""}
          </span>
        ))}
        <span className="muted">Vertical axis: {chart.yLabel}</span>
        {truncated && <strong className="trunc">The vertical axis does not start at zero.</strong>}
      </div>
      <p className="chart-def">
        <strong>What this measures:</strong> {chart.definition}
        {chart.note ? ` ${chart.note}` : ""}
      </p>
      <details>
        <summary>View the data as a table</summary>
        <div className="table-wrap" role="region" aria-label={`${chart.title} data table`} tabIndex={0}>
          <table>
            <caption className="sr-only">{chart.title}: values by {chart.xLabel}</caption>
            <thead>
              <tr>
                <th scope="col">{chart.xLabel}</th>
                {chart.series.map((s) => (
                  <th scope="col" key={s.id}>
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xs.map((x) => (
                <tr key={x}>
                  <th scope="row">{x}</th>
                  {chart.series.map((s) => {
                    const p = s.points.find((q) => String(q.x) === x);
                    return <td key={s.id}>{p && p.y !== null ? formatValue(p.y, chart.format) : "Not reported"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
