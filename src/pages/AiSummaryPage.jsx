import { useState } from "react";

const sections = [
  [
    "Chief complaint",
    "Follow-up after completion of neoadjuvant chemotherapy.",
  ],
  [
    "Present illness",
    "46-year-old with left breast invasive ductal carcinoma, presenting for post-treatment assessment. Reports mild persistent fatigue; no new breast symptoms.",
  ],
  [
    "Cancer history",
    "Screen-detected left breast lesion in January 2026. Core biopsy confirmed grade 2 invasive ductal carcinoma.",
  ],
  [
    "Previous treatments",
    "Completed 4 cycles of dose-dense AC followed by 4 cycles of paclitaxel on 14 Jul 2026.",
  ],
  ["Current medication", "Ondansetron as needed; vitamin D3 daily."],
  [
    "Diagnosis & stage",
    "Invasive ductal carcinoma, left breast � ER+/PR+, HER2- � Clinical Stage IIA (cT2N0M0).",
  ],
];

export default function AiSummaryPage({ patient }) {
  const [accepted, setAccepted] = useState(
    new Set(["Chief complaint", "Cancer history"])
  );
  const [selected, setSelected] = useState("Present illness");
  const toggleAccepted = (title) =>
    setAccepted((previous) => {
      const next = new Set(previous);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  return (
    <>
      <div className="page-heading summary-heading">
        <div>
          <p className="eyebrow">AI CLINICAL REVIEW</p>
          <h1>AI Summary</h1>
          <p>
            Review evidence-backed clinical documentation before it enters the
            patient record.
          </p>
        </div>
        <div className="summary-actions">
          <button className="outline-button">Export</button>
          <button className="primary-action">Approve summary</button>
        </div>
      </div>
      <div className="review-patient">
        <span className="patient-avatar purple">MS</span>
        <div>
          <strong>{patient || "Maya Sharma"}</strong>
          <span>UHID-298104 � Breast carcinoma � Stage IIA</span>
        </div>
        <div className="summary-status">
          <i />
          AI summary generated <b>94% confidence</b>
        </div>
      </div>
      <div className="summary-workspace">
        <aside className="document-panel">
          <div className="panel-title">
            <h3>Patient documents</h3>
            <span>12 files</span>
          </div>
          <div className="document-group">
            <small>UPLOADED TODAY</small>
            <button className="document active">
              <span className="file-icon pdf">PDF</span>
              <span>
                <strong>PET-CT report</strong>
                <em>Radiology � 6 pages</em>
              </span>
              <b>94%</b>
            </button>
            <button className="document">
              <span className="file-icon pdf">PDF</span>
              <span>
                <strong>Oncology follow-up</strong>
                <em>Clinical note � 3 pages</em>
              </span>
              <b>98%</b>
            </button>
          </div>
          <div className="document-group">
            <small>PREVIOUS RECORDS</small>
            <button className="document">
              <span className="file-icon doc">DOC</span>
              <span>
                <strong>Chemo cycle 4</strong>
                <em>Day care � 2 pages</em>
              </span>
            </button>
            <button className="document">
              <span className="file-icon pdf">PDF</span>
              <span>
                <strong>Histopathology</strong>
                <em>Pathology � 8 pages</em>
              </span>
            </button>
          </div>
          <button className="timeline-link">? View treatment timeline</button>
        </aside>
        <section className="summary-editor">
          <div className="editor-heading">
            <div>
              <h2>Clinical summary</h2>
              <p>Generated today at 10:42 AM from 12 patient documents</p>
            </div>
            <button className="outline-button">? Rewrite all</button>
          </div>
          <div className="review-progress">
            <span>
              <b>{accepted.size}</b> of {sections.length} sections accepted
            </span>
            <div>
              <i
                style={{ width: `${(accepted.size / sections.length) * 100}%` }}
              />
            </div>
            <button>Show evidence</button>
          </div>
          <div className="summary-sections">
            {sections.map(([title, text]) => (
              <article
                key={title}
                className={`summary-section ${selected === title ? "focus" : ""}`}
                onClick={() => setSelected(title)}
              >
                <div className="section-head">
                  <h3>{title}</h3>
                  <span
                    className={accepted.has(title) ? "accepted" : "pending"}
                  >
                    {accepted.has(title) ? "? Accepted" : "Needs review"}
                  </span>
                </div>
                <p>{text}</p>
                <div className="section-controls">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleAccepted(title);
                    }}
                  >
                    {accepted.has(title) ? "? Undo" : "? Accept"}
                  </button>
                  <button>? Rewrite</button>
                  <button>? Copy</button>
                  <button className="evidence">? Evidence</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="action-panel">
          <div className="panel-title">
            <h3>Clinical actions</h3>
            <span className="action-count">3</span>
          </div>
          <div className="action-card urgent">
            <span>!</span>
            <div>
              <strong>Review PET-CT findings</strong>
              <p>Partial response noted. Confirm plan with radiology report.</p>
              <button>Review finding ?</button>
            </div>
          </div>
          <div className="action-card">
            <span>+</span>
            <div>
              <strong>Schedule surgical review</strong>
              <p>Post-neoadjuvant consultation due this week.</p>
              <button>View recommendation ?</button>
            </div>
          </div>
          <div className="action-card">
            <span>?</span>
            <div>
              <strong>Update treatment intent</strong>
              <p>Confirm surgery and adjuvant plan.</p>
              <button>Open treatment plan ?</button>
            </div>
          </div>
          <div className="ai-assistant">
            <div>
              <span>?</span>
              <strong>Ask CliniQ</strong>
              <button>�</button>
            </div>
            <p>
              Ask about this patient�s records, treatment history, or clinical
              evidence.
            </p>
            <button className="suggestion">
              What did the latest PET show?
            </button>
            <button className="suggestion">Summarize treatment response</button>
            <div className="chat-input">
              Ask a question� <b>?</b>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
