import { useState } from "react";

const documents = [
  { name: "Histopathology Report — Jan 2023", type: "Histopathology" },
  { name: "PET-CT Staging Scan", type: "PET Scan" },
  { name: "Cycle 6 Discharge Summary", type: "Discharge Summary" },
  { name: "Operation Notes — MRM", type: "Surgical Notes" },
  { name: "Final Pathology — pCR", type: "Histopathology" },
  { name: "Blood Reports — July 2024", type: "Lab Report" },
  { name: "MRI Breast — July 2024", type: "MRI", processing: true },
];

const summarySections = [
  {
    title: "Chief Complaint",
    confidence: 98,
    source: "Follow-up Note (Jul 2024) · Page 1",
    content:
      "Routine follow-up post-curative treatment for right breast cancer. Patient reports fatigue (ECOG 1) and mild peripheral neuropathy in bilateral lower limbs, likely related to prior chemotherapy.",
    accepted: false,
  },
  {
    title: "Present Illness",
    confidence: 96,
    source: "Discharge Summary + Operation Notes",
    content:
      "48-year-old female, known case of Invasive Ductal Carcinoma (IDC) of the right breast, Stage IIIB (T3N2M0), HER2-positive (IHC 3+, FISH amplified), ER/PR negative. Completed neoadjuvant TCHP chemotherapy (6 cycles, Mar–Aug 2023), followed by Modified Radical Mastectomy (Sep 2023) achieving pathological complete response (pCR). Currently on adjuvant T-DM1, Cycle 10 of 14.",
    accepted: false,
  },
  {
    title: "Cancer History",
    confidence: 99,
    source: "Initial Diagnosis Note + Histopathology (Jan 2023)",
    content:
      "Primary malignancy: IDC Right Breast. Diagnosed January 2023. No prior history of breast cancer or other malignancies. No family history of BRCA1/BRCA2 mutations reported. Patient denies any prior exposure to radiation therapy.",
    accepted: true,
  },
  {
    title: "Previous Treatments",
    confidence: 98,
    source: "Chemotherapy Records + Surgical Notes",
    content:
      "Neoadjuvant TCHP x6 (Docetaxel, Carboplatin, Trastuzumab, Pertuzumab), completed Aug 2023. Modified Radical Mastectomy (MRM) right breast, Sep 2023. Adjuvant T-DM1 (ado-trastuzumab emtansine) initiated Oct 2023, currently Cycle 10 of 14.",
    accepted: true,
  },
  {
    title: "Current Medications",
    confidence: 94,
    source: "Discharge Summary + Follow-up Note",
    content:
      "T-DM1 3.6 mg/kg IV q3wk (Cycle 10 of 14)\nOndansetron 8 mg PRN pre-infusion\nPantoprazole 40 mg daily\nVitamin D3 60,000 IU weekly\nGabapentin 300 mg TID for neuropathy",
    accepted: false,
  },
  {
    title: "Allergies",
    confidence: 100,
    source: "Admission Note (Mar 2023)",
    content:
      "No known drug allergies (NKDA). No allergies to latex, contrast dye, or adhesives reported.",
    accepted: true,
  },
  {
    title: "Comorbidities",
    confidence: 97,
    source: "Initial Workup + Follow-up Notes",
    content:
      "Hypertension — controlled on Amlodipine 5 mg daily\nType 2 Diabetes Mellitus — controlled on Metformin 500 mg BID\nBMI 27.3 kg/m²",
    accepted: false,
  },
  {
    title: "Histopathology & Molecular Markers",
    confidence: 99,
    source: "Histopathology Report (Jan 2023) + IHC Results",
    content:
      "IDC, Grade 2. ER negative (0%), PR negative (0%), HER2 positive (IHC 3+, FISH amplified). Ki-67 index: 35%. No lymphovascular invasion on final pathology. 0/15 axillary lymph nodes positive (ypN0).",
    accepted: true,
  },
  {
    title: "Latest Investigations",
    confidence: 96,
    source: "PET-CT (Jul 2024) + Lab Reports (Jul 2024)",
    content:
      "PET-CT Jul 2024: No FDG-avid disease. Complete metabolic response. CBC: Hb 11.2 g/dL (mild anemia), WBC 5.8, Platelets 245. LFTs normal. Tumor markers: CA 15-3 18 U/mL (within normal limits).",
    accepted: false,
  },
  {
    title: "Performance Status & Treatment Intent",
    confidence: 95,
    source: "Follow-up Note (Jul 2024)",
    content:
      "ECOG Performance Status: 1 (ambulatory, capable of light work). Treatment intent: Curative. Remaining adjuvant therapy: 4 cycles of T-DM1. Plan after completion: surveillance every 3 months for Year 1–2.",
    accepted: false,
  },
  {
    title: "Pending Tests & Next Follow-up",
    confidence: 92,
    source: "Follow-up Note (Jul 2024)",
    content:
      "Next cycle (Cycle 11) scheduled: Aug 5, 2024. Repeat echocardiogram prior to Cycle 12 (anthracycline-related cardiotoxicity monitoring). Follow-up oncology review: Sep 2024.",
    accepted: false,
  },
];

