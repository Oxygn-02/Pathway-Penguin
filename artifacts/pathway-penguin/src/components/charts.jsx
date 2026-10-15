import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label,
} from "recharts";
import { CHART_COLORS, FONT, PIE_COLORS } from "../constants.js";

/* QuestionGraph — renders a graph from the simplified `graph` schema:
   {
     graphType: "scatter" | "bar" | "line" | "pie" | "dot-to-dot" | "none",
     connect: boolean,
     title, xLabel, yLabel,
     points:   [{x,y}],            // scatter / line / dot-to-dot
     bars:     [{label, value}],   // bar
     segments: [{label, value}],   // pie
   }
*/
export function QuestionGraph({ graph }) {
  if (!graph || typeof graph !== "object") return null;
  const t = graph.graphType;
  if (!t || t === "none") return null;

  const titleEl = graph.title
    ? <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: "#1a3a5f", margin: "0 0 8px", textAlign: "center" }}>{graph.title}</p>
    : null;
  const wrap = (chart) => (
    <div style={{ marginBottom: 16 }}>
      {titleEl}
      <div style={{ background: "rgba(218,238,250,0.25)", borderRadius: 12, border: "1px solid rgba(91,174,212,0.2)", padding: "12px 8px 4px" }}>
        <ResponsiveContainer width="100%" height={260}>{chart}</ResponsiveContainer>
      </div>
    </div>
  );
  const tooltip = <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 8, border: "1px solid rgba(91,174,212,0.3)" }} />;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,174,212,0.2)" />;
  const tickStyle = { fontFamily: FONT, fontSize: 11, fill: "#4a6a88" };
  const labelStyle = { fontFamily: FONT, fontSize: 12, fill: "#4a6a88" };

  // Scatter / line / dot-to-dot all use {x,y} points; "connect" controls
  // whether a connecting line is drawn between them.
  if (t === "scatter" || t === "line" || t === "dot-to-dot") {
    const raw = Array.isArray(graph.points) ? graph.points : [];
    const data = raw
      .filter((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
      .map((p) => ({ x: Number(p.x), y: Number(p.y) }));
    if (data.length === 0) return null;
    // dot-to-dot: connect in array order; line: connect; scatter: only if explicitly asked.
    const showLine = t === "line" || t === "dot-to-dot" || graph.connect === true;
    return wrap(
      <ComposedChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 36 }}>
        {grid}
        <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tick={tickStyle}>
          {graph.xLabel && <Label value={graph.xLabel} offset={-10} position="insideBottom" style={labelStyle} />}
        </XAxis>
        <YAxis type="number" domain={["auto", "auto"]} tick={tickStyle}>
          {graph.yLabel && <Label value={graph.yLabel} angle={-90} position="insideLeft" offset={20} style={{ ...labelStyle, textAnchor: "middle" }} />}
        </YAxis>
        {tooltip}
        {showLine && <Line type="linear" dataKey="y" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} isAnimationActive={false} />}
        <Scatter dataKey="y" fill={CHART_COLORS[0]} isAnimationActive={false} />
      </ComposedChart>
    );
  }

  if (t === "bar") {
    const raw = Array.isArray(graph.bars) ? graph.bars : [];
    const data = raw
      .filter((b) => b && Number.isFinite(Number(b.value)))
      .map((b) => ({ label: String(b.label ?? ""), value: Number(b.value) }));
    if (data.length === 0) return null;
    return wrap(
      <BarChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 36 }}>
        {grid}
        <XAxis dataKey="label" tick={tickStyle}>
          {graph.xLabel && <Label value={graph.xLabel} offset={-10} position="insideBottom" style={labelStyle} />}
        </XAxis>
        <YAxis tick={tickStyle}>
          {graph.yLabel && <Label value={graph.yLabel} angle={-90} position="insideLeft" offset={20} style={{ ...labelStyle, textAnchor: "middle" }} />}
        </YAxis>
        {tooltip}
        <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    );
  }

  if (t === "pie") {
    const raw = Array.isArray(graph.segments) ? graph.segments : [];
    const data = raw
      .filter((s) => s && Number.isFinite(Number(s.value)) && Number(s.value) > 0)
      .map((s) => ({ name: String(s.label ?? ""), value: Number(s.value) }));
    if (data.length === 0) return null;
    return wrap(
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        {tooltip}
        <Legend wrapperStyle={{ fontFamily: FONT, fontSize: 12 }} />
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label isAnimationActive={false}>
          {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
      </PieChart>
    );
  }

  return null;
}

