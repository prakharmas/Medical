import { useState, useEffect, useRef } from "react";
import {
  BrainCircuit,
  User,
  Users,
  LayoutDashboard,
  Search,
  Send,
  ChevronDown,
  FileText,
  Download,
  ChartPie,
  Plus,
  Check,
  ShieldCheck,
  Activity,
  Clock,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Square,
} from "lucide-react";
import { getUserInfo, listPatientsDetailed, listChatsDetailed, sendChatMessage, getChatMessages, deleteChats, getStreamingChatMessage, cancelChatMessageStream } from "../api/api";

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

const MODES = [
  {
    id: "single",
    label: "Single Patient",
    icon: User,
    stat: ["2,847", "active patients"],
  },
  {
    id: "cohort",
    label: "Patient Cohort",
    icon: Users,
    stat: ["142", "saved cohorts"],
  },
  {
    id: "analytics",
    label: "Hospital Analytics",
    icon: LayoutDashboard,
    stat: ["98.2%", "data coverage"],
  },
];

const SUGGESTIONS = {
  single: [
    "Summarize Sarah Chen's treatment history",
    "Which labs are trending downward?",
    "List active medications and doses",
    "Any clinical alerts I should know about?",
  ],
  cohort: [
    "How many Stage III breast cancer patients received TCHP?",
    "Which patients had rising creatinine?",
    "Compare outcomes between HER2-positive and HER2-negative patients.",
  ],
  clinical: [
    "Most common diagnosis this month",
    "Chemotherapy completion rate",
    "Most common adverse events",
  ],
  operational: [
    "Average turnaround time for pathology",
    "Hospital utilization trends",
    "Bed occupancy by department",
  ],
  financial: [
    "Average cost per admission by service line",
    "Denial rate trends over the last quarter",
    "Revenue cycle days outstanding",
  ],
  quality: [
    "Readmission rate within 30 days",
    "HCAHPS score trend by unit",
    "Hospital-acquired infection rate",
  ],
};

const ANALYTICS_CATEGORIES = [
  { id: "clinical", label: "Clinical", icon: Activity },
  { id: "operational", label: "Operational", icon: Clock },
  { id: "financial", label: "Financial", icon: Wallet },
  { id: "quality", label: "Quality", icon: ShieldCheck },
];

const MOCK_PATIENTS = [
  { uid: "p-chen", name: "Sarah Chen", initials: "SC", diagnosis: "Breast Cancer · Stage III", alert: true, age: 54, gender: "Female" },
  { uid: "p-roy", name: "Anil Roy", initials: "AR", diagnosis: "Lung Cancer · Stage IV", alert: true, age: 61, gender: "Male" },
  { uid: "p-kaur", name: "Meera Kaur", initials: "MK", diagnosis: "Ovarian Cancer · Stage II", alert: false, age: 47, gender: "Female" },
  { uid: "p-varma", name: "Ravi Varma", initials: "RV", diagnosis: "Colorectal · Stage III", alert: false, age: 58, gender: "Male" },
  { uid: "p-iyer", name: "Lakshmi Iyer", initials: "LI", diagnosis: "Cervical · Stage IB", alert: true, age: 42, gender: "Female" },
  { uid: "p-das", name: "Sneha Das", initials: "SD", diagnosis: "Breast Cancer · Stage II", alert: false, age: 38, gender: "Female" },
];

const PATIENT_CONTEXT = {
  "p-chen": {
    diagnosis: ["HER2+ Breast Cancer", "Stage IIIA", "NST · invasive ductal"],
    alerts: [
      { label: "Hemoglobin dropping", level: "high" },
      { label: "Peripheral neuropathy", level: "moderate" },
    ],
    medications: [
      { name: "Trastuzumab", dose: "8 mg/kg · q3w", status: "active" },
      { name: "Pertuzumab", dose: "840 mg · q3w", status: "active" },
      { name: "Olanzapine", dose: "5 mg · PRN", status: "as needed" },
    ],
    labs: [
      { name: "Hemoglobin", value: "9.2", unit: "g/dL", trend: "down", change: "-0.8" },
      { name: "eGFR", value: "72", unit: "mL/min", trend: "down", change: "-4" },
      { name: "Neutrophils", value: "3.4", unit: "K/µL", trend: "up", change: "+0.5" },
      { name: "ALT", value: "38", unit: "U/L", trend: "up", change: "+6" },
    ],
  },
  "p-roy": {
    diagnosis: ["NSCLC", "Stage IV", "EGFR T790M+"],
    alerts: [{ label: "Pleural effusion on CT", level: "high" }],
    medications: [
      { name: "Osimertinib", dose: "80 mg · OD", status: "active" },
      { name: "Morphine SR", dose: "30 mg · BID", status: "active" },
    ],
    labs: [
      { name: "Platelets", value: "118", unit: "K/µL", trend: "down", change: "-22" },
      { name: "CRP", value: "64", unit: "mg/L", trend: "up", change: "+18" },
    ],
  },
  "p-kaur": {
    diagnosis: ["High-grade serous", "Stage IIB", "BRCA negative"],
    alerts: [],
    medications: [
      { name: "Carboplatin", dose: "AUC 5 · q3w", status: "active" },
      { name: "Paclitaxel", dose: "175 mg/m² · q3w", status: "active" },
    ],
    labs: [
      { name: "CA-125", value: "42", unit: "U/mL", trend: "down", change: "-38" },
      { name: "Hb", value: "10.8", unit: "g/dL", trend: "down", change: "-0.4" },
    ],
  },
  "p-varma": {
    diagnosis: ["Colorectal", "Stage IIIB", "MSI-H"],
    alerts: [{ label: "Diarrhea grade 2", level: "moderate" }],
    medications: [
      { name: "Pembrolizumab", dose: "200 mg · q3w", status: "active" },
      { name: "Loperamide", dose: "2 mg · PRN", status: "as needed" },
    ],
    labs: [
      { name: "CEA", value: "9.1", unit: "ng/mL", trend: "up", change: "+1.4" },
      { name: "Bilirubin", value: "1.1", unit: "mg/dL", trend: "flat", change: "0" },
    ],
  },
  "p-iyer": {
    diagnosis: ["Squamous cell", "Stage IB", "HPV+"],
    alerts: [{ label: "Creatinine elevated", level: "high" }],
    medications: [
      { name: "Cisplatin", dose: "40 mg/m² · qw", status: "active" },
      { name: "Ondansetron", dose: "8 mg · PRN", status: "as needed" },
    ],
    labs: [
      { name: "Creatinine", value: "1.6", unit: "mg/dL", trend: "up", change: "+0.3" },
      { name: "WBC", value: "4.1", unit: "K/µL", trend: "down", change: "-1.2" },
    ],
  },
  "p-das": {
    diagnosis: ["Luminal A", "Stage IIA", "ER+ / PR+"],
    alerts: [],
    medications: [
      { name: "Letrozole", dose: "2.5 mg · OD", status: "active" },
      { name: "Denosumab", dose: "60 mg · q6m", status: "active" },
    ],
    labs: [
      { name: "Estradiol", value: "<5", unit: "pg/mL", trend: "down", change: "—" },
      { name: "Vitamin D", value: "31", unit: "ng/mL", trend: "up", change: "+6" },
    ],
  },
};

