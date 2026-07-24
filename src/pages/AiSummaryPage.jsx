import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { generateMedicalSummary } from "../api/api";

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtSources(sources) {
  if (!sources?.length) return "";
  return sources.map((s) => `Doc ${s.doc_id} · Page ${s.page_index + 1}`).join(", ");
}

function formatMedications(items) {
  return items
    .map((m) => {
      let line = `• ${m.name} — ${m.dosage}`;
      if (m.status) line += ` (${m.status})`;
      if (m.active_since) line += ` since ${fmtDate(m.active_since)}`;
      if (m.stopped_since) line += ` stopped ${fmtDate(m.stopped_since)}`;
      if (m.notes) line += `\n  ${m.notes}`;
      return line;
    })
    .join("\n");
}

const CHART_COLORS = ["#2f80ed", "#e74c3c", "#27ae60", "#f39c12", "#8e44ad", "#1abc9c", "#e67e22", "#34495e"];

function BiomarkerChart({ biomarkers }) {
  if (!biomarkers?.length) return null;

  const W = 520, H = 220, PAD = { t: 30, r: 20, b: 50, l: 55 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const allPoints = biomarkers.flatMap((b) => b.points || []);
  if (!allPoints.length) return null;

  const dates = allPoints.map((p) => p.date).sort((a, b) => a - b);
  const values = allPoints.map((p) => p.value);
  const minDate = dates[0], maxDate = dates[dates.length - 1];
  const minVal = Math.min(...values), maxVal = Math.max(...values);
  const valPad = (maxVal - minVal) * 0.1 || 0.1;
  const yMin = Math.max(0, minVal - valPad);
  const yMax = maxVal + valPad;

  const x = (ts) => PAD.l + ((ts - minDate) / (maxDate - minDate || 1)) * plotW;
  const y = (v) => PAD.t + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => yMin + (i / (tickCount - 1)) * (yMax - yMin));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxHeight: 260 }}>
      {yTicks.map((val, i) => (
        <g key={i}>
          <line x1={PAD.l} y1={y(val)} x2={W - PAD.r} y2={y(val)} stroke="#e5e7eb" strokeWidth="0.5" />
          <text x={PAD.l - 6} y={y(val) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
            {val.toFixed(2)}
          </text>
        </g>
      ))}
      {biomarkers.map((b, bi) => {
        const sorted = [...(b.points || [])].sort((a, c) => a.date - c.date);
        const color = CHART_COLORS[bi % CHART_COLORS.length];
        const pathD = sorted.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date)},${y(p.value)}`).join(" ");
        return (
          <g key={bi}>
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
            {sorted.map((p, pi) => (
              <circle key={pi} cx={x(p.date)} cy={y(p.value)} r="2.5" fill={color} />
            ))}
          </g>
        );
      })}
      {biomarkers.map((b, bi) => {
        const color = CHART_COLORS[bi % CHART_COLORS.length];
        const lx = PAD.l + bi * 110;
        if (lx + 80 > W) return null;
        return (
          <g key={`leg-${bi}`} transform={`translate(${lx}, ${H - 14})`}>
            <rect x="0" y="-4" width="8" height="8" rx="1" fill={color} />
            <text x="12" y="3" fontSize="8" fill="#6b7280">
              {b.name} ({b.unit})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function fmtDuration(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatTreatmentRegimens(items) {
  return items
    .map((t) => {
      let line = `• ${t.treatment_regimen}`;
      if (t.duration) line += ` — ${fmtDuration(t.duration)}`;
      if (t.best_response) line += ` | Response: ${t.best_response}`;
      if (t.reason_for_stopping) line += ` | Stopped: ${t.reason_for_stopping}`;
      return line;
    })
    .join("\n");
}

function formatActiveProblems(items) {
  return items
    .map((p) => {
      let line = `• ${p.name}`;
      if (p.date) line += ` (${fmtDate(p.date)})`;
      if (p.details) line += `\n  ${p.details}`;
      return line;
    })
    .join("\n");
}

function formatAttentionAlerts(items) {
  return items
    .map((a) => {
      const priority = a.priority ? `[${a.priority.toUpperCase()}]` : "";
      let line = `• ${priority} ${a.title}`;
      if (a.details) line += `\n  ${a.details}`;
      return line;
    })
    .join("\n");
}

function formatImagingAndPath(items) {
  return items
    .map((im) => {
      let line = `• ${im.type}`;
      if (im.date) line += ` — ${fmtDate(im.date)}`;
      if (im.trend) line += ` | Trend: ${im.trend}`;
      if (im.findings?.length) line += `\n  Findings: ${im.findings.join("; ")}`;
      if (im.interpretation) line += `\n  ${im.interpretation}`;
      return line;
    })
    .join("\n");
}

function formatBiomarkers(items) {
  return items
    .map((b) => {
      const pts = b.points
        ?.map((p) => `${fmtDate(p.date)}: ${p.value} ${b.unit || ""}`)
        .join(", ");
      return `• ${b.name}: ${pts || "—"}`;
    })
    .join("\n");
}

function formatVerbalFindings(items) {
  return items
    .map((v) => {
      const pts = v.points
        ?.map((p) => `${fmtDate(p.date)}: ${p.text}`)
        .join("; ");
      return `• ${v.name}: ${pts || "—"}`;
    })
    .join("\n");
}

function formatClinicalEncounters(items) {
  return items
    .map((c) => {
      let line = `• ${c.title}`;
      if (c.date) line += ` — ${fmtDate(c.date)}`;
      if (c.notes) line += `\n  ${c.notes}`;
      return line;
    })
    .join("\n");
}

function formatDatedMedicalEvents(items) {
  return items
    .map((g) => {
      const evts = g.events?.map((e) => `  — ${e.title}: ${e.info}`).join("\n");
      return `${fmtDate(g.date)}:\n${evts || ""}`;
    })
    .join("\n\n");
}

function formatUndatedMedicalEvents(items) {
  return items.map((e) => `• ${e.title}: ${e.info}`).join("\n");
}

function formatPrimaryCondition(pc) {
  const lines = [];
  if (pc.diagnosis) lines.push(`Diagnosis: ${pc.diagnosis}`);
  if (pc.stage_or_severity) lines.push(`Stage / Severity: ${pc.stage_or_severity}`);
  if (pc.performance_status_score) lines.push(`Performance Status: ${pc.performance_status_score} (${pc.performance_status_scale || ""})`);
  if (pc.current_status) lines.push(`Current Status: ${pc.current_status}`);
  return lines.join("\n");
}

function formatClinicalSummary(cs) {
  const lines = [];
  if (cs.diagnosis_overview) lines.push(`Diagnosis Overview: ${cs.diagnosis_overview}`);
  if (cs.disease_spread) lines.push(`Disease Spread: ${cs.disease_spread}`);
  if (cs.treatment_journey) lines.push(`Treatment Journey: ${cs.treatment_journey}`);
  if (cs.current_clinical_concern) lines.push(`Current Clinical Concern: ${cs.current_clinical_concern}`);
  if (cs.pending_clinical_decision) lines.push(`Pending Clinical Decision: ${cs.pending_clinical_decision}`);
  return lines.join("\n");
}

function buildSections(summary) {
  const sections = [];
  const pc = summary.primary_condition || {};
  const cs = summary.clinical_summary || {};

  const pcContent = formatPrimaryCondition(pc);
  if (pcContent) {
    sections.push({ title: "Primary Condition", content: pcContent, source: "AI Generated" });
  }

  const csContent = formatClinicalSummary(cs);
  if (csContent) {
    sections.push({ title: "Clinical Summary", content: csContent, source: "AI Generated" });
  }

  const structuredFields = [
    ["Medications", summary.medications, formatMedications],
    ["Treatment Regimens", summary.treatment_regimens, formatTreatmentRegimens],
    ["Active Problems", summary.active_problems, formatActiveProblems],
    ["Attention & Alerts", summary.attention_and_alerts, formatAttentionAlerts],
    ["Imaging & Pathology", summary.imaging_and_path, formatImagingAndPath],
    ["Biomarkers", summary.biomarkers, formatBiomarkers],
    ["Verbal Findings", summary.verbal_findings, formatVerbalFindings],
    ["Clinical Encounters", summary.clinical_encounters, formatClinicalEncounters],
    ["Dated Medical Events", summary.dated_medical_events, formatDatedMedicalEvents],
    ["Undated Medical Events", summary.undated_medical_events, formatUndatedMedicalEvents],
  ];

  for (const [title, items, formatter] of structuredFields) {
    if (items?.length) {
      const section = { title, content: formatter(items), source: "AI Generated" };
      if (title === "Biomarkers") section.chartData = items;
      sections.push(section);
    }
  }

  return sections;
}

export default function AiSummaryPage() {
  const { state } = useLocation();
  const patientId = state?.patientId;

  const [sections, setSections] = useState([]);
  const [dataHealth, setDataHealth] = useState({ issues: [], confidence: "low" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      setError("No patient selected. Please navigate from a patient profile.");
      return;
    }

    const fetchSummary = async () => {
      try {
        const res = await generateMedicalSummary({ patient_uid: patientId });
        if (res.data.success && res.data.summary) {
          const built = buildSections(res.data.summary);
          setSections(built);
          setDataHealth(res.data.summary.data_health || { issues: [], confidence: "low" });
          if (built.length > 0) setExpanded(built[0].title);
        } else {
          setError("Failed to generate summary.");
        }
      } catch {
        setError("Failed to generate summary. Please try again.");
      }
      setLoading(false);
    };

    fetchSummary();
  }, [patientId]);

  const toggleAccept = (title) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const toggleExpand = (title) => {
    setExpanded((prev) => (prev === title ? null : title));
  };

  const reviewedCount = accepted.size;
  const totalSections = sections.length;
  const confidencePercent =
    dataHealth.confidence === "high" ? "90%" : dataHealth.confidence === "medium" ? "60%" : "30%";

  if (loading) {
    return (
      <div className="ai-summary-layout">
        <div className="ai-summary-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>Generating AI summary…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-summary-layout">
        <div className="ai-summary-center" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-summary-layout">
      {/* Source Documents Panel */}
      <aside className="ai-source-panel">
        <div className="ai-source-header">Source Documents</div>
        <div className="ai-source-list">
          {sections.map((section) => (
            <button className="ai-source-item" key={section.title}>
              <span className="ai-doc-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </span>
              <div className="ai-source-info">
                <div className="ai-source-name">{section.source}</div>
                <div className="ai-source-type">{section.title}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="ai-confidence-footer">
          <div className="ai-confidence-label">AI Confidence</div>
          <div className="ai-confidence-bar">
            <div className="ai-confidence-fill" style={{ width: confidencePercent }} />
          </div>
          <span className="ai-confidence-value">{dataHealth.confidence}</span>
        </div>
      </aside>

      {/* Summary Editor Panel */}
      <div className="ai-summary-center">
        <div className="ai-summary-sticky-header">
          <div>
            <div className="ai-summary-title-row">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2f80ed" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
              <span className="ai-summary-title">AI Clinical Summary</span>
            </div>
            <div className="ai-summary-progress-text">
              {reviewedCount} of {totalSections} sections reviewed
            </div>
          </div>
          <div className="ai-summary-export">
            <div className="ai-progress-bar-mini">
              <div
                className="ai-progress-fill-mini"
                style={{ width: totalSections ? `${(reviewedCount / totalSections) * 100}%` : "0%" }}
              />
            </div>
            <button className="ai-export-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,17 12,21 16,17" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="ai-sections-list">
          {sections.map((section) => {
            const isAccepted = accepted.has(section.title);
            const isExpanded = expanded === section.title;

            return (
              <div
                key={section.title}
                className={`ai-section-card ${isAccepted ? "accepted" : ""} ${isExpanded ? "expanded" : ""}`}
              >
                <button
                  className="ai-section-header"
                  onClick={() => toggleExpand(section.title)}
                >
                  <span className={`ai-section-check ${isAccepted ? "checked" : ""}`}>
                    {isAccepted && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="ai-section-title">{section.title}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`ai-section-chevron ${isExpanded ? "open" : ""}`}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ai-section-body">
                    <div className="ai-section-source">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                      <span>{section.source}</span>
                    </div>
                    <pre className="ai-section-content">{section.content}</pre>
                    {section.chartData && <BiomarkerChart biomarkers={section.chartData} />}
                    <div className="ai-section-actions">
                      <button
                        className={`ai-sec-btn ${isAccepted ? "sec-accepted" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAccept(section.title);
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Accept
                      </button>
                      <button className="ai-sec-btn sec-reject">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Reject
                      </button>
                      <button className="ai-sec-btn">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button className="ai-sec-btn">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23,4 23,10 17,10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Rewrite
                      </button>
                      <button className="ai-sec-btn">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </button>
                      <button className="ai-sec-btn sec-evidence">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Show Evidence
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Actions Panel */}
      <aside className="ai-actions-panel">
        <div className="ai-actions-header">Clinical Actions</div>
        <div className="ai-actions-body">
          <button className="ai-approve-all" onClick={() => setAccepted(new Set(sections.map((s) => s.title)))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Approve All
          </button>

          <div className="ai-review-stats">
            <div className="ai-stats-label">Review Progress</div>
            <div className="ai-stat-row">
              <span>Accepted</span>
              <strong className="emerald">{reviewedCount}</strong>
            </div>
            <div className="ai-stat-row">
              <span>Pending</span>
              <strong className="amber">{totalSections - reviewedCount}</strong>
            </div>
            <div className="ai-stat-row">
              <span>Rejected</span>
              <strong className="red">0</strong>
            </div>
          </div>

          <div className="ai-export-section">
            <div className="ai-export-label">Export</div>
            <button className="ai-export-card">
              <span>📄</span>
              <span className="ai-export-card-text">Export as PDF</span>
            </button>
            <button className="ai-export-card">
              <span>🏥</span>
              <span className="ai-export-card-text">Push to EMR</span>
            </button>
            <button className="ai-export-card">
              <span>🔗</span>
              <span className="ai-export-card-text">Share Secure Link</span>
            </button>
            <button className="ai-export-card">
              <span>🖨️</span>
              <span className="ai-export-card-text">Print Summary</span>
            </button>
          </div>

          {dataHealth.issues?.length > 0 && (
            <div className="ai-flag-card">
              <div className="ai-flag-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Data Health Issues</span>
              </div>
              {dataHealth.issues.map((issue, i) => (
                <p key={i}>
                  <strong>{issue.impact}:</strong> {issue.description}
                </p>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Floating AI Button */}
      <button
        className="ai-fab"
        onClick={() => setAiOpen(!aiOpen)}
        aria-label="AI Assistant"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      </button>
    </div>
  );
}