export default function AiSummaryPage() {
  const [accepted, setAccepted] = useState(
    new Set(summarySections.filter((s) => s.accepted).map((s) => s.title)),
  );
  const [expanded, setExpanded] = useState("Chief Complaint");
  const [aiOpen, setAiOpen] = useState(false);

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
  const totalSections = summarySections.length;

  return (
    <div className="ai-summary-layout">
      {/* Source Documents Panel */}
      <aside className="ai-source-panel">
        <div className="ai-source-header">Source Documents</div>
        <div className="ai-source-list">
          {documents.map((doc) => (
            <button className="ai-source-item" key={doc.name}>
              <span className="ai-doc-icon">
                <svg
                  width="13"
                  height="13"
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
              </span>
              <div className="ai-source-info">
                <div className="ai-source-name">{doc.name}</div>
                <div className="ai-source-type">{doc.type}</div>
                {doc.processing && (
                  <div className="ai-source-processing">Processing…</div>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="ai-confidence-footer">
          <div className="ai-confidence-label">AI Confidence</div>
          <div className="ai-confidence-bar">
            <div className="ai-confidence-fill" style={{ width: "96%" }} />
          </div>
          <span className="ai-confidence-value">96%</span>
        </div>
      </aside>

      {/* Summary Editor Panel */}
      <div className="ai-summary-center">
        <div className="ai-summary-sticky-header">
          <div>
            <div className="ai-summary-title-row">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2f80ed"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
              <span className="ai-summary-title">AI Clinical Summary</span>
              <span className="ai-summary-patient">— Priya Sharma</span>
            </div>
            <div className="ai-summary-progress-text">
              {reviewedCount} of {totalSections} sections reviewed
            </div>
          </div>
          <div className="ai-summary-export">
            <div className="ai-progress-bar-mini">
              <div
                className="ai-progress-fill-mini"
                style={{
                  width: `${(reviewedCount / totalSections) * 100}%`,
                }}
              />
            </div>
            <button className="ai-export-btn">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="8,17 12,21 16,17" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="ai-sections-list">
          {summarySections.map((section) => {
            const isAccepted = accepted.has(section.title);
            const isExpanded = expanded === section.title;
            const confColor =
              section.confidence >= 97
                ? "emerald"
                : section.confidence >= 94
                  ? "amber"
                  : "emerald";

            return (
              <div
                key={section.title}
                className={`ai-section-card ${isAccepted ? "accepted" : ""} ${isExpanded ? "expanded" : ""}`}
              >
                <button
                  className="ai-section-header"
                  onClick={() => toggleExpand(section.title)}
                >
                  <span
                    className={`ai-section-check ${isAccepted ? "checked" : ""}`}
                  >
                    {isAccepted && (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="ai-section-title">{section.title}</span>
                  <span className={`ai-section-conf ${confColor}`}>
                    {section.confidence}%
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ai-section-chevron ${isExpanded ? "open" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="ai-section-body">
                    <div className="ai-section-source">
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
                      <span>{section.source}</span>
                    </div>
                    <p className="ai-section-content">{section.content}</p>
                    <div className="ai-section-actions">
                      <button
                        className={`ai-sec-btn ${isAccepted ? "sec-accepted" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAccept(section.title);
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Accept
                      </button>
                      <button className="ai-sec-btn sec-reject">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Reject
                      </button>
                      <button className="ai-sec-btn">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button className="ai-sec-btn">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="23,4 23,10 17,10" />
                          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        Rewrite
                      </button>
                      <button className="ai-sec-btn">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </button>
                      <button className="ai-sec-btn sec-evidence">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
          <button className="ai-approve-all">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

          <div className="ai-flag-card">
            <div className="ai-flag-title">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Flag for Review</span>
            </div>
            <p>
              Mild anemia (Hb 11.2 g/dL). Consider monitoring. No urgent action
              required.
            </p>
          </div>
        </div>
      </aside>

      {/* Floating AI Button */}
      <button
        className="ai-fab"
        onClick={() => setAiOpen(!aiOpen)}
        aria-label="AI Assistant"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