const COHORT_FILTERS = [
  { id: "cancer", label: "Cancer Type", options: ["Breast", "Lung", "Ovarian", "Colorectal", "Cervical"] },
  { id: "stage", label: "Stage", options: ["Stage I", "Stage II", "Stage III", "Stage IV"] },
  { id: "age", label: "Age", options: ["< 40", "40–60", "> 60"] },
  { id: "gender", label: "Gender", options: ["Female", "Male"] },
  { id: "treatment", label: "Treatment", options: ["TCHP", "Platinum", "Immunotherapy", "Hormonal"] },
  { id: "hospital", label: "Hospital", options: ["City General", "St. Mary's", "Northside"] },
];

const RECENT_ACTIVITY = [
  { mode: "Single Patient — Sarah Chen", time: "10 min ago" },
  { mode: "Cohort — Stage III HER2+ Breast Cancer", time: "1 hr ago" },
  { mode: "Hospital Analytics — Q3 Utilization Report", time: "Yesterday" },
];

/* ------------------------------------------------------------------ */
/* Mock AI                                                             */
/* ------------------------------------------------------------------ */

function mockAnswer(mode, query) {
  const q = query.toLowerCase();
  const fallbacks = {
    single:
      "Here's the clinical picture for this patient:\n\n• Diagnosis — HER2-positive invasive ductal carcinoma, Stage IIIA, with nodal involvement.\n• Treatment course — received neoadjuvant TCHP, now on maintenance trastuzumab + pertuzumab.\n• Current concern — hemoglobin trending down (9.2 g/dL) and grade 1 peripheral neuropathy.\n• Recommendation — recheck CBC at next cycle; consider transfusion threshold review if Hb < 8.",
    cohort:
      "From the selected cohort:\n\n• 43 patients matched the active filters (Stage III breast cancer).\n• 29 received a TCHP-based regimen; 18 completed 6 cycles.\n• 12 patients showed a pCR on pathology.\n• Median time on treatment was 4.6 months.\n\nYou can add filters to narrow by age, stage, or biomarker status.",
    clinical:
      "For this month across the hospital:\n\n• Most common diagnosis — breast cancer (18.2% of admissions).\n• Top 3 — breast, lung, colorectal.\n• Chemotherapy completion rate — 86% (up 2 pts MoM).\n• Adverse events — 24 reported, most common being febrile neutropenia (6).",
    operational:
      "Operational summary for the selected window:\n\n• Pathology turnaround — 2.1 days average (target 3).\n• Bed occupancy — 87%, peak on Thursdays.\n• Average consult-to-treatment time — 6.4 days.\n• Utilization is trending up 3.1% week-over-week.",
    financial:
      "Financial insight for the quarter:\n\n• Avg cost per admission — ₹1.42L (oncology).\n• Claim denial rate — 9.8% (down 1.2 pts).\n• Days in AR — 41.\n• Highest-revenue service line — radiation oncology.",
    quality:
      "Quality snapshot for the period:\n\n• 30-day readmission — 12.4% (target < 15%).\n• HCAHPS overall rating — 86 (up 2 MoM).\n• HAIs — 3 per 1,000 patient-days.\n• Falls with injury — 2 incidents.",
  };
  let answer = fallbacks[mode];
  if (mode === "single" && q.includes("alert")) {
    answer =
      "Two clinical alerts require attention:\n\n• Hemoglobin — dropping to 9.2 g/dL (critical, trending down).\n• Peripheral neuropathy — grade 1, ongoing with taxane exposure.\n\nRecommend CBC with differential and a neurology consult if symptoms progress.";
  } else if (mode === "single" && q.includes("medication")) {
    answer =
      "Active medications:\n\n• Trastuzumab — 8 mg/kg IV q3w (maintenance).\n• Pertuzumab — 840 mg IV q3w (maintenance).\n• Olanzapine — 5 mg PRN for nausea.\n\nNo dose modifications indicated at this time.";
  } else if (mode === "single" && q.includes("lab")) {
    answer =
      "Recent labs (last 30 days):\n\n• Hemoglobin — 9.2 g/dL (↓ -0.8, trending down).\n• eGFR — 72 mL/min (↓ -4).\n• Neutrophils — 3.4 K/µL (stable).\n• ALT — 38 U/L (mild elevation).\n\nHemoglobin is the priority trend to watch.";
  }
  const evidence =
    mode === "single"
      ? ["doc_4820.pdf · p.3", "Labs 2024-06 · eGFR", "Clinical notes 05/12"]
      : mode === "cohort"
      ? ["cohort: 43 patients", "EHR subset · Jan–Jun 2024"]
      : ["Claims · Q2 2024", "EHR admissions · Jun 2024"];
  return { answer, confidence: 82 + Math.round(Math.random() * 15), evidence };
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function AiActions() {
  const [done, setDone] = useState({});
  const actions = [
    { id: "export", label: "Export", icon: Download },
    { id: "report", label: "Create Report", icon: FileText },
    { id: "records", label: "View Records", icon: Search },
    { id: "visualize", label: "Visualize", icon: ChartPie },
    { id: "dashboard", label: "Add to Dashboard", icon: Plus },
  ];
  return (
    <div className="ci-actions">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            className={`ci-action ${done[a.id] ? "done" : ""}`}
            onClick={() => setDone((d) => ({ ...d, [a.id]: true }))}
          >
            {done[a.id] ? <Check size={12} /> : <Icon size={12} />}
            {done[a.id] ? "Done" : a.label}
          </button>
        );
      })}
    </div>
  );
}

