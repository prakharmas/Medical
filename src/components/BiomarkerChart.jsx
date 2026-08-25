import { useRef, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getMedicalDocument } from "../api/api";

const COLORS = [
  "#2f80ed",
  "#7554b8",
  "#2f9e6f",
  "#f2994a",
  "#eb5757",
  "#56ccf2",
  "#bb6bd9",
  "#27ae60",
  "#e6a817",
  "#347ee6",
];

function formatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function collectBiomarkerSources(points) {
  if (!points?.length) return [];
  const collected = [];
  const seen = new Set();
  for (const p of points) {
    if (p.source && typeof p.source === "object" && p.source.doc_id) {
      const key = `${p.source.doc_id}:${p.source.page_index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(p.source);
    }
    if (Array.isArray(p.sources)) {
      for (const s of p.sources) {
        if (s && typeof s === "object" && s.doc_id) {
          const key = `${s.doc_id}:${s.page_index}`;
          if (seen.has(key)) continue;
          seen.add(key);
          collected.push(s);
        }
      }
    }
  }
  return collected;
}

function SingleBiomarkerCard({ biomarker, color }) {
  const cardRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(200);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const vh = window.innerHeight;
      setChartHeight(Math.min(280, Math.max(140, Math.floor(vh * 0.22))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const sorted = [...(biomarker.points || [])].sort((a, b) => a.date - b.date);
  const values = sorted.map((p) => p.value);
  const latest = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);

  const chartData = sorted.map((p) => ({
    date: p.date,
    dateLabel: formatDate(p.date),
    value: p.value,
  }));

  const sources = collectBiomarkerSources(biomarker.points);

  const handleDownload = async (docId) => {
    setDownloading(docId);
    try {
      const res = await getMedicalDocument(docId);
      const disposition = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match ? match[1] : `${docId}.pdf`;
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bio-card" ref={cardRef}>
      <div className="bio-card-header">
        <div className="bio-card-title">
          <span className="bio-card-dot" style={{ background: color }} />
          <span className="bio-card-name">{biomarker.name}</span>
          <span className="bio-card-unit-tag">{biomarker.unit}</span>
        </div>
        <div className="bio-card-stats">
          <span className="bio-stat">
            <small>Latest</small>
            <strong>{latest?.toFixed(2) ?? "—"}</strong>
          </span>
          <span className="bio-stat">
            <small>Range</small>
            <strong>{min.toFixed(2)} – {max.toFixed(2)}</strong>
          </span>
          <span className="bio-stat">
            <small>Readings</small>
            <strong>{sorted.length}</strong>
          </span>
        </div>
      </div>
      <div className="bio-card-chart">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#edf1f6" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 9, fill: "#96a1b1" }}
              tickLine={false}
              axisLine={{ stroke: "#edf1f6" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#96a1b1" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<SingleTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {sources.length > 0 && (
        <div className="bio-card-sources">
          {sources.map((s) => {
            const pages = Number.isFinite(s.page_index) ? s.page_index + 1 : null;
            return (
              <button
                key={`${s.doc_id}:${s.page_index}`}
                className="bio-source-btn"
                disabled={downloading === s.doc_id}
                onClick={() => handleDownload(s.doc_id)}
                title={`Source document ${s.doc_id}${pages ? ` — page ${pages}` : ""}`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                <span>Source PDF{pages ? ` · Page ${pages}` : ""}</span>
                {downloading === s.doc_id && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ai-source-spin">
                    <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SingleTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bio-tooltip-box">
      <span className="bio-tooltip-date">{label}</span>
      <span className="bio-tooltip-val">{payload[0].value?.toFixed(4)}</span>
    </div>
  );
}

export default function BiomarkerChart({ biomarkers = [] }) {
  const withData = biomarkers.filter((b) => b.points?.length > 0);

  if (!withData.length) {
    return (
      <div className="bio-chart-empty">
        <p>No biomarker data available.</p>
      </div>
    );
  }

  return (
    <div className="bio-charts-grid">
      <style>{`
        .bio-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
          gap: 14px;
          width: 100%;
        }
        .bio-card {
          border: 1px solid #e8edf4;
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
          transition: box-shadow 0.15s ease;
        }
        .bio-card:hover {
          box-shadow: 0 2px 12px rgba(28, 53, 88, 0.06);
        }
        .bio-card-header {
          padding: 14px 16px 10px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .bio-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .bio-card-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .bio-card-name {
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bio-card-unit-tag {
          padding: 2px 7px;
          border-radius: 6px;
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        .bio-card-stats {
          display: flex;
          gap: 14px;
          flex-shrink: 0;
        }
        .bio-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .bio-stat small {
          color: #94a3b8;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .bio-stat strong {
          color: #1e293b;
          font-size: 12px;
          font-weight: 700;
          margin-top: 1px;
        }
        .bio-card-chart {
          padding: 0 8px 8px;
        }
        .bio-chart-empty {
          display: grid;
          place-items: center;
          padding: 48px 24px;
          color: #96a1b1;
          font-size: 13px;
          border: 1px solid #e8edf4;
          border-radius: 12px;
          background: #fff;
        }
        .bio-chart-empty p {
          margin: 0;
        }
        .bio-tooltip-box {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          text-align: center;
        }
        .bio-tooltip-box .bio-tooltip-date {
          display: block;
          color: #94a3b8;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
        }
        .bio-tooltip-box .bio-tooltip-val {
          display: block;
          color: #1e293b;
          font-size: 13px;
          font-weight: 700;
        }
        .recharts-tooltip-wrapper {
          outline: none;
        }
        .bio-card-sources {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 14px 12px;
        }
        .bio-source-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #f8fafc;
          color: #475569;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .bio-source-btn:hover:not(:disabled) {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
        }
        .bio-source-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bio-source-btn svg {
          flex-shrink: 0;
        }
      `}</style>

      {withData.map((b, i) => (
        <SingleBiomarkerCard
          key={b.name}
          biomarker={b}
          color={COLORS[i % COLORS.length]}
        />
      ))}
    </div>
  );
}
