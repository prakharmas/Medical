import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  createMedicalDocument,
  uploadMedicalDocument,
  listMedicalDocuments,
} from "../api/api";

const timeline = [
  {
    type: "Diagnosis",
    title: "Initial Diagnosis",
    date: "2023-01-15",
    color: "red",
    description:
      "IDC Right Breast Stage IIIB confirmed via clinical examination and mammography. Referred to oncology.",
    sources: ["Pathology Report", "Mammography Report"],
  },
  {
    type: "Biopsy",
    title: "Core Needle Biopsy",
    date: "2023-01-22",
    color: "purple",
    description:
      "Core needle biopsy of right breast mass. Histopathology confirmed invasive ductal carcinoma, Grade 2. ER/PR negative, HER2 positive (IHC 3+).",
    sources: ["Histopathology Report"],
  },
  {
    type: "Scan",
    title: "Staging PET-CT Scan",
    date: "2023-02-10",
    color: "cyan",
    description:
      "PET-CT whole body scan. FDG-avid right breast mass 3.8 cm with ipsilateral axillary lymphadenopathy. No distant metastases. Clinical Stage IIIB (T3N2M0).",
    sources: ["PET-CT Report"],
  },
  {
    type: "Chemotherapy",
    title: "Chemotherapy — Cycle 1",
    date: "2023-03-01",
    color: "blue",
    description:
      "Neoadjuvant TCHP initiated: Docetaxel 75 mg/m², Carboplatin AUC 5, Trastuzumab 8 mg/kg loading, Pertuzumab 420 mg loading. Cycle 1 of 6 completed without significant toxicity.",
    sources: ["Chemo Record", "Day Care Notes"],
  },
  {
    type: "Scan",
    title: "Interim PET-CT — Partial Response",
    date: "2023-06-15",
    color: "cyan",
    description:
      "Interim PET-CT after 3 cycles. Significant reduction in FDG uptake — partial metabolic response. Tumor size reduced from 3.8 cm to 1.9 cm. Continue planned chemotherapy.",
    sources: ["PET-CT Report"],
  },
  {
    type: "Chemotherapy",
    title: "Chemotherapy — Cycle 6 (Final)",
    date: "2023-08-15",
    color: "blue",
    description:
      "Final cycle of neoadjuvant TCHP completed. Total 6 cycles administered (Mar–Aug 2023). Grade 2 neutropenia managed with G-CSF support. No dose reductions required.",
    sources: ["Chemo Record", "Discharge Summary"],
  },
  {
    type: "Surgery",
    title: "Modified Radical Mastectomy",
    date: "2023-09-20",
    color: "red",
    description:
      "Right Modified Radical Mastectomy with level II axillary clearance. Intraoperative course uneventful. Specimen sent for final histopathology.",
    sources: ["Operation Notes", "Surgical Record"],
  },
  {
    type: "Medication",
    title: "Adjuvant T-DM1 Initiated",
    date: "2023-10-15",
    color: "slate",
    description:
      "Adjuvant ado-trastuzumab emtansine (T-DM1) 3.6 mg/kg IV every 3 weeks initiated. Planned 14 cycles. Baseline echo: LVEF 62% — normal. First cycle tolerated well.",
    sources: ["Treatment Plan", "Discharge Summary"],
  },
  {
    type: "Follow-up",
    title: "Routine Follow-up",
    date: "2024-07-18",
    color: "green",
    description:
      "Follow-up post-curative treatment. Patient reports fatigue (ECOG 1) and mild peripheral neuropathy. PET-CT: complete metabolic response. T-DM1 Cycle 10 completed. 4 cycles remaining.",
    sources: ["Follow-up Note", "PET-CT Report", "Lab Reports"],
  },
];

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
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
    } catch (err) {
      setDocuments([]);
    }
  };

  const saveNote = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
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
            uploaded++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (uploaded > 0) fetchDocuments();
    alert(
      failed === 0
        ? `${uploaded} file(s) uploaded successfully!`
        : `${uploaded} uploaded, ${failed} failed.`
    );
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
                Cancer Type: <strong>{patient?.primary_condition?.diagnosis || "—"}</strong>
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
            multiple
            onChange={handleFileSelected}
          />
          <button onClick={handleUploadClick} disabled={uploading}>
            {uploading ? "☁ Uploading..." : "☁ Upload"}
          </button>
          <button>♩ Voice</button>
          <button>☁ Export</button>
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
          {timeline.map((event, index) => (
            <div className="timeline-item" key={event.title}>
              <div className="timeline-left">
                <div className={`timeline-node ${event.color}`}>
                  {index + 1}
                </div>
                {index < timeline.length - 1 && (
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
                    <span className="timeline-card-title">{event.title}</span>
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