function AiMessage({ msg }) {
  if (msg.role === "user") {
    return <div className="ci-msg ci-msg-user">{msg.text}</div>;
  }
  const conf = msg.confidence;
  return (
    <div className="ci-msg ci-msg-ai">
      <p className="ci-answer">
        {msg.answer}
        {msg.streaming && <span className="ci-cursor" />}
      </p>
      <div className="ci-conf-row">
        <span className="ci-conf-label">Confidence</span>
        <div className="ci-conf-bar">
          <div className="ci-conf-fill" style={{ width: `${conf}%` }} />
        </div>
        <span className="ci-conf-pct">{conf}%</span>
      </div>
      <div className="ci-evidence">
        {msg.evidence.map((e, i) => (
          <span key={i} className="ci-ev-tag">{e}</span>
        ))}
      </div>
      <AiActions />
    </div>
  );
}

function extractStreamText(d) {
  const unwrap = (o) => {
    if (typeof o?.content === "string") return o.content;
    if (typeof o?.text === "string") return o.text;
    if (typeof o?.answer === "string") return o.answer;
    if (typeof o?.chunk === "string") return o.chunk;
    if (typeof o?.delta === "string") return o.delta;
    if (typeof o?.partial === "string") return o.partial;
    if (o?.message && typeof o.message.content === "string") return o.message.content;
    if (o?.info && typeof o.info.content === "string") return o.info.content;
    if (o?.data) return unwrap(o.data);
    return null;
  };
  return unwrap(d);
}

function isStreamDone(d) {
  return (
    d.success === false ||
    d.completed === true ||
    d.done === true ||
    d.finished === true ||
    d.is_final === true ||
    d.info?.done === true ||
    d.info?.interrupted === true
  );
}

