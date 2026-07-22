import { useState } from "react";

const toggles = [
  [
    "Voice dictation",
    "Enable ambient voice capture and clinical transcription",
    true,
  ],
  [
    "AI clinical summaries",
    "Generate structured summaries from patient documents",
    true,
  ],
  [
    "Treatment timeline",
    "Build an interactive longitudinal care timeline",
    true,
  ],
  [
    "Drug interaction alerts",
    "Surface potential medication interactions during review",
    true,
  ],
  [
    "Clinical coding",
    "Suggest ICD-10 and SNOMED codes from clinical notes",
    false,
  ],
  [
    "AI assistant",
    "Allow evidence-backed questions over patient records",
    true,
  ],
  [
    "OCR & document structuring",
    "Extract and classify content from uploaded records",
    true,
  ],
  [
    "Translation",
    "Translate clinical documents while preserving medical context",
    false,
  ],
];

export default function SettingsPage() {
  const [features, setFeatures] = useState(
    toggles.map(([, , enabled]) => enabled)
  );
  const [saved, setSaved] = useState(false);
  const updateFeature = (index) =>
    setFeatures((previous) =>
      previous.map((value, position) => (position === index ? !value : value))
    );
  return (
    <>
      <div className="page-heading settings-heading">
        <div>
          <p className="eyebrow">WORKSPACE CONFIGURATION</p>
          <h1>Settings</h1>
          <p>
            Manage your ClinIQ workspace, AI preferences, and hospital
            configuration.
          </p>
        </div>
        <button
          className="primary-action"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }}
        >
          {saved ? "? Changes saved" : "Save changes"}
        </button>
      </div>
      <div className="settings-layout">
        <aside className="settings-nav">
          <button className="active">General</button>
          <button>AI preferences</button>
          <button>Feature controls</button>
          <button>Hospital branding</button>
          <button>Notifications</button>
          <button>Security &amp; access</button>
          <hr />
          <button>Integrations</button>
        </aside>
        <section className="settings-content">
          <section className="settings-card">
            <div className="settings-card-title">
              <div>
                <h2>General preferences</h2>
                <p>Personalize your clinical workspace.</p>
              </div>
            </div>
            <div className="field-grid">
              <label>
                Display name
                <input defaultValue="Dr. S. Mehta" />
              </label>
              <label>
                Clinical specialty
                <select defaultValue="Medical Oncology">
                  <option>Medical Oncology</option>
                  <option>Radiation Oncology</option>
                  <option>Surgical Oncology</option>
                </select>
              </label>
              <label>
                Preferred language
                <select defaultValue="English (India)">
                  <option>English (India)</option>
                  <option>Hindi</option>
                </select>
              </label>
              <label>
                Time zone
                <select defaultValue="Asia/Kolkata">
                  <option>Asia/Kolkata</option>
                </select>
              </label>
            </div>
          </section>
          <section className="settings-card">
            <div className="settings-card-title">
              <div>
                <h2>AI preferences</h2>
                <p>Control how ClinIQ assists during documentation review.</p>
              </div>
              <span className="ai-badge">? AI powered</span>
            </div>
            <div className="preference-row">
              <div>
                <strong>Summary detail</strong>
                <p>
                  How much clinical detail should AI summaries include by
                  default?
                </p>
              </div>
              <div className="segment-control">
                <button>Concise</button>
                <button className="active">Balanced</button>
                <button>Detailed</button>
              </div>
            </div>
            <div className="preference-row">
              <div>
                <strong>Evidence mode</strong>
                <p>Always show source citations alongside generated content.</p>
              </div>
              <button className="toggle on" aria-label="Evidence mode enabled">
                <i />
              </button>
            </div>
            <div className="preference-row">
              <div>
                <strong>Auto-save review drafts</strong>
                <p>
                  Save your edits automatically while reviewing an AI summary.
                </p>
              </div>
              <button className="toggle on" aria-label="Auto-save enabled">
                <i />
              </button>
            </div>
          </section>
          <section className="settings-card">
            <div className="settings-card-title">
              <div>
                <h2>Feature controls</h2>
                <p>Enable or disable ClinIQ capabilities for your workspace.</p>
              </div>
            </div>
            <div className="feature-list">
              {toggles.map(([name, description], index) => (
                <div className="feature-row" key={name}>
                  <span className="feature-icon">
                    {index === 0
                      ? "?"
                      : index === 1
                        ? "?"
                        : index === 2
                          ? "?"
                          : "?"}
                  </span>
                  <div>
                    <strong>{name}</strong>
                    <p>{description}</p>
                  </div>
                  <button
                    onClick={() => updateFeature(index)}
                    className={`toggle ${features[index] ? "on" : ""}`}
                    aria-label={`${name} ${features[index] ? "enabled" : "disabled"}`}
                  >
                    <i />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
