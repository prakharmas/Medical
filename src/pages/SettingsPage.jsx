import { useState } from "react";

const features = [
  {
    icon: "\uD83C\uDFA4",
    name: "Voice Dictation",
    desc: "Real-time speech-to-text during consultations",
    on: true,
  },
  {
    icon: "\u2728",
    name: "AI Summary",
    desc: "Auto-generate structured clinical summaries from documents",
    on: true,
  },
  {
    icon: "\uD83D\uDCC5",
    name: "Timeline Generator",
    desc: "Automatically build treatment timelines from records",
    on: true,
  },
  {
    icon: "\uD83D\uDC8A",
    name: "Drug Interaction Alerts",
    desc: "Warn about potential drug interactions in medication lists",
    on: true,
  },
  {
    icon: "\uD83D\uDD22",
    name: "Clinical Coding (ICD-10)",
    desc: "Automatic ICD-10 code suggestions from diagnoses",
    on: true,
  },
  {
    icon: "\uD83D\uDCAC",
    name: "AI Chat Assistant",
    desc: "Ask AI questions about the patient using document context",
    on: true,
  },
  {
    icon: "\uD83D\uDD0D",
    name: "OCR Processing",
    desc: "Extract text from scanned documents and images",
    on: true,
  },
  {
    icon: "\uD83C\uDF10",
    name: "Translation",
    desc: "Translate documents and summaries to regional languages",
    on: true,
  },
  {
    icon: "\uD83D\uDD14",
    name: "Follow-up Reminders",
    desc: "Automated reminders for patient follow-up scheduling",
    on: true,
  },
  {
    icon: "\uD83D\uDCDD",
    name: "Auto SOAP Notes",
    desc: "Generate SOAP notes from voice sessions automatically",
    on: true,
  },
];

export default function SettingsPage() {
  const [featureStates, setFeatureStates] = useState(features.map((f) => f.on));
  const [autoSummary, setAutoSummary] = useState(true);
  const [saved, setSaved] = useState(false);

  const toggleFeature = (i) =>
    setFeatureStates((p) => p.map((v, j) => (j === i ? !v : v)));

  const enabledCount = featureStates.filter(Boolean).length;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>Settings</h1>
        <p>Customize ClinIQ for your workflow</p>
      </div>

      <div className="settings-sections">
        <div className="settings-section-card">
          <div className="settings-section-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="settings-section-icon"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              <path d="M20 3v4" />
              <path d="M22 5h-4" />
              <path d="M4 17v2" />
              <path d="M5 18H3" />
            </svg>
            <span className="settings-section-title">AI Preferences</span>
          </div>
          <div className="settings-section-body settings-grid-2">
            <div className="settings-field">
              <label>Medical Specialty</label>
              <select defaultValue="Medical Oncology">
                <option>Medical Oncology</option>
                <option>Radiation Oncology</option>
                <option>Surgical Oncology</option>
                <option>Hemato-Oncology</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Language</label>
              <select defaultValue="English">
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Tamil</option>
                <option>Bengali</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Voice Model</label>
              <select defaultValue="ClinIQ-Voice-Pro">
                <option>ClinIQ-Voice-Pro</option>
                <option>Standard</option>
                <option>Fast</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Summary Style</label>
              <select defaultValue="SOAP Format">
                <option>SOAP Format</option>
                <option>Narrative</option>
                <option>Bullet Points</option>
              </select>
            </div>
            <div className="settings-field settings-field-full">
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">
                    Auto Summary on Upload
                  </div>
                  <div className="settings-toggle-desc">
                    Automatically generate AI summary when documents are
                    uploaded
                  </div>
                </div>
                <button
                  className={`toggle ${autoSummary ? "on" : ""}`}
                  onClick={() => setAutoSummary(!autoSummary)}
                  aria-label="Auto Summary on Upload"
                >
                  <i />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section-card">
          <div className="settings-section-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="settings-section-icon"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="settings-section-title">Hospital Branding</span>
          </div>
          <div className="settings-section-body settings-grid-2">
            <div className="settings-field">
              <label>Hospital Name</label>
              <input defaultValue="Tata Memorial Centre" />
            </div>
            <div className="settings-field">
              <label>Department</label>
              <input defaultValue="Medical Oncology" />
            </div>
            <div className="settings-field">
              <label>Unit</label>
              <input defaultValue="Oncology Unit B" />
            </div>
            <div className="settings-field">
              <label>Contact</label>
              <input defaultValue="+91-22-2417-7000" />
            </div>
            <div className="settings-field">
              <label>Hospital Logo</label>
              <div className="settings-logo-upload">
                <div className="settings-logo-placeholder">TMC</div>
                <span>Click to upload logo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section-card">
          <div className="settings-section-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="settings-section-icon"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="settings-section-title">Features</span>
            <span className="settings-section-count">
              {enabledCount} / {features.length} enabled
            </span>
          </div>
          <div className="settings-feature-list">
            {features.map((f, i) => (
              <div className="settings-feature-row" key={f.name}>
                <span className="settings-feature-icon">{f.icon}</span>
                <div className="settings-feature-info">
                  <div className="settings-feature-name">{f.name}</div>
                  <div className="settings-feature-desc">{f.desc}</div>
                </div>
                <button
                  className={`toggle ${featureStates[i] ? "on" : ""}`}
                  onClick={() => toggleFeature(i)}
                  aria-label={`${f.name} ${featureStates[i] ? "enabled" : "disabled"}`}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="settings-save-btn"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
          <button className="settings-reset-btn">Reset to Defaults</button>
        </div>
      </div>
    </div>
  );
}
