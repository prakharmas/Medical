import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { generateMedicalSummary, generateSummaryReport, getUserInfo, listMedicalDocuments, listPatientsDetailed } from "../api/api";
import BiomarkerChart from "../components/BiomarkerChart";

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

const POLL_INTERVAL = 10000;

const STEP_LABELS = {
  processing_documents: "Processing documents",
  starting_plaintext: "Extracting text from documents",
  chunking: "Chunking content",
  embedding: "Generating embeddings",
  retrieval: "Retrieving relevant context",
  generating: "Generating AI summary",
  complete: "Summary complete",
};

function formatStepName(tag) {
  return STEP_LABELS[tag] || tag?.replace(/_/g, " ") || "Working…";
}
export default function AiSummaryPage() {
  const { state } = useLocation();
  const [resolvedId, setResolvedId] = useState(state?.patientId || null);

  const [sections, setSections] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [dataHealth, setDataHealth] = useState({ issues: [], confidence: "low" });
  const [overallRelevance, setOverallRelevance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [progressSteps, setProgressSteps] = useState([]);
  const [polling, setPolling] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [patientsList, setPatientsList] = useState([]);
  const [selectingPatient, setSelectingPatient] = useState(!state?.patientId);
  const [attemptUid, setAttemptUid] = useState("");
  const [userRole, setUserRole] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    if (resolvedId) return;

    listPatientsDetailed()
      .then((res) => {
        const patients = res.data.patients || res.data || [];
        setPatientsList(patients);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError("Failed to load patients.");
      });
  }, [resolvedId]);

  useEffect(() => {
    if (!resolvedId) return;

    let cancelled = false;
    let timer = null;

    const fetchAndPoll = async () => {
      setLoading(true);
      setPolling(true);
      setProgressSteps([]);
      setError("");

      try {
        const docsRes = await listMedicalDocuments(resolvedId);
        if (!cancelled && docsRes.data.documents?.length) {
          setDocuments(docsRes.data.documents);
        }
      } catch { /* non-critical */ }

      const poll = async () => {
        if (cancelled) return;
        try {
          const res = await generateMedicalSummary({ patient_uid: resolvedId });
          if (cancelled) return;

          const data = res.data;

          if (data.progress?.steps?.length) {
            setProgressSteps(data.progress.steps);
            const missing = data.progress.steps.some((s) => s.tag === "documents_missing");
            if (missing) {
              setError("No documents found for this patient. Please upload documents first.");
              setPolling(false);
              setLoading(false);
              return;
            }
          }

          if (data.summary) {
            const built = buildSections(data.summary);
            setSections(built);
            setDataHealth(data.summary.data_health || { issues: [], confidence: "low" });
            setOverallRelevance(data.summary.overall_relevance ?? 0);
            if (data.attempt_uid) setAttemptUid(data.attempt_uid);
            if (built.length > 0) setExpanded(built[0].title);
            setPolling(false);
            setLoading(false);
            return;
          }

          timer = setTimeout(poll, POLL_INTERVAL);
        } catch {
          if (!cancelled) {
            setError("Failed to generate summary. Please try again.");
            setPolling(false);
            setLoading(false);
          }
        }
      };

      poll();
    };

    fetchAndPoll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolvedId, retryKey]);

  useEffect(() => {
    getUserInfo()
      .then((res) => {
        setUserRole(res.data.role_chosen || "");
      })
      .catch(() => {});
  }, []);

  const handleGenerateReport = async (status) => {
    setReportLoading(true);
    setReportSuccess("");
    setReportError("");
    try {
      const res = await generateSummaryReport({
        patient_uid: resolvedId,
        attempt_uid: attemptUid,
        status,
      });
      if (res.data.success) {
        setReportSuccess(`Report ${status === "approved" ? "Approved" : "Flagged"} successfully`);
      } else {
        setReportError(res.data.message || "Failed to generate report");
      }
    } catch {
      setReportError("Failed to generate report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

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

  const selectPatient = (uid) => {
    setResolvedId(uid);
    setSelectingPatient(false);
    setLoading(true);
  };

  const reviewedCount = accepted.size;
  const totalSections = sections.length;
  const confidencePercent = `${Math.round(overallRelevance * 100)}%`;
  const confidenceLabel = overallRelevance >= 0.7 ? "High" : overallRelevance >= 0.4 ? "Medium" : "Low";

  if (selectingPatient && !loading) {
    return (
      <div className="ai-summary-layout">
        <aside className="ai-source-panel" />
        <div className="ai-summary-center">
          <div className="ai-progress-container" style={{ alignItems: "stretch", maxWidth: 480, margin: "0 auto" }}>
            <h3 className="ai-progress-title" style={{ textAlign: "center" }}>Select a Patient</h3>
            <p className="ai-progress-subtitle" style={{ textAlign: "center" }}>Choose a patient to view their AI Summary.</p>
            {patientsList.length === 0 && !error && (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No patients found.</p>
            )}
            {error && (
              <p style={{ textAlign: "center", color: "#ef4444", fontSize: 13 }}>{error}</p>
            )}
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {patientsList.map((p) => {
                const initials = p.name ? p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "??";
                return (
                  <button
                    key={p.uid}
                    onClick={() => selectPatient(p.uid)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                      border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff",
                      cursor: "pointer", textAlign: "left", transition: "0.12s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <span style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#ede9fe",
                      color: "#7c3aed", display: "grid", placeItems: "center",
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {initials}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {p.primary_condition?.diagnosis || "No diagnosis"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <aside className="ai-actions-panel" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-summary-layout">
        <aside className="ai-source-panel" />
        <div className="ai-summary-center">
          <div className="ai-progress-container">
            <div className="ai-progress-spinner" />
            <h3 className="ai-progress-title">Generating AI Summary</h3>
            <p className="ai-progress-subtitle">Analyzing medical data for your report…</p>
            {progressSteps.length > 0 && (
              <div className="ai-progress-steps">
                {progressSteps.slice(-2).map((step, i) => (
                  <div key={i} className="ai-progress-step">
                    <span className="ai-progress-step-dot" />
                    <span className="ai-progress-step-label">{formatStepName(step.tag)}</span>
                    {step.docs_processed != null && step.docs_remaining != null && (
                      <div className="ai-progress-docs">
                        <span className="ai-progress-docs-text">
                          {step.docs_processed} / {step.docs_processed + step.docs_remaining} docs processed
                        </span>
                        <div className="ai-progress-docs-bar">
                          <div
                            className="ai-progress-docs-fill"
                            style={{
                              width: step.docs_processed + step.docs_remaining > 0
                                ? `${(step.docs_processed / (step.docs_processed + step.docs_remaining)) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {step.err && <span className="ai-progress-step-error">{step.err}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="ai-actions-panel" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-summary-layout">
        <aside className="ai-source-panel" />
        <div className="ai-summary-center">
          <div className="ai-progress-container">
            <p style={{ color: "#ef4444", margin: 0, fontSize: 14 }}>{error}</p>
            <button
              onClick={() => { setError(""); setProgressSteps([]); setRetryKey((k) => k + 1); }}
              style={{
                marginTop: 8, padding: "8px 20px", borderRadius: 8,
                border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer",
                fontSize: 13, fontWeight: 500, color: "#334155",
              }}
            >
              Retry
            </button>
          </div>
        </div>
        <aside className="ai-actions-panel" />
      </div>
    );
  }

  return (
    <div className="ai-summary-layout">
      {/* Source Documents Panel */}
      <aside className="ai-source-panel">
        <div className="ai-source-header">Source Documents</div>
        <div className="ai-source-list">
          {documents.length === 0 && (
            <div className="ai-source-empty">No documents uploaded</div>
          )}
          {documents.map((doc) => {
            const ext = doc.mimetype?.split("/").pop()?.toUpperCase() || "FILE";
            return (
              <div className="ai-source-item" key={doc.uid}>
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
                  <div className="ai-source-name">{doc.filename}</div>
                  <div className="ai-source-type">{ext}{doc.num_pages ? ` · ${doc.num_pages} pages` : ""}</div>
                </div>
                <span className={`ai-doc-status ${doc.upload_finished ? "ready" : "processing"}`}>
                  {doc.upload_finished ? "✓" : "◯"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="ai-confidence-footer">
          <div className="ai-confidence-label">AI Confidence</div>
          <div className="ai-confidence-bar">
            <div className="ai-confidence-fill" style={{ width: confidencePercent }} />
          </div>
          <span className="ai-confidence-value">{confidenceLabel}</span>
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
                    {section.chartData ? (
                      <BiomarkerChart biomarkers={section.chartData} />
                    ) : (
                      <pre className="ai-section-content">{section.content}</pre>
                    )}
                    <div className="ai-section-actions">
                      {/* <button
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
                      </button> */}
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
          <div className="ai-export-label">Generate Summary Report</div>
          {userRole === "doctor" && (
            <>
              {reportSuccess && (
                <p style={{ color: "#059669", fontSize: 12, margin: "4px 0" }}>{reportSuccess}</p>
              )}
              {reportError && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0" }}>{reportError}</p>
              )}
              <button
                className="ai-export-card"
                style={{ borderColor: "#059669", color: "#059669" }}
                disabled={reportLoading}
                onClick={() => handleGenerateReport("approved")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="ai-export-card-text">{reportLoading ? "Submitting..." : "Approved"}</span>
              </button>
              <button
                className="ai-export-card"
                style={{ borderColor: "#dc2626", color: "#dc2626" }}
                disabled={reportLoading}
                onClick={() => handleGenerateReport("flagged")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span className="ai-export-card-text">{reportLoading ? "Submitting..." : "Flagged"}</span>
              </button>
            </>
          )}

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