function ChatPanel({ suggestions, placeholder, chatUid, onChatUpdated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatUidRef = useRef(chatUid || null);
  const bodyRef = useRef(null);
  const streamTimerRef = useRef(null);
  const streamCtlRef = useRef({ stopped: true });

  const clearStreamTimer = () => {
    if (streamTimerRef.current) {
      clearTimeout(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing, loadingChat]);

  useEffect(() => {
    return () => {
      streamCtlRef.current.stopped = true;
      clearStreamTimer();
    };
  }, []);

  useEffect(() => {
    streamCtlRef.current.stopped = true;
    clearStreamTimer();
    setStreaming(false);
    setLoadingChat(false);
    if (!chatUid) {
      chatUidRef.current = null;
      setMessages([]);
      return;
    }
    chatUidRef.current = chatUid;
    setMessages([]);
    setLoadingChat(true);
    getChatMessages({ chat_uid: chatUid })
      .then((res) => {
        if (res.data.success) {
          const list = (res.data.messages || []).map((m) =>
            m.speaker === "user"
              ? { role: "user", text: m.content }
              : { role: "ai", answer: m.content, confidence: 90, evidence: [] },
          );
          setMessages(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChat(false));
  }, [chatUid]);

  const pollStream = (chatUid, q) => {
    streamCtlRef.current = { stopped: false };
    let attempts = 0;
    let last = "";

    const upsertAi = (answer) => {
      setTyping(false);
      setMessages((m) => {
        const idx = m.findIndex((x) => x.role === "ai" && x.streaming);
        if (idx >= 0) {
          const copy = [...m];
          copy[idx] = { ...copy[idx], answer, streaming: true };
          return copy;
        }
        return [...m, { role: "ai", answer, streaming: true, confidence: 90, evidence: [] }];
      });
    };

    const finalize = () => {
      streamCtlRef.current.stopped = true;
      clearStreamTimer();
      setStreaming(false);
      setTyping(false);
      setMessages((m) => {
        if (m.some((x) => x.role === "ai")) {
          return m.map((x) => (x.streaming ? { ...x, streaming: false } : x));
        }
        return [...m, { role: "ai", ...mockAnswer("single", q) }];
      });
      if (onChatUpdated) onChatUpdated();
    };

    const tick = () => {
      if (streamCtlRef.current.stopped) return;
      getStreamingChatMessage({ chat_uid: chatUid })
        .then((res) => {
          if (streamCtlRef.current.stopped) return;
          const d = res.data || {};
          const text = extractStreamText(d);
          if (typeof text === "string" && text.length > 0) {
            last = text;
            upsertAi(text);
            attempts = 0;
          }
          if (isStreamDone(d)) {
            finalize();
            return;
          }
          attempts += 1;
          if (attempts >= 50) {
            finalize();
            return;
          }
          streamTimerRef.current = setTimeout(tick, 500);
        })
        .catch(() => {
          if (streamCtlRef.current.stopped) return;
          attempts += 1;
          if (attempts >= 50) finalize();
          else streamTimerRef.current = setTimeout(tick, 500);
        });
    };

    setStreaming(true);
    streamTimerRef.current = setTimeout(tick, 400);
  };

  const send = (text) => {
    const q = (text || input).trim();
    if (!q || typing || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setTyping(true);

    sendChatMessage({
      chat_uid: chatUidRef.current,
      content: q,
      preset_uid: null,
    })
      .then((res) => {
        if (res.data.success && res.data.chat_uid) {
          chatUidRef.current = res.data.chat_uid;
        }
        pollStream(chatUidRef.current, q);
      })
      .catch(() => {
        setTyping(false);
        setMessages((m) => [...m, { role: "ai", ...mockAnswer("single", q) }]);
      });
  };

  const handleStop = () => {
    streamCtlRef.current.stopped = true;
    clearStreamTimer();
    cancelChatMessageStream({ chat_uid: chatUidRef.current }).catch(() => {});
    setStreaming(false);
    setTyping(false);
    setMessages((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
  };

  return (
    <section className="ci-chat">
      <div className="ci-chat-head">
        <div className="ci-chat-title">
          <BrainCircuit size={15} strokeWidth={2} />
          <span>Conversation</span>
        </div>
        <div className="ci-chat-head-right">
          {streaming && (
            <button className="ci-stop" onClick={handleStop}>
              <Square size={12} />
              Stop generating
            </button>
          )}
          {/* <span className="ci-chat-badge">Copilot</span> */}
        </div>
      </div>
      <div className="ci-chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="ci-chat-empty">
            <div className="ci-chat-empty-icon">
              <BrainCircuit size={22} strokeWidth={1.8} />
            </div>
            <p>Ask anything about this patient, cohort, or hospital data.</p>
            <span>Answers include confidence scores, evidence, and one-click actions.</span>
          </div>
        )}
        {messages.map((m, i) => (
          <AiMessage key={i} msg={m} />
        ))}
        {loadingChat && (
          <div className="ci-msg ci-msg-ai">
            <div className="ci-typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        {typing && (
          <div className="ci-msg ci-msg-ai">
            <div className="ci-typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>
      <div className="ci-suggest">
        {suggestions.map((s, i) => (
          <button key={i} className="ci-suggest-chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="ci-input-row">
        <input
          className="ci-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={placeholder || "Ask a question…"}
        />
        <button className="ci-send" onClick={() => send()} aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </section>
  );
}

function Panel({ title, children, right }) {
  return (
    <aside className="ci-panel">
      <div className="ci-panel-head">
        <span>{title}</span>
        {right}
      </div>
      <div className="ci-panel-body">{children}</div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Single Patient mode                                                 */
/* ------------------------------------------------------------------ */

function SinglePatientWorkspace() {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("p-chen");

  useEffect(() => {
    listPatientsDetailed()
      .then((res) => {
        const list = res.data.patients || res.data || [];
        if (list.length) {
          setPatients(
            list.map((p, i) => ({
              uid: p.uid,
              name: p.name,
              initials: p.name
                ? p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                : "??",
              diagnosis: p.primary_condition?.diagnosis || "General",
              alert: false,
              age: "",
              gender: p.gender || "",
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const filtered = patients.filter((p) =>
    `${p.name} ${p.diagnosis}`.toLowerCase().includes(query.toLowerCase()),
  );
  const ctx = PATIENT_CONTEXT[selected] || Object.values(PATIENT_CONTEXT)[0];
  const sel = patients.find((p) => p.uid === selected);

  return (
    <div className="ci-mode-content">
      <Panel title="Patients">
        <div className="ci-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients…"
          />
        </div>
        <div className="ci-patient-list">
          {filtered.map((p) => (
            <button
              key={p.uid}
              className={`ci-patient-row ${selected === p.uid ? "selected" : ""}`}
              onClick={() => setSelected(p.uid)}
            >
              <span className="ci-avatar">{p.initials}</span>
              <span className="ci-patient-info">
                <span className="ci-patient-name">{p.name}</span>
                <span className="ci-patient-sub">{p.diagnosis}</span>
              </span>
              {p.alert && <span className="ci-alert-dot" title="Clinical alert" />}
            </button>
          ))}
          {filtered.length === 0 && <p className="ci-panel-empty">No patients match.</p>}
        </div>
      </Panel>

      <ChatPanel suggestions={SUGGESTIONS.single} placeholder="Ask about this patient…" />

      <Panel title={sel ? sel.name : "Patient Context"}>
        {ctx && (
          <>
            <div className="ci-ctx-section">
              <p className="ci-ctx-label">Diagnosis</p>
              <div className="ci-tag-row">
                {ctx.diagnosis.map((d, i) => (
                  <span key={i} className="ci-tag blue">{d}</span>
                ))}
              </div>
            </div>
            <div className="ci-ctx-section">
              <p className="ci-ctx-label">Clinical Alerts</p>
              {ctx.alerts.length === 0 && <p className="ci-ctx-muted">No active alerts</p>}
              {ctx.alerts.map((a, i) => (
                <div key={i} className="ci-alert-row">
                  <AlertTriangle size={13} />
                  <span>{a.label}</span>
                  <b className={`ci-alert-lvl ${a.level}`}>{a.level}</b>
                </div>
              ))}
            </div>
            <div className="ci-ctx-section">
              <p className="ci-ctx-label">Medications</p>
              {ctx.medications.map((m, i) => (
                <div key={i} className="ci-ctx-item">
                  <span className="ci-ctx-main">
                    <b>{m.name}</b>
                    <small>{m.dose}</small>
                  </span>
                  <span className="ci-tag soft">{m.status}</span>
                </div>
              ))}
            </div>
            <div className="ci-ctx-section">
              <p className="ci-ctx-label">Recent Labs</p>
              {ctx.labs.map((l, i) => (
                <div key={i} className="ci-ctx-item">
                  <span className="ci-ctx-main">
                    <b>{l.name}</b>
                    <small>{l.value} {l.unit}</small>
                  </span>
                  <span className={`ci-trend ${l.trend}`}>
                    {l.trend === "up" ? <TrendingUp size={12} /> : l.trend === "down" ? <TrendingDown size={12} /> : null}
                    {l.change}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Patient Cohort mode                                                 */
/* ------------------------------------------------------------------ */

function fmtChatDate(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CohortWorkspace() {
  const [active, setActive] = useState({});
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);

  const refreshChats = () => {
    listChatsDetailed()
      .then((res) => {
        if (res.data.success) setChats(res.data.chats || []);
      })
      .catch(() => {})
      .finally(() => setChatsLoading(false));
  };

  useEffect(() => {
    refreshChats();
  }, []);

  const toggle = (gid, opt) => {
    setActive((prev) => {
      const list = prev[gid] || [];
      return {
        ...prev,
        [gid]: list.includes(opt) ? list.filter((o) => o !== opt) : [...list, opt],
      };
    });
  };

  const totalApplied = Object.values(active).reduce((n, a) => n + (a ? a.length : 0), 0);
  const matched = 43 + totalApplied * 7;

  const handleDelete = (uid) => {
    deleteChats({ chat_uids: [uid] })
      .then((res) => {
        if (res.data.success) {
          setChats((prev) => prev.filter((c) => c.uid !== uid));
          if (selectedChat?.uid === uid) setSelectedChat(null);
        }
      })
      .catch(() => {});
  };

  const startNewChat = () => setSelectedChat(null);

  const distribution = [
    { label: "Stage III", value: 61 },
    { label: "Stage II", value: 24 },
    { label: "Stage IV", value: 15 },
  ];
  const responses = [
    { label: "pCR", value: 28 },
    { label: "Partial", value: 47 },
    { label: "Stable", value: 18 },
    { label: "Progressed", value: 7 },
  ];

  return (
    <div className="ci-mode-content">
      {/*
      <Panel title="Advanced Filters">
        {COHORT_FILTERS.map((g) => (
          <div key={g.id} className="ci-filter-group">
            <p className="ci-filter-label">{g.label}</p>
            <div className="ci-filter-chips">
              {g.options.map((o) => (
                <button
                  key={o}
                  className={`ci-filter-chip ${(active[g.id] || []).includes(o) ? "active" : ""}`}
                  onClick={() => toggle(g.id, o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="ci-filter-group">
          <p className="ci-filter-label">Date Range</p>
          <div className="ci-date-row">
            <input type="date" className="ci-date-input" defaultValue="2024-01-01" />
            <input type="date" className="ci-date-input" defaultValue="2024-06-30" />
          </div>
        </div>
      </Panel>
      */}

      <Panel
        title="Chats"
        right={
          <button className="ci-new-chat-btn" onClick={startNewChat}>
            <Plus size={13} />
            New chat
          </button>
        }
      >
        {chatsLoading && <p className="ci-panel-empty">Loading chats…</p>}
        {!chatsLoading && chats.length === 0 && <p className="ci-panel-empty">No chats yet.</p>}
        <div className="ci-chat-list">
          {chats.map((c) => (
            <div
              key={c.uid}
              className={`ci-chat-row ${selectedChat?.uid === c.uid ? "selected" : ""}`}
              onClick={() => setSelectedChat(c)}
            >
              <span className="ci-chat-title">{c.title || "Untitled conversation"}</span>
              <span className="ci-chat-meta">
                <span>{c.num_messages} messages</span>
                <span>{fmtChatDate(c.ts)}</span>
                {c.is_mock && <span className="ci-tag soft">mock</span>}
                <button
                  className="ci-chat-del"
                  aria-label="Delete chat"
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.uid);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <ChatPanel
        suggestions={SUGGESTIONS.cohort}
        placeholder="Ask about this cohort…"
        chatUid={selectedChat?.uid}
        onChatUpdated={refreshChats}
      />

      <Panel title="Cohort Summary">
        <div className="ci-kpi">
          <span>Patients selected</span>
          <b>{matched}</b>
        </div>
        <div className="ci-kpi">
          <span>Filters applied</span>
          <b>{totalApplied}</b>
        </div>
        <div className="ci-kpi">
          <span>Median follow-up</span>
          <b>14 mo</b>
        </div>
        <div className="ci-ctx-section">
          <p className="ci-ctx-label">Stage Distribution</p>
          {distribution.map((d, i) => (
            <div key={i} className="ci-bar-row">
              <span className="ci-bar-label">{d.label}</span>
              <div className="ci-bar-track">
                <div className="ci-bar-fill" style={{ width: `${d.value}%` }} />
              </div>
              <span className="ci-bar-val">{d.value}%</span>
            </div>
          ))}
        </div>
        <div className="ci-ctx-section">
          <p className="ci-ctx-label">Best Response</p>
          {responses.map((r, i) => (
            <div key={i} className="ci-bar-row">
              <span className="ci-bar-label">{r.label}</span>
              <div className="ci-bar-track">
                <div className="ci-bar-fill soft" style={{ width: `${r.value}%` }} />
              </div>
              <span className="ci-bar-val">{r.value}%</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hospital Analytics mode                                             */
/* ------------------------------------------------------------------ */

const ANALYTICS_KPIS = [
  { label: "Admissions", value: "1,284", delta: "+3.1%", up: true },
  { label: "Avg LOS", value: "4.2d", delta: "-0.3d", up: false },
  { label: "Readmission", value: "12.4%", delta: "-0.8%", up: false },
  { label: "Occupancy", value: "87%", delta: "+2pts", up: true },
];

const TOP_DIAGNOSES = [
  { label: "Breast cancer", value: 234, mom: "+4.2%", up: true },
  { label: "Lung cancer", value: 188, mom: "-1.1%", up: false },
  { label: "Colorectal", value: 141, mom: "+2.0%", up: true },
  { label: "Ovarian", value: 96, mom: "+6.3%", up: true },
];

const QUICK_INSIGHTS = [
  { tone: "good", text: "Chemotherapy completion rate up 2 pts MoM." },
  { tone: "warn", text: "Febrile neutropenia cases up 3 this month." },
  { tone: "info", text: "Pathology turnaround improved to 2.1 days." },
];

function AnalyticsWorkspace() {
  const [category, setCategory] = useState("clinical");
  const cat = ANALYTICS_CATEGORIES.find((c) => c.id === category);
  const suggestions = SUGGESTIONS[category];

  return (
    <div className="ci-mode-content">
      <Panel title="Analytics Categories">
        <div className="ci-cat-list">
          {ANALYTICS_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                className={`ci-cat-item ${category === c.id ? "active" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <span className="ci-cat-icon"><Icon size={15} /></span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
        <div className="ci-cat-hint">
          <p className="ci-ctx-label">Context</p>
          <p className="ci-ctx-muted">Answers reference live hospital data for the {cat?.label.toLowerCase()} domain.</p>
        </div>
      </Panel>

      <ChatPanel suggestions={suggestions} placeholder={`Ask about ${cat?.label.toLowerCase()} data…`} />

      <Panel title="KPIs & Insights">
        <div className="ci-kpi-grid">
          {ANALYTICS_KPIS.map((k, i) => (
            <div key={i} className="ci-kpi mini">
              <span>{k.label}</span>
              <b>{k.value}</b>
              <em className={k.up ? "up" : "down"}>
                {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {k.delta}
              </em>
            </div>
          ))}
        </div>
        <div className="ci-ctx-section">
          <p className="ci-ctx-label">Top Diagnoses · MoM</p>
          {TOP_DIAGNOSES.map((d, i) => (
            <div key={i} className="ci-bar-row">
              <span className="ci-bar-label">{d.label}</span>
              <div className="ci-bar-track">
                <div className="ci-bar-fill" style={{ width: `${(d.value / 240) * 100}%` }} />
              </div>
              <span className={`ci-mom ${d.up ? "up" : "down"}`}>
                {d.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {d.mom}
              </span>
            </div>
          ))}
        </div>
        <div className="ci-ctx-section">
          <p className="ci-ctx-label">Quick Insights</p>
          {QUICK_INSIGHTS.map((q, i) => (
            <div key={i} className={`ci-insight ${q.tone}`}>
              <span className="ci-insight-dot" />
              <span>{q.text}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Landing + workspace shell                                           */
/* ------------------------------------------------------------------ */

function LandingView({ onOpen }) {
  return (
    <div className="ci-landing">
      <div className="ci-ai-badge-row">
        <div className="ci-ai-badge">
          <BrainCircuit size={20} strokeWidth={1.8} />
        </div>
        <span className="ci-ai-kicker">AI Workspace</span>
      </div>
      <h1>ClinIQ Intelligence</h1>
      <p className="ci-landing-sub">
        Ask questions about patients, cohorts, or your hospital's clinical data. Powered by
        enterprise AI trained on oncology protocols.
      </p>

      <div className="ci-cards">
        {MODES.map((m) => {
          const Icon = m.icon;
          const desc = {
            single:
              "Analyze one patient's full medical record using natural language. Surface lab trends, treatment history, and clinical alerts instantly.",
            cohort:
              "Compare multiple patients using advanced filters and AI. Identify patterns, compare outcomes, and drive protocol decisions.",
            analytics:
              "Generate insights across departments, diagnoses, treatments, and outcomes. Your hospital's data, made conversational.",
          }[m.id];
          return (
            <div key={m.id} className="ci-card">
              <div className="ci-card-icon"><Icon size={26} strokeWidth={1.8} /></div>
              <div>
                <h3>{m.label}</h3>
                <p>{desc}</p>
              </div>
              <div className="ci-card-stat">
                <b>{m.stat[0]}</b>
                <span>{m.stat[1]}</span>
              </div>
              <button className="ci-card-btn" onClick={() => onOpen(m.id)}>
                Open Workspace
              </button>
            </div>
          );
        })}
      </div>

      <div className="ci-activity">
        <h2>Recent Activity</h2>
        <div className="ci-activity-list">
          {RECENT_ACTIVITY.map((a, i) => (
            <button key={i} className="ci-activity-row">
              <span className="ci-activity-inner">
                <span className="ci-activity-dot" />
                <span>{a.mode}</span>
              </span>
              <span className="ci-activity-time">{a.time}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkspaceView({ mode, setMode, onBack }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const current = MODES.find((m) => m.id === mode);

  return (
    <div className="ci-workspace">
      <div className="ci-toolbar">
        <div className="ci-mode-crumb">
          <button className="ci-crumb-root" onClick={onBack}>
            <BrainCircuit size={15} strokeWidth={2} />
            ClinIQ Intelligence
          </button>
          <span className="ci-crumb-sep">/</span>
          <div className="ci-mode-dropdown">
            <button className="ci-mode-btn" onClick={() => setMenuOpen((o) => !o)}>
              {current && <current.icon size={14} />}
              <span>{current?.label}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="ci-mode-menu">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    className={`ci-mode-item ${mode === m.id ? "active" : ""}`}
                    onClick={() => {
                      setMode(m.id);
                      setMenuOpen(false);
                    }}
                  >
                    <m.icon size={15} />
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ci-toolbar-meta">
          <span className="ci-live-dot" />
          Live hospital data
        </div>
      </div>

      {mode === "single" && <SinglePatientWorkspace />}
      {mode === "cohort" && <CohortWorkspace />}
      {mode === "analytics" && <AnalyticsWorkspace />}
    </div>
  );
}

export default function IntelligencePage() {
  const [view, setView] = useState("landing");
  const [mode, setMode] = useState("single");
  const [role, setRole] = useState("");
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    getUserInfo()
      .then((res) => {
        setRole(res.data.role_chosen || "");
      })
      .catch(() => {})
      .finally(() => setRoleLoaded(true));
  }, []);

  if (!roleLoaded) return null;
  if (role !== "doctor") {
    return (
      <div className="ci-access-denied">
        <div className="ci-ai-badge">
          <ShieldCheck size={20} strokeWidth={1.8} />
        </div>
        <h1>ClinIQ Intelligence</h1>
        <p>This workspace is available to doctors only. Contact your administrator for access.</p>
      </div>
    );
  }

  return (
    <div className="ci-page">
      <style>{CI_CSS}</style>
      {view === "landing" ? (
        <LandingView onOpen={(id) => { setMode(id); setView("workspace"); }} />
      ) : (
        <WorkspaceView mode={mode} setMode={setMode} onBack={() => setView("landing")} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const CI_CSS = `
.ci-page { min-height: calc(100vh - 140px); }
.ci-access-denied { max-width: 420px; margin: 80px auto; text-align: center; padding: 40px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 3px 12px rgba(28,53,88,.04); }
.ci-access-denied h1 { font-size: 22px; color: #0f172a; margin: 16px 0 8px; }
.ci-access-denied p { font-size: 14px; color: #64748b; margin: 0; line-height: 1.6; }
.ci-access-denied .ci-ai-badge { margin: 0 auto; }

/* Landing */
.ci-landing { max-width: 960px; margin: 0 auto; padding: 44px 0 60px; }
.ci-ai-badge-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.ci-ai-badge { width: 40px; height: 40px; border-radius: 16px; background: #2563eb; color: #fff; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(37,99,235,.3); }
.ci-ai-kicker { font-size: 12px; font-weight: 600; color: #2563eb; letter-spacing: .18em; text-transform: uppercase; }
.ci-landing h1 { font-size: 36px; font-weight: 700; color: #0f172a; letter-spacing: -.02em; line-height: 1.1; margin: 0 0 12px; }
.ci-landing-sub { font-size: 16px; color: #64748b; line-height: 1.6; max-width: 540px; margin: 0 0 52px; }
.ci-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 52px; }
.ci-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; display: flex; flex-direction: column; gap: 20px; cursor: pointer; transition: all .2s ease; }
.ci-card:hover { border-color: #93c5fd; box-shadow: 0 4px 24px rgba(37,99,235,.08); }
.ci-card-icon { width: 48px; height: 48px; border-radius: 16px; background: #eff6ff; color: #2563eb; display: grid; place-items: center; transition: background .2s ease; }
.ci-card:hover .ci-card-icon { background: #dbeafe; }
.ci-card h3 { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 6px; }
.ci-card p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }
.ci-card-stat { margin-top: auto; }
.ci-card-stat b { display: block; font-size: 20px; font-weight: 700; color: #0f172a; }
.ci-card-stat span { font-size: 12px; color: #94a3b8; }
.ci-card-btn { width: 100%; padding: 10px; border: 0; border-radius: 12px; background: #f1f5f9; color: #334155; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .2s ease; }
.ci-card-btn:hover { background: #2563eb; color: #fff; }
.ci-activity h2 { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .12em; margin: 0 0 16px; }
.ci-activity-list { display: flex; flex-direction: column; gap: 2px; }
.ci-activity-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 0; border-radius: 12px; background: transparent; cursor: pointer; text-align: left; transition: background .15s; }
.ci-activity-row:hover { background: #f8fafc; }
.ci-activity-inner { display: flex; align-items: center; gap: 10px; }
.ci-activity-dot { width: 6px; height: 6px; border-radius: 50%; background: #93c5fd; }
.ci-activity-row span { font-size: 13.5px; color: #334155; font-weight: 500; }
.ci-activity-time { font-size: 12px !important; color: #94a3b8 !important; font-weight: 400 !important; }

/* Workspace shell */
.ci-workspace { display: flex; flex-direction: column; height: calc(100vh - 150px); min-height: 560px; }
.ci-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; margin-bottom: 14px; box-shadow: 0 3px 12px rgba(28,53,88,.03); }
.ci-mode-crumb { display: flex; align-items: center; gap: 10px; }
.ci-crumb-root { display: flex; align-items: center; gap: 7px; padding: 8px 10px; border: 0; border-radius: 10px; background: transparent; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
.ci-crumb-root:hover { background: #f1f5f9; color: #2563eb; }
.ci-crumb-sep { color: #cbd5e1; font-size: 14px; }
.ci-mode-dropdown { position: relative; }
.ci-mode-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: #0f172a; cursor: pointer; transition: all .15s; }
.ci-mode-btn:hover { border-color: #93c5fd; color: #2563eb; }
.ci-mode-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 220px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(15,23,42,.1); padding: 6px; z-index: 40; }
.ci-mode-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: 0; border-radius: 8px; background: transparent; text-align: left; font-size: 13px; color: #334155; cursor: pointer; }
.ci-mode-item:hover { background: #f1f5f9; }
.ci-mode-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.ci-toolbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #94a3b8; }
.ci-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.15); }

.ci-mode-content { display: grid; grid-template-columns: 290px minmax(0, 1fr) 320px; gap: 14px; flex: 1; min-height: 0; }

/* Panels */
.ci-panel { border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; display: flex; flex-direction: column; min-height: 0; overflow: hidden; box-shadow: 0 3px 12px rgba(28,53,88,.03); }
.ci-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; color: #0f172a; }
.ci-panel-body { flex: 1; overflow-y: auto; padding: 14px 18px; }
.ci-panel-empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 24px 0; }

/* Search + patient list */
.ci-search { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; color: #94a3b8; margin-bottom: 12px; transition: .15s; }
.ci-search:focus-within { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
.ci-search input { flex: 1; border: 0; outline: 0; background: transparent; font-size: 13px; color: #0f172a; }
.ci-patient-list { display: flex; flex-direction: column; gap: 2px; }
.ci-patient-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 0; border-radius: 10px; background: transparent; cursor: pointer; text-align: left; transition: .12s; }
.ci-patient-row:hover { background: #f8fafc; }
.ci-patient-row.selected { background: #eff6ff; }
.ci-avatar { width: 34px; height: 34px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.ci-patient-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ci-patient-name { font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-patient-sub { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-alert-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }

/* Chat */
.ci-chat { display: flex; flex-direction: column; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; overflow: hidden; min-width: 0; box-shadow: 0 3px 12px rgba(28,53,88,.03); }
.ci-chat-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
.ci-chat-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #0f172a; }
.ci-chat-title svg { color: #2563eb; }
.ci-chat-head-right { display: flex; align-items: center; gap: 8px; }
.ci-chat-badge { font-size: 11px; font-weight: 600; color: #2563eb; background: #eff6ff; border: 1px solid #dbeafe; border-radius: 999px; padding: 3px 10px; }
.ci-stop { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #dc2626; font-size: 11px; font-weight: 600; cursor: pointer; transition: .12s; }
.ci-stop:hover { background: #fee2e2; }
.ci-chat-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; background: #fbfcfe; }
.ci-chat-empty { margin: auto; text-align: center; max-width: 320px; }
.ci-chat-empty-icon { width: 52px; height: 52px; border-radius: 16px; background: #eff6ff; color: #2563eb; display: grid; place-items: center; margin: 0 auto 14px; }
.ci-chat-empty p { font-size: 14px; font-weight: 600; color: #334155; margin: 0 0 6px; }
.ci-chat-empty span { font-size: 12.5px; color: #94a3b8; line-height: 1.6; }
.ci-msg { max-width: 88%; }
.ci-msg-user { align-self: flex-end; background: #2563eb; color: #fff; border-radius: 14px 14px 4px 14px; padding: 10px 14px; font-size: 13.5px; line-height: 1.5; box-shadow: 0 2px 8px rgba(37,99,235,.2); }
.ci-msg-ai { align-self: flex-start; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px 14px 14px 4px; padding: 16px; box-shadow: 0 2px 8px rgba(28,53,88,.05); max-width: 92%; }
.ci-answer { font-size: 14px; color: #334155; line-height: 1.65; margin: 0 0 12px; white-space: pre-wrap; }
.ci-cursor { display: inline-block; width: 7px; height: 13px; margin-left: 3px; vertical-align: -2px; background: #2563eb; border-radius: 2px; animation: ci-blink 1s steps(2) infinite; }
@keyframes ci-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.ci-conf-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.ci-conf-label { font-size: 11px; color: #64748b; font-weight: 600; }
.ci-conf-bar { flex: 1; max-width: 220px; height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
.ci-conf-fill { height: 100%; border-radius: 3px; background: #2563eb; }
.ci-conf-pct { font-size: 12px; font-weight: 700; color: #2563eb; }
.ci-evidence { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.ci-ev-tag { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #475569; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 3px 8px; }
.ci-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ci-action { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #475569; font-size: 11.5px; font-weight: 500; cursor: pointer; transition: all .12s; }
.ci-action:hover { background: #f1f5f9; border-color: #cbd5e1; }
.ci-action.done { color: #059669; border-color: #a7f3d0; background: #ecfdf5; }
.ci-typing { display: flex; gap: 4px; padding: 6px 0; }
.ci-typing i { width: 7px; height: 7px; border-radius: 50%; background: #93c5fd; animation: ci-blink 1.2s infinite; }
.ci-typing i:nth-child(2) { animation-delay: .2s; }
.ci-typing i:nth-child(3) { animation-delay: .4s; }
@keyframes ci-blink { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.ci-suggest { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 18px; border-top: 1px solid #f1f5f9; background: #fff; }
.ci-suggest-chip { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 999px; background: #f8fafc; color: #475569; font-size: 12px; cursor: pointer; transition: all .12s; }
.ci-suggest-chip:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
.ci-input-row { display: flex; align-items: center; gap: 10px; padding: 12px 18px 14px; border-top: 1px solid #f1f5f9; background: #fff; }
.ci-input { flex: 1; padding: 11px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13.5px; color: #0f172a; outline: 0; transition: .15s; }
.ci-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.ci-send { width: 40px; height: 40px; border: 0; border-radius: 12px; background: #2563eb; color: #fff; display: grid; place-items: center; cursor: pointer; transition: background .15s; }
.ci-send:hover { background: #1d4ed8; }
.ci-send:disabled { opacity: .5; cursor: default; }

/* Patient context */
.ci-ctx-section { margin-bottom: 18px; }
.ci-ctx-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin: 0 0 8px; }
.ci-ctx-muted { font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5; }
.ci-tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ci-tag { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 500; }
.ci-tag.blue { background: #eff6ff; color: #2563eb; }
.ci-tag.soft { background: #f1f5f9; color: #64748b; }
.ci-alert-row { display: flex; align-items: center; gap: 8px; padding: 7px 10px; margin-bottom: 6px; border: 1px solid #fef2f2; background: #fef2f2; border-radius: 8px; font-size: 12.5px; color: #b91c1c; }
.ci-alert-row svg { flex-shrink: 0; }
.ci-alert-row span { flex: 1; }
.ci-alert-lvl { font-size: 10px; font-weight: 700; text-transform: uppercase; }
.ci-alert-lvl.high { color: #dc2626; }
.ci-alert-lvl.moderate { color: #d97706; }
.ci-ctx-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; font-size: 12.5px; color: #334155; border-bottom: 1px solid #f8fafc; }
.ci-ctx-item:last-child { border-bottom: 0; }
.ci-ctx-main { display: flex; flex-direction: column; min-width: 0; }
.ci-ctx-main b { font-size: 12.5px; font-weight: 600; color: #0f172a; }
.ci-ctx-main small { font-size: 11px; color: #94a3b8; }
.ci-trend { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 700; }
.ci-trend.up { color: #dc2626; }
.ci-trend.down { color: #2563eb; }
.ci-trend.flat { color: #94a3b8; }

/* Cohort filters */
.ci-filter-group { margin-bottom: 16px; }
.ci-filter-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin: 0 0 8px; }
.ci-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ci-filter-chip { padding: 5px 10px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #475569; font-size: 11.5px; cursor: pointer; transition: all .12s; }
.ci-filter-chip.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.ci-date-row { display: flex; gap: 8px; }
.ci-date-input { flex: 1; padding: 7px 9px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #0f172a; outline: 0; }

/* Cohort chats list */
.ci-chat-list { display: flex; flex-direction: column; gap: 6px; }
.ci-chat-row { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; cursor: pointer; text-align: left; transition: .12s; }
.ci-chat-row:hover { border-color: #bfdbfe; background: #f8fafc; }
.ci-chat-row.selected { border-color: #2563eb; background: #eff6ff; }
.ci-chat-row.selected .ci-chat-title { color: #2563eb; }
.ci-chat-title { font-size: 12.5px; font-weight: 600; color: #0f172a; }
.ci-chat-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #94a3b8; }
.ci-chat-meta .ci-tag { margin-left: auto; }
.ci-chat-del { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 6px; background: transparent; color: #cbd5e1; cursor: pointer; transition: .12s; }
.ci-chat-del:hover { background: #fee2e2; color: #dc2626; }
.ci-new-chat-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border: 1px solid #2563eb; border-radius: 8px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 600; cursor: pointer; transition: .12s; }
.ci-new-chat-btn:hover { background: #dbeafe; }

/* Cohort + analytics summary */
.ci-kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 2px; }
.ci-kpi span { font-size: 11px; color: #94a3b8; }
.ci-kpi b { font-size: 22px; color: #0f172a; letter-spacing: -.02em; }
.ci-kpi.mini { flex: 1; min-width: 0; margin: 0; }
.ci-kpi.mini em { display: inline-flex; align-items: center; gap: 3px; font-style: normal; font-size: 11px; font-weight: 700; }
.ci-kpi.mini em.up { color: #059669; }
.ci-kpi.mini em.down { color: #dc2626; }
.ci-kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
.ci-bar-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; margin-bottom: 8px; }
.ci-bar-label { width: 82px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ci-bar-track { flex: 1; height: 8px; border-radius: 4px; background: #f1f5f9; overflow: hidden; }
.ci-bar-fill { height: 100%; border-radius: 4px; background: #2563eb; }
.ci-bar-fill.soft { background: #93c5fd; }
.ci-bar-val { width: 34px; text-align: right; font-weight: 600; color: #334155; }
.ci-mom { display: inline-flex; align-items: center; gap: 2px; width: 62px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.ci-mom.up { color: #059669; }
.ci-mom.down { color: #dc2626; }
.ci-insight { display: flex; align-items: flex-start; gap: 8px; padding: 9px 10px; margin-bottom: 6px; border-radius: 8px; font-size: 12.5px; color: #334155; line-height: 1.5; }
.ci-insight-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.ci-insight.good { background: #ecfdf5; }
.ci-insight.good .ci-insight-dot { background: #10b981; }
.ci-insight.warn { background: #fffbeb; }
.ci-insight.warn .ci-insight-dot { background: #f59e0b; }
.ci-insight.info { background: #eff6ff; }
.ci-insight.info .ci-insight-dot { background: #2563eb; }

/* Analytics categories */
.ci-cat-list { display: flex; flex-direction: column; gap: 4px; }
.ci-cat-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: 0; border-radius: 10px; background: transparent; font-size: 13px; color: #334155; cursor: pointer; transition: .12s; }
.ci-cat-item:hover { background: #f8fafc; }
.ci-cat-item.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.ci-cat-icon { width: 28px; height: 28px; border-radius: 8px; background: #f1f5f9; color: #64748b; display: grid; place-items: center; }
.ci-cat-item.active .ci-cat-icon { background: #dbeafe; color: #2563eb; }
.ci-cat-hint { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }

@media (max-width: 1200px) {
  .ci-cards { grid-template-columns: 1fr; }
  .ci-mode-content { grid-template-columns: 250px minmax(0, 1fr); }
  .ci-mode-content .ci-panel:last-child { display: none; }
}
@media (max-width: 900px) {
  .ci-mode-content { grid-template-columns: 1fr; }
  .ci-mode-content .ci-panel:first-child { display: none; }
}
`;
