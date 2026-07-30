import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Upload, Mic, Download } from "lucide-react";
import {
  createMedicalDocument,
  uploadMedicalDocument,
  listMedicalDocuments,
  generateMedicalSummary,
} from "../api/api";

const COLORS = ["red", "cyan", "blue", "purple", "green", "slate"];

const TYPE_COLOR_MAP = {
  Diagnosis: "red",
  Biopsy: "purple",
  Scan: "cyan",
  Imaging: "cyan",
  "Lab Result": "green",
  Lab: "green",
  Chemotherapy: "blue",
  Treatment: "blue",
  Surgery: "red",
  Medication: "slate",
  "Follow-up": "green",
  Followup: "green",
  Pathology: "purple",
};

function guessColor(title, idx) {
  for (const [key, c] of Object.entries(TYPE_COLOR_MAP)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return c;
  }
  return COLORS[idx % COLORS.length];
}

const toneMap = {
  "application/pdf": "violet",
  "image/jpeg": "cyan",
  "image/png": "green",
  "application/msword": "blue",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "blue",
};

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { state } = useLocation();
  const patient = state?.patient || null;
  const [tab, setTab] = useState("timeline");
  const [openEvent, setOpenEvent] = useState(null);
  const [note, setNote] = useState(
    "Patient is tolerating T-DM1 well. Mild grade 1 peripheral neuropathy in bilateral lower limbs — started Duloxetine 30mg OD. Monitor at next cycle. Continue T-DM1 as planned.",
  );
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
    fetchTimeline();
  }, [patientId]);

  const fetchDocuments = async () => {
    try {
      const res = await listMedicalDocuments(patientId);
      if (res.data.documents?.length) {
        setDocuments(
          res.data.documents.map((doc) => ({
            uid: doc.uid,
            name: doc.filename,
            type: doc.mimetype?.split("/").pop()?.toUpperCase() || "Document",
            date: "—",
            size: doc.num_pages ? `${doc.num_pages} pages` : "—",
            confidence: "—",
            tone: toneMap[doc.mimetype] || "slate",
            status: doc.upload_finished ? "ready" : "processing",
          }))
        );
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    }
  };

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await generateMedicalSummary({ patient_uid: patientId });
      const events = res.data?.summary?.dated_medical_events;
      if (events?.length) {
        const flat = [];
        let idx = 0;
        for (const group of events) {
          const dateStr = group.date
            ? new Date(typeof group.date === "number" && group.date < 1e12 ? group.date * 1000 : group.date)
                .toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
            : "—";
          for (const evt of group.events || []) {
            flat.push({
              type: evt.title || "Event",
              title: evt.title || "Event",
              date: dateStr,
              color: guessColor(evt.title || "", idx),
              description: evt.info || "",
              sources: [],
            });
            idx++;
          }
        }
        setTimelineEvents(flat);
      } else {
        setTimelineEvents([]);
      }
    } catch {
      setTimelineEvents([]);
    }
    setTimelineLoading(false);
  };

  const saveNote = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const createRes = await createMedicalDocument({
        patient_uid: patientId,
        filename: file.name,
        preset_uid: null,
      });

      if (createRes.data.success) {
        const docUid = createRes.data.uid;
        const formData = new FormData();
        formData.append("medical_document_uid", docUid);
        formData.append("file", file);

        const uploadRes = await uploadMedicalDocument(formData);
        if (uploadRes.data.success) {
          alert("File uploaded successfully!");
          fetchDocuments();
        } else {
          alert("Upload failed.");
        }
      } else {
        alert("Failed to create document.");
      }
    } catch {
      alert("Upload failed.");
    }

    setUploading(false);
    e.target.value = "";
  };

  const genderSuffix = patient?.gender === "male" ? "M" : patient?.gender === "female" ? "F" : "";
  const patientInitials = patient?.name
    ? patient.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";
  let ageStr = "—";
  if (patient?.dob) {
    const birth = new Date(patient.dob * 1000);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    ageStr = `${age}${genderSuffix}`;
  }

  return (
    <div className="patient-profile-page">
      <header className="profile-header">
        <div className="profile-overview">
          <span className="profile-initials">{patientInitials}</span>
          <div>
            <div className="profile-name">
              <h1>{patient?.name || "Unknown Patient"}</h1>
              <span>{ageStr}</span>
              <b>Active</b>
            </div>
            <div className="profile-facts">
              <span>
                Diagnosis: <strong>{patient?.primary_condition?.diagnosis || "—"}</strong>
              </span>
              <span>
                Stage: <strong>{patient?.primary_condition?.stage_or_severity || "—"}</strong>
              </span>
              <span>
                UHID: <strong>{patientId}</strong>
              </span>
              <span>
                MRN: <strong>—</strong>
              </span>
            </div>
            <p>
              Physician: <strong>{patient?.doctor_name || "—"}</strong>
            </p>
          </div>
        </div>
        <div className="profile-actions">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelected}
          />
          <button onClick={handleUploadClick} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Upload size={14} strokeWidth={2} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Mic size={14} strokeWidth={2} />
            Voice
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Download size={14} strokeWidth={2} />
            Export
          </button>
          <button
            className="profile-ai"
            onClick={() => navigate("/ai-summary", { state: { patientId } })}
          >
            ✦ AI Summary
          </button>
        </div>
      </header>
      <nav className="patient-detail-tabs">
        <button
          className={tab === "timeline" ? "active" : ""}
          onClick={() => setTab("timeline")}
        >
          Timeline
        </button>
        <button
          className={tab === "documents" ? "active" : ""}
          onClick={() => setTab("documents")}
        >
          Documents
        </button>
        <button
          className={tab === "notes" ? "active" : ""}
          onClick={() => setTab("notes")}
        >
          Notes
        </button>
      </nav>
      {tab === "timeline" && (
        <section className="patient-timeline">
          {timelineLoading && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8", fontSize: 13 }}>
              Loading timeline…
            </div>
          )}
          {!timelineLoading && timelineEvents.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8", fontSize: 13 }}>
              No timeline events found. Upload documents to generate a timeline.
            </div>
          )}
          {timelineEvents.map((event, index) => (
            <div className="timeline-item" key={`${event.date}-${event.title}-${index}`}>
              <div className="timeline-left">
                <div className={`timeline-node ${event.color}`}>
                  {index + 1}
                </div>
                {index < timelineEvents.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>
              <div
                className={`timeline-card-new ${openEvent === index ? "open" : ""}`}
                onClick={() => setOpenEvent(openEvent === index ? null : index)}
              >
                <div className="timeline-card-top">
                  <div className="timeline-card-labels">
                    <span className={`timeline-badge ${event.color}`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="timeline-card-meta">
                    <span className="timeline-date">{event.date}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`timeline-chevron ${openEvent === index ? "open" : ""}`}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
                {openEvent === index && (
                  <div className="timeline-card-body">
                    <p className="timeline-card-desc">{event.description}</p>
                    <div className="timeline-card-sources">
                      {event.sources.map((src) => (
                        <span className="timeline-source-tag" key={src}>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <line x1="10" y1="9" x2="8" y2="9" />
                          </svg>
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
      {tab === "documents" && (
        <section className="patient-documents">
          {documents.map(
            ({ uid, name, type, date, size, confidence, tone, status }) => (
              <article className="document-record" key={uid || name}>
                <span className={`document-record-icon ${tone}`}>▧</span>
                <div className="document-record-info">
                  <strong>{name}</strong>
                  <span className={tone}>{type}</span>
                  <small>
                    {date} &nbsp; {size}
                  </small>
                </div>
                <div className={`document-ai-status ${status}`}>
                  <strong>
                    {status === "ready" ? "✓  AI Ready" : "◯  Processing"}
                  </strong>
                </div>
                <div className={`document-confidence ${status}`}>
                  <small>Confidence</small>
                  <strong>{confidence}</strong>
                </div>
              </article>
            ),
          )}
        </section>
      )}
      {tab === "notes" && (
        <section className="clinical-notes">
          <div className="notes-editor">
            <label>Clinical Notes</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <footer>
              <span>Last updated: July 18, 2024 · Dr. Ananya Krishnan</span>
              <button onClick={saveNote}>
                {saved ? "✓ Saved" : "Save Note"}
              </button>
            </footer>
          </div>
        </section>
      )}
    </div>
  );
}
