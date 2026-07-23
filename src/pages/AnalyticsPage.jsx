import { Users, Clock, Timer, Mic, FileUp, TrendingUp, TrendingDown } from "lucide-react";

const kpis = [
  { label: "Patients Processed", value: "312", delta: "+12%", icon: Users },
  { label: "AI Hours Saved", value: "924h", delta: "+18%", icon: Clock },
  { label: "Average Review Time", value: "8 min", delta: "-2m", icon: Timer },
  { label: "Voice Sessions", value: "312", delta: "+24%", icon: Mic },
  { label: "Documents Uploaded", value: "4,218", delta: "+9%", icon: FileUp },
];

const monthly = [
  { month: "Feb", value: 245 },
  { month: "Mar", value: 278 },
  { month: "Apr", value: 294 },
  { month: "May", value: 310 },
  { month: "Jun", value: 302 },
  { month: "Jul", value: 312 },
];
const maxMonthly = Math.max(...monthly.map((item) => item.value));

const cancerTypes = [
  { label: "Breast Cancer", value: 27, color: "#2f80ed" },
  { label: "Lung Cancer", value: 19, color: "#7554b8" },
  { label: "Colorectal", value: 14, color: "#b56a38" },
  { label: "Ovarian", value: 12, color: "#35846c" },
  { label: "Cervical", value: 11, color: "#ee4c54" },
  { label: "Others", value: 17, color: "#8290a4" },
];

const heatmapWeeks = 24;
const heatmapDays = 7;
const heatmapData = Array.from({ length: heatmapWeeks }, (_, w) =>
  Array.from({ length: heatmapDays }, (_, d) => (w * 3 + d * 5 + (w % 4) * 2) % 5)
);
const heatmapColors = ["#edf2f9", "#cfe2fb", "#a9cdf7", "#6fa8ef", "#2f80ed"];
const heatmapMonths = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export default function AnalyticsPage() {
  return (
    <>
      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }
        .kpi-card {
          padding: 17px 18px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
        }
        .kpi-icon {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 9px;
          color: #2f80ed;
          background: #edf5ff;
        }
        .kpi-card small {
          display: block;
          color: #96a1b1;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .kpi-card strong {
          display: block;
          margin-top: 7px;
          color: #172338;
          font-size: 24px;
          letter-spacing: -0.6px;
        }
        .kpi-delta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 9px;
          padding: 3px 7px;
          border-radius: 9px;
          font-size: 10px;
          font-weight: 750;
        }
        .kpi-delta.up {
          color: #268e69;
          background: #e6f8f0;
        }
        .kpi-delta.down {
          color: #b0393f;
          background: #ffe8e9;
        }
        .analytics-section {
          margin-top: 22px;
          padding: 22px 24px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
        }
        .analytics-section h2 {
          margin: 0 0 4px;
          color: #344158;
          font-size: 15px;
        }
        .analytics-section > p {
          margin: 0 0 20px;
          color: #96a1b1;
          font-size: 11px;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 200px;
          padding: 0 6px;
        }
        .bar-column {
          display: flex;
          width: 56px;
          height: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .bar-value {
          color: #536177;
          font-size: 11px;
          font-weight: 700;
        }
        .bar-fill {
          width: 100%;
          border-radius: 7px 7px 3px 3px;
          background: linear-gradient(180deg, #4b91ea, #2f6fe0);
          transition: opacity 0.15s ease;
        }
        .bar-column:hover .bar-fill {
          opacity: 0.85;
        }
        .bar-label {
          color: #8b98aa;
          font-size: 11px;
          font-weight: 650;
        }
        .cancer-list {
          display: grid;
          gap: 15px;
        }
        .cancer-row-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: #47556b;
          font-size: 12px;
          font-weight: 650;
        }
        .cancer-row-top b {
          color: #172338;
        }
        .cancer-track {
          height: 8px;
          overflow: hidden;
          border-radius: 5px;
          background: #edf1f6;
        }
        .cancer-fill {
          height: 100%;
          border-radius: inherit;
        }
        .heatmap-months {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          padding: 0 1px;
          color: #96a1b1;
          font-size: 10px;
          font-weight: 700;
        }
        .heatmap-grid {
          display: grid;
          grid-auto-flow: column;
          grid-template-rows: repeat(7, 12px);
          grid-template-columns: repeat(${heatmapWeeks}, 12px);
          gap: 3px;
          overflow-x: auto;
        }
        .heatmap-cell {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        .heatmap-legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 12px;
          color: #96a1b1;
          font-size: 10px;
        }
        .heatmap-legend .heatmap-cell {
          width: 10px;
          height: 10px;
        }
        @media (max-width: 1180px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 700px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bar-column {
            width: 34px;
          }
        }
      `}</style>

      <div className="page-heading">
        <div>
          <p className="eyebrow">PERFORMANCE OVERVIEW</p>
          <h1>Analytics</h1>
          <p>Usage, efficiency, and clinical trends across your workspace.</p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isUp = kpi.delta.trim().startsWith("+");
          return (
            <div className="kpi-card" key={kpi.label}>
              <span className="kpi-icon">
                <Icon size={16} />
              </span>
              <small>{kpi.label}</small>
              <strong>{kpi.value}</strong>
              <div className={`kpi-delta ${isUp ? "up" : "down"}`}>
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {kpi.delta}
              </div>
            </div>
          );
        })}
      </div>

      <section className="analytics-section">
        <h2>Monthly Overview</h2>
        <p>Patients processed per month, Feb – Jul</p>
        <div className="bar-chart">
          {monthly.map((item) => (
            <div className="bar-column" key={item.month}>
              <span className="bar-value">{item.value}</span>
              <div
                className="bar-fill"
                style={{ height: `${(item.value / maxMonthly) * 100}%` }}
              />
              <span className="bar-label">{item.month}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-section">
        <h2>Top Cancer Types</h2>
        <p>Share of active patients by diagnosis</p>
        <div className="cancer-list">
          {cancerTypes.map((item) => (
            <div key={item.label}>
              <div className="cancer-row-top">
                <span>{item.label}</span>
                <b>{item.value}%</b>
              </div>
              <div className="cancer-track">
                <div
                  className="cancer-fill"
                  style={{ width: `${item.value}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-section">
        <h2>Monthly Usage Heatmap</h2>
        <p>Daily platform activity, Feb – Jul</p>
        <div className="heatmap-months">
          {heatmapMonths.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {heatmapData.flatMap((week, wi) =>
            week.map((level, di) => (
              <div
                key={`${wi}-${di}`}
                className="heatmap-cell"
                style={{ background: heatmapColors[level] }}
              />
            ))
          )}
        </div>
        <div className="heatmap-legend">
          Less
          {heatmapColors.map((color) => (
            <span key={color} className="heatmap-cell" style={{ background: color }} />
          ))}
          More
        </div>
      </section>
    </>
  );
}