import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { generateMedicalSummary, generateSummaryReport, getMedicalDocument, getUserInfo, listMedicalDocuments, listPatientsDetailed, stopMedicalSummaryGeneration } from "../api/api";
import BiomarkerChart from "../components/BiomarkerChart";

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtDob(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function fmtAnyDate(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return v;
  if (v > 1e11 && v < 1e14) return fmtDate(v / 1000);
  if (v > 1e9 && v < 1e11) return fmtDate(v);
  return v;
}

function fmtAge(ts) {
  if (!ts) return "";
  const birth = new Date(ts * 1000);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age > 0 ? `${age}` : "";
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

function genericContent(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(fmtAnyDate(value));
  if (Array.isArray(value)) {
    return value
      .map((v) => (v && typeof v === "object" ? Object.entries(v).map(([k, x]) => `${humanizeKey(k)}: ${fmtAnyDate(x)}`).join(", ") : String(fmtAnyDate(v))))
      .join("\n");
  }
  return Object.entries(value)
    .map(([k, v]) => `${humanizeKey(k)}: ${v && typeof v === "object" ? JSON.stringify(v) : fmtAnyDate(v)}`)
    .join("\n");
}

function buildSections(summary) {
  const sections = [];

  const PRIORITY_KEYS = ["clinical_summary", "trends", "dated_medical_events"];

  const formatters = {
    primary_condition: formatPrimaryCondition,
    clinical_summary: formatClinicalSummary,
    medications: formatMedications,
    treatment_regimens: formatTreatmentRegimens,
    active_problems: formatActiveProblems,
    attention_and_alerts: formatAttentionAlerts,
    imaging_and_path: formatImagingAndPath,
    biomarkers: formatBiomarkers,
    verbal_findings: formatVerbalFindings,
    clinical_encounters: formatClinicalEncounters,
    dated_medical_events: formatDatedMedicalEvents,
    undated_medical_events: formatUndatedMedicalEvents,
  };

  const skipKeys = new Set([
    "data_health", "overall_relevance", "confidence", "confidence_score",
    "patient_id", "patient_uid", "attempt_uid", "summary_id", "version",
    "created_at", "updated_at", "progress", "status", "id",
  ]);

  for (const [key, value] of Object.entries(summary || {})) {
    if (skipKeys.has(key) || value == null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    if (typeof value === "string" && !value.trim()) continue;

    const formatter = formatters[key];
    const section = {
      title: humanizeKey(key),
      key,
      content: formatter ? formatter(value) : genericContent(value),
      source: "AI Generated",
      raw: value,
    };
    if (Array.isArray(value)) section.count = value.length;
    if (key === "biomarkers") section.chartData = value;
    sections.push(section);
  }

  sections.sort((a, b) => {
    const ai = PRIORITY_KEYS.indexOf(a.key);
    const bi = PRIORITY_KEYS.indexOf(b.key);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });

  return sections;
}

const POLL_INTERVAL = 10000;

const TITLE_KEYS = [
  "name", "title", "diagnosis", "type", "treatment_regimen", "label",
  "condition", "event", "finding", "test", "problem", "substance",
];
const CHIP_KEYS = [
  "date", "status", "priority", "duration", "trend", "stage_or_severity",
  "code", "dosage", "unit", "response", "best_response", "result",
  "severity", "quantity", "count", "value", "icd_code",
];
const DESC_KEYS = [
  "details", "description", "notes", "info", "current_status", "interpretation",
  "overview", "summary", "narrative", "comments", "recommendation", "advice",
  "diagnosis_overview", "reason_for_stopping",
];

function humanizeKey(k) {
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function collectSources(item) {
  if (!item || typeof item !== "object") return [];
  const collected = [];
  const seen = new Set();
  const add = (s) => {
    if (!s || typeof s !== "object" || !s.doc_id) return;
    const key = `${s.doc_id}:${s.page_index}`;
    if (seen.has(key)) return;
    seen.add(key);
    collected.push(s);
  };
  if (Array.isArray(item.sources)) item.sources.forEach(add);
  for (const v of Object.values(item)) {
    if (Array.isArray(v)) {
      for (const el of v) {
        if (el && typeof el === "object") {
          if (el.source) add(el.source);
          if (Array.isArray(el.sources)) el.sources.forEach(add);
        }
      }
    }
  }
  return collected;
}

function MetricTile({ metric }) {
  const label = metric.label || metric.name || "";
  const prev = metric.prev != null ? Number(metric.prev) : null;
  const curr = metric.current != null ? Number(metric.current) : metric.value != null ? Number(metric.value) : null;
  const unit = metric.unit || "";
  const up = prev != null && curr != null && curr > prev;
  const down = prev != null && curr != null && curr < prev;
  return (
    <div className="ai-alert-metric">
      <span className="ai-alert-metric-label">{label}</span>
      <div className="ai-alert-metric-values">
        {prev != null && <span className="ai-alert-metric-prev">{metric.prev}</span>}
        {up && <span className="ai-alert-metric-trend up">↑</span>}
        {down && <span className="ai-alert-metric-trend down">↓</span>}
        {curr != null && (
          <span className="ai-alert-metric-current">
            {metric.current ?? metric.value}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function ArrayBlock({ values }) {
  const allMetrics = values.every(
    (v) => v && typeof v === "object" && (v.label != null || v.name != null) && (v.current != null || v.value != null),
  );
  if (allMetrics) {
    return (
      <div className="ai-alert-metrics">
        {values.map((m, j) => (
          <MetricTile key={j} metric={m} />
        ))}
      </div>
    );
  }
  return (
    <div className="ai-item-lines">
      {values.map((v, j) => {
        if (v && typeof v === "object") {
          const title = v.title || v.name || v.label || Object.values(v)[0];
          const rest =
            v.info != null
              ? v.info
              : v.value != null
              ? v.value
              : Object.entries(v)
                  .filter(([k]) => k !== (v.title ? "title" : v.name ? "name" : v.label ? "label" : Object.keys(v)[0]))
                  .map(([k, val]) => `${humanizeKey(k)}: ${fmtAnyDate(val)}`)
                  .join(" · ");
          const itemSources = collectSources(v);
          return (
            <div key={j} className="ai-item-line">
              <span className="ai-item-line-title">{String(fmtAnyDate(title))}</span>
              {rest != null && String(rest) !== "" && (
                <span className="ai-item-line-info">{String(fmtAnyDate(rest))}</span>
              )}
              {itemSources.length > 0 && <SourceLinks sources={itemSources} />}
            </div>
          );
        }
        return (
          <div key={j} className="ai-item-line">
            <span className="ai-item-line-info">{String(fmtAnyDate(v))}</span>
          </div>
        );
      })}
    </div>
  );
}

function GenericItemCard({ item }) {
  if (typeof item !== "object" || item === null) {
    return (
      <div className="ai-item-card">
        <span className="ai-item-line-info">{String(item)}</span>
      </div>
    );
  }
  const entries = Object.entries(item).filter(
    ([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
  if (entries.length === 0) return null;

  const titleEntry = entries.find(([k]) => TITLE_KEYS.includes(k));
  const title = titleEntry ? titleEntry[1] : entries[0][1];

  const chips = [];
  const descs = [];
  const arrays = [];
  for (const [k, v] of entries) {
    if (titleEntry && k === titleEntry[0]) continue;
    if (k === "sources" || k === "source") continue;
    if (Array.isArray(v)) {
      arrays.push([k, v]);
    } else if (DESC_KEYS.includes(k) || String(v).length > 60) {
      descs.push(v);
    } else {
      chips.push([k, v]);
    }
  }

  const mergedSources = collectSources(item);

  return (
    <div className="ai-item-card">
      <div className="ai-item-head">
        <span className="ai-item-title">{String(fmtAnyDate(title))}</span>
        {chips.length > 0 && (
          <div className="ai-item-badges">
            {chips.map(([k, v], i) => (
              <span key={i} className="ai-item-badge">{humanizeKey(k)}: {String(fmtAnyDate(v))}</span>
            ))}
          </div>
        )}
      </div>
      {descs.length > 0 && <p className="ai-item-desc">{descs.join("\n")}</p>}
      {arrays.map(([k, arr], i) => (
        <div key={i} className="ai-item-array">
          <span className="ai-item-array-label">{humanizeKey(k)}</span>
          <ArrayBlock values={arr} />
        </div>
      ))}
      {mergedSources.length > 0 && <SourceLinks sources={mergedSources} />}
    </div>
  );
}

async function downloadSourceDocument(docUid) {
  try {
    const res = await getMedicalDocument(docUid);
    const disposition = res.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match ? match[1] : `${docUid}.pdf`;
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    alert("Failed to download source document.");
  }
}

function SourceLinks({ sources }) {
  const [downloading, setDownloading] = useState(null);

  if (!sources?.length) return null;

  const groups = [];
  const byDoc = new Map();
  for (const s of sources) {
    if (!s?.doc_id) continue;
    let g = byDoc.get(s.doc_id);
    if (!g) {
      g = { doc_id: s.doc_id, pages: [] };
      byDoc.set(s.doc_id, g);
      groups.push(g);
    }
    if (Number.isFinite(s.page_index) && !g.pages.includes(s.page_index)) {
      g.pages.push(s.page_index);
    }
  }
  if (!groups.length) return null;

  const handleDownload = async (g) => {
    setDownloading(g.doc_id);
    await downloadSourceDocument(g.doc_id);
    setDownloading(null);
  };

  return (
    <div className="ai-source-links">
      {groups.map((g) => {
        const pages = g.pages.length
          ? ` · ${g.pages.length > 1 ? "Pages" : "Page"} ${g.pages.map((p) => p + 1).join(", ")}`
          : "";
        return (
          <button
            key={g.doc_id}
            className="ai-source-link"
            disabled={downloading === g.doc_id}
            onClick={() => handleDownload(g)}
            title={`${g.doc_id} — click to download source document`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <span>Source PDF{pages}</span>
            {downloading === g.doc_id ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ai-source-spin">
                <path d="M21 12a9 9 0 1 1-6.22-8.56" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,17 12,21 16,17" />
                <line x1="12" y1="12" x2="12" y2="21" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AlertItemsView({ items }) {
  const criticalCount = items.filter(
    (a) => (a.priority || "").toLowerCase() === "critical",
  ).length;

  return (
    <div className="ai-alerts-body">
      <div className="ai-alerts-head">
        <span className="ai-alerts-sub">Prioritized findings</span>
        {criticalCount > 0 && (
          <span className="ai-alerts-critical">{criticalCount} critical</span>
        )}
      </div>
      <div className="ai-alerts-scroll">
        {items.map((a, i) => {
          const priority = (a.priority || "moderate").toLowerCase();
          const title = a.title || a.name || a.diagnosis || Object.values(a)[0] || "Finding";
          const details = a.details || a.description || a.info || a.notes || "";
          return (
            <div key={i} className={`ai-alert-card priority-${priority}`}>
              <div className="ai-alert-top">
                <div className="ai-alert-badges">
                  {a.priority && (
                    <span className={`ai-alert-priority pri-${priority}`}>{a.priority}</span>
                  )}
                  <h4 className="ai-alert-title">{String(title)}</h4>
                </div>
              </div>
              {details && <p className="ai-alert-desc">{details}</p>}
              {a.metrics?.length > 0 && (
                <div className="ai-alert-metrics">
                  {a.metrics.map((m, j) => (
                    <MetricTile key={j} metric={m} />
                  ))}
                </div>
              )}
              <SourceLinks sources={a.sources} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionContentView({ section }) {
  const raw = section.raw;
  const content = section.content;

  if (Array.isArray(raw)) {
    if (raw.length === 0) return <pre className="ai-section-content">{content}</pre>;
    if (raw.some((x) => x && typeof x === "object" && x.priority != null)) {
      return <AlertItemsView items={raw} />;
    }
    const allScalar = raw.every((x) => typeof x !== "object" || x === null);
    if (allScalar) {
      return (
        <div className="ai-item-list">
          {raw.map((x, i) => (
            <div key={i} className="ai-item-card">
              <span className="ai-item-line-info">{String(fmtAnyDate(x))}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="ai-item-list">
        {raw.map((item, i) => (
          <GenericItemCard key={i} item={item} />
        ))}
      </div>
    );
  }

  if (raw && typeof raw === "object") {
    return (
      <div className="ai-item-list">
        <GenericItemCard item={raw} />
      </div>
    );
  }

  return <pre className="ai-section-content">{content || (raw != null ? String(raw) : "")}</pre>;
}

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
  const location = useLocation();
  const { state } = location;
  const [resolvedId, setResolvedId] = useState(state?.patientId || null);
  const prevKeyRef = useRef(location.key);
  const stoppedRef = useRef(false);

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
  const [advOpen, setAdvOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [stopLoading, setStopLoading] = useState(false);
  const [stopStatus, setStopStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (prevKeyRef.current === location.key) return;
    prevKeyRef.current = location.key;
    if (location.state?.patientId) return;
    setSelectingPatient(true);
    setResolvedId(null);
    setSections([]);
    setAccepted(new Set());
    setExpanded(null);
    setError("");
    setProgressSteps([]);
    setAttemptUid("");
    setReportSuccess("");
    setReportError("");
    setPatientSearch("");
  }, [location.key]);

  useEffect(() => {
    listPatientsDetailed()
      .then((res) => {
        const patients = res.data.patients || res.data || [];
        setPatientsList(patients);
        if (resolvedId) {
          setSelectedPatient(patients.find((p) => p.uid === resolvedId) || null);
        } else {
          setLoading(false);
        }
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
    stoppedRef.current = false;
    setStopStatus({ type: "", text: "" });

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
        if (cancelled || stoppedRef.current) return;
        try {
          const res = await generateMedicalSummary({ patient_uid: resolvedId });
          if (cancelled || stoppedRef.current) return;

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
          if (!cancelled && !stoppedRef.current) {
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

  const handleStopGeneration = async () => {
    if (!resolvedId) return;
    setStopLoading(true);
    setStopStatus({ type: "", text: "" });
    try {
      const res = await stopMedicalSummaryGeneration(resolvedId);
      if (res.data?.success) {
        stoppedRef.current = true;
        setPolling(false);
        setLoading(false);
        setError("Summary generation stopped.");
        setStopStatus({ type: "success", text: "Generation stopped." });
      } else {
        setStopStatus({
          type: "error",
          text: res.data?.reason || "Failed to stop generation.",
        });
      }
    } catch (err) {
      setStopStatus({
        type: "error",
        text: err?.response?.data?.reason || err.message || "Failed to stop generation.",
      });
    } finally {
      setStopLoading(false);
    }
  };

  const handleGenerateReport = async (status) => {    setReportLoading(true);
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
    setSelectedPatient(patientsList.find((p) => p.uid === uid) || null);
    setResolvedId(uid);
    setSelectingPatient(false);
    setLoading(true);
  };

  const handleQuickRefresh = (mode) => {
    setSections([]);
    setAccepted(new Set());
    setExpanded(null);
    setReportSuccess("");
    setReportError("");
    setError("");
    setProgressSteps([]);
    setAttemptUid("");
    setRetryKey((k) => k + 1);
  };

  const reviewedCount = accepted.size;
  const totalSections = sections.length;
  const confidencePercent = `${Math.round(overallRelevance * 100)}%`;
  const confidenceLabel = overallRelevance >= 0.7 ? "High" : overallRelevance >= 0.4 ? "Medium" : "Low";

  const patientName = selectedPatient?.name || "";
  const patientInitials = patientName
    ? patientName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";
  const patientMetaBits = [
    selectedPatient?.dob ? `${fmtAge(selectedPatient.dob)} y/o` : "",
    selectedPatient?.gender ? selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1) : "",
    selectedPatient?.dob ? `DOB: ${fmtDob(selectedPatient.dob)}` : "",
    selectedPatient?.uid ? `UHID ${selectedPatient.uid}` : "",
  ].filter(Boolean);
  const alertsSection = sections.find(
    (s) => Array.isArray(s.raw) && s.raw.some((x) => x && typeof x === "object" && x.priority != null),
  );
  const alertsCount = alertsSection?.count || 0;

  const filteredPatients = patientsList.filter((p) =>
    `${p.name} ${p.uid} ${p.primary_condition?.diagnosis || ""} ${p.doctor_name || ""}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase()),
  );

  if (selectingPatient && !loading) {
    return (
      <div className="ai-summary-layout">
        <aside className="ai-source-panel" />
        <div className="ai-summary-center">
          <div className="ai-patient-picker">
            <div className="ai-patient-picker-head">
              <div className="ai-patient-picker-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 className="ai-patient-picker-title">Select a Patient</h3>
                <p className="ai-patient-picker-sub">Choose a patient to generate their AI Clinical Summary</p>
              </div>
            </div>

            <div className="ai-patient-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search by name, UHID, or diagnosis…"
              />
            </div>

            <div className="ai-patient-list-head">
              <span>Patient</span>
              <span>Diagnosis</span>
            </div>

            {patientsList.length === 0 && !error && (
              <p className="ai-patient-empty">No patients found.</p>
            )}
            {error && (
              <p className="ai-patient-empty" style={{ color: "#ef4444" }}>{error}</p>
            )}
            {filteredPatients.length === 0 && patientsList.length > 0 && (
              <p className="ai-patient-empty">No patients match your search.</p>
            )}

            <div className="ai-patient-list">
              {filteredPatients.map((p) => {
                const initials = p.name ? p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "??";
                const birth = p.dob ? new Date(p.dob * 1000) : null;
                let ageStr = "";
                if (birth) {
                  const now = new Date();
                  let age = now.getFullYear() - birth.getFullYear();
                  const m = now.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                  ageStr = age > 0 ? String(age) : "";
                }
                const genderLabel = p.gender === "male" ? "Male" : p.gender === "female" ? "Female" : "Other";
                const metaBits = [
                  ageStr && `${ageStr} yrs`,
                  genderLabel,
                  p.uid && `UHID ${p.uid}`,
                ].filter(Boolean);
                return (
                  <button
                    key={p.uid}
                    className="ai-patient-row"
                    onClick={() => selectPatient(p.uid)}
                  >
                    <span className="ai-patient-avatar">{initials}</span>
                    <span className="ai-patient-main">
                      <span className="ai-patient-name">{p.name}</span>
                      <span className="ai-patient-meta">{metaBits.join(" · ")}</span>
                    </span>
                    <span className="ai-patient-dx">
                      {p.primary_condition?.diagnosis || "No diagnosis"}
                    </span>
                    <svg className="ai-patient-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
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
            {polling && (
              <>
                <button
                  type="button"
                  className="ai-stop-button"
                  onClick={handleStopGeneration}
                  disabled={stopLoading}
                >
                  {stopLoading && <span className="ai-stop-spinner" />}
                  Stop generation
                </button>
                {stopStatus.text && (
                  <p className={`ai-stop-status ${stopStatus.type}`}>{stopStatus.text}</p>
                )}
              </>
            )}
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
      <aside className={`ai-source-panel${sourcesOpen ? " panel-open" : ""}`}>
        <button
          type="button"
          className="ai-source-header ai-panel-toggle"
          onClick={() => setSourcesOpen((v) => !v)}
          aria-expanded={sourcesOpen}
        >
          <span>Source Documents</span>
          <svg className="ai-panel-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
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
              <span className="ai-btn-label">Export</span>
            </button>
            <button
              className="ai-export-btn ai-quick-refresh-btn"
              onClick={() => handleQuickRefresh("refresh")}
              title="Quick refresh"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <span className="ai-btn-label">Quick refresh</span>
            </button>
            <div className="ai-quick-refresh">
              <button
                className="ai-export-btn ai-dots-btn"
                onClick={() => setAdvOpen(!advOpen)}
                title="Advance Action"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {advOpen && (
                <div className="ai-adv-menu">
                  <div className="ai-adv-menu-title">Advance Action</div>
                  <button
                    className="ai-adv-item"
                    onClick={() => {
                      setAdvOpen(false);
                      handleQuickRefresh("rebuild");
                    }}
                  >
                    Rebuild
                  </button>
                  <button
                    className="ai-adv-item"
                    onClick={() => {
                      setAdvOpen(false);
                      handleQuickRefresh("reprocess");
                    }}
                  >
                    Reprocess
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ai-sections-list">
          <div className="ai-disclaimer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              This Summary is AI - Generated based only on the provided documents.
              Final clinical responsibility lies with the treating physician
            </span>
          </div>

          <div className="ai-patient-card">
            <div className="ai-patient-card-avatar">{patientInitials}</div>
            <div className="ai-patient-card-info">
              <p className="ai-patient-card-name">{patientName}</p>
              <p className="ai-patient-card-meta">{patientMetaBits.join(" · ")}</p>
            </div>
            {alertsCount > 0 && (
              <span className="ai-patient-alerts">{alertsCount} Active Alerts</span>
            )}
          </div>

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
                  {section.count != null && (
                    <span className={`ai-section-badge ${section.title === "Medications" ? "active" : ""}`}>
                      {section.title === "Medications" ? `${section.count} active` : section.count}
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`ai-section-chevron ${isExpanded ? "open" : ""}`}>
                    <path d="M4 6l4 4 4-4" />
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
                      <SectionContentView section={section} />
                    )}
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
                      {/* <button className="ai-sec-btn sec-evidence">
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
      <aside className={`ai-actions-panel${actionsOpen ? " panel-open" : ""}`}>
        <button
          type="button"
          className="ai-actions-header ai-panel-toggle"
          onClick={() => setActionsOpen((v) => !v)}
          aria-expanded={actionsOpen}
        >
          <span>Clinical Actions</span>
          <svg className="ai-panel-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
        <div className="ai-actions-body">
          <div className="ai-action-group">
            <button className="ai-approve-all" onClick={() => setAccepted(new Set(sections.map((s) => s.title)))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Approve All
            </button>
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
          </div>

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