export function QuestionChart({ chartData }) {
  if (!chartData || !chartData.type || !Array.isArray(chartData.series) || chartData.series.length === 0) return null;

  const { type, title, xAxis = {}, yAxis = {}, series } = chartData;

  const commonProps = {
    margin: { top: 8, right: 24, left: 8, bottom: 36 },
  };

  const xAxisEl = (
    <XAxis dataKey="x" type="number" domain={["auto", "auto"]} tick={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fill: "#4a6a88" }}>
      {xAxis.label && <Label value={xAxis.label} offset={-10} position="insideBottom" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fill: "#4a6a88" }} />}
    </XAxis>
  );

  const yAxisEl = (
    <YAxis
      domain={[yAxis.min != null ? yAxis.min : "auto", yAxis.max != null ? yAxis.max : "auto"]}
      tick={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fill: "#4a6a88" }}
    >
      {yAxis.label && <Label value={yAxis.label} angle={-90} position="insideLeft" offset={20} style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fill: "#4a6a88", textAnchor: "middle" }} />}
    </YAxis>
  );

  const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,174,212,0.2)" />;
  const tooltip = <Tooltip contentStyle={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, borderRadius: 8, border: "1px solid rgba(91,174,212,0.3)" }} />;
  const legend = series.length > 1 ? <Legend wrapperStyle={{ fontFamily: "'Nunito', sans-serif", fontSize: 12 }} /> : null;

  let chart;
  if (type === "scatter") {
    const scatterSeries = series.map((s, idx) => ({
      name: s.name,
      data: s.data.map(([x, y]) => ({ x, y })),
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
    chart = (
      <ScatterChart {...commonProps}>
        {grid}{xAxisEl}{yAxisEl}{tooltip}{legend}
        {scatterSeries.map((s, idx) => (
          <Scatter key={idx} name={s.name} data={s.data} fill={s.color} />
        ))}
      </ScatterChart>
    );
  } else if (type === "bar" || type === "histogram") {
    const barData = series[0].data.map(([x, y]) => ({ x: String(x), y }));
    const additionalSeries = series.slice(1).map((s, idx) => ({
      key: `y${idx + 1}`,
      name: s.name,
      data: s.data.map(([, y]) => y),
      color: CHART_COLORS[(idx + 1) % CHART_COLORS.length],
    }));
    const mergedData = barData.map((row, i) => {
      const merged = { x: row.x, y: row.y };
      additionalSeries.forEach((s) => { merged[s.key] = s.data[i] ?? 0; });
      return merged;
    });
    chart = (
      <BarChart data={mergedData} {...commonProps}>
        {grid}
        <XAxis dataKey="x" tick={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fill: "#4a6a88" }}>
          {xAxis.label && <Label value={xAxis.label} offset={-10} position="insideBottom" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fill: "#4a6a88" }} />}
        </XAxis>
        {yAxisEl}{tooltip}{legend}
        <Bar dataKey="y" name={series[0].name} fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
        {additionalSeries.map((s, idx) => (
          <Bar key={idx} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    );
  } else {
    const lineData = series[0].data.map(([x, y]) => ({ x, y }));
    const additionalSeries = series.slice(1).map((s, idx) => ({
      key: `y${idx + 1}`,
      name: s.name,
      data: s.data.map(([x, y]) => ({ x, y: y })),
      color: CHART_COLORS[(idx + 1) % CHART_COLORS.length],
    }));
    const mergedData = lineData.map((row, i) => {
      const merged = { x: row.x, y: row.y };
      additionalSeries.forEach((s) => { merged[s.key] = s.data[i]?.y ?? null; });
      return merged;
    });
    chart = (
      <LineChart data={mergedData} {...commonProps}>
        {grid}{xAxisEl}{yAxisEl}{tooltip}{legend}
        <Line type="linear" dataKey="y" name={series[0].name} stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[0] }} />
        {additionalSeries.map((s, idx) => (
          <Line key={idx} type="linear" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3, fill: s.color }} />
        ))}
      </LineChart>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {title && <p style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, color: "#1a3a5f", margin: "0 0 8px", textAlign: "center" }}>{title}</p>}
      <div style={{ background: "rgba(218,238,250,0.25)", borderRadius: 12, border: "1px solid rgba(91,174,212,0.2)", padding: "12px 8px 4px" }}>
        <ResponsiveContainer width="100%" height={260}>
          {chart}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Trace table ──────────────────────────────────────────────── */
export function TraceTable({ headers, initialRows, disabled, onChange }) {
  const [cells, setCells] = useState(() => initialRows.map((row) => row.map((v) => (v === null || v === undefined ? "" : String(v)))));
  function update(ri, ci, val) {
    setCells((prev) => { const next = prev.map((r) => [...r]); next[ri][ci] = val; onChange(next); return next; });
  }
  const cellStyle = { border: "1.5px solid rgba(126,173,216,0.35)", padding: "6px 8px", minWidth: 72, fontFamily: FONT, fontSize: 13, color: "#1a3a4f", background: "white" };
  const inputStyle = { width: "100%", border: "none", outline: "none", fontFamily: FONT, fontSize: 13, color: "#1a3a4f", background: "transparent", padding: 0 };
  return (
    <div style={{ overflowX: "auto", marginTop: 14, marginBottom: 4 }}>
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", color: "#9ac0d8", textTransform: "uppercase", marginBottom: 7 }}>Trace Table — fill in each cell</p>
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead><tr>{headers.map((h, i) => <th key={i} style={{ ...cellStyle, background: "rgba(126,173,216,0.1)", fontWeight: 700, fontSize: 12, color: "#4a8cbf", textAlign: "left" }}>{h}</th>)}</tr></thead>
        <tbody>{cells.map((row, ri) => (<tr key={ri}>{row.map((val, ci) => (<td key={ci} style={cellStyle}>{disabled ? <span>{val}</span> : <input value={val} onChange={(e) => update(ri, ci, e.target.value)} style={inputStyle} placeholder="…" />}</td>))}</tr>))}</tbody>
      </table>
    </div>
  );
}
