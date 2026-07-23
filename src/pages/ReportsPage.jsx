import { useState } from "react";
import {
  ClipboardList,
  FlaskConical,
  CalendarClock,
  Send,
  Briefcase,
  LogOut,
  FileDown,
  FileText,
  CheckCircle2,
} from "lucide-react";

const reportTypes = [
  {
    id: "patient-summary",
    icon: ClipboardList,
    iconColor: "#2f80ed",
    iconBg: "#edf5ff",
    title: "Patient Summary PDF",
    description: "Full clinical summary with all sections",
    badges: ["SOAP", "Medications", "Timeline"],
  },
  {
    id: "tumor-board",
    icon: FlaskConical,
    iconColor: "#d6336c",
    iconBg: "#ffe8f0",
    title: "Tumor Board Report",
    description: "Structured report for MDT/tumor board",
    badges: ["Pathology", "Stage", "Plan"],
  },
  {
    id: "clinical-timeline",
    icon: CalendarClock,
    iconColor: "#2f80ed",
    iconBg: "#edf5ff",
    title: "Clinical Timeline",
    description: "Visual chronological treatment history",
    badges: ["Events", "Milestones"],
  },
  {
    id: "referral-summary",
    icon: Send,
    iconColor: "#c94f7c",
    iconBg: "#fdeaf1",
    title: "Referral Summary",
    description: "Compact summary for specialist referral",
    badges: ["1 page", "Key Findings"],
  },
  {
    id: "insurance-summary",
    icon: Briefcase,
    iconColor: "#5b6b85",
    iconBg: "#eef2f7",
    title: "Insurance Summary",
    description: "ICD-coded report for insurance claims",
    badges: ["ICD-10", "Codes"],
  },
  {
    id: "discharge-summary",
    icon: LogOut,
    iconColor: "#7554b8",
    iconBg: "#eee7fa",
    title: "Discharge Summary",
    description: "Structured discharge note with instructions",
    badges: ["Instructions", "Follow-up"],
  },
];

const formats = ["PDF", "Word (.docx)", "FHIR R4", "HL7 v2", "CSV"];
const sectionOptions = ["AI Summary", "Timeline", "Documents", "Doctor Signature"];

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState(reportTypes[0].id);
  const [format, setFormat] = useState("PDF");
  const [sections, setSections] = useState(sectionOptions);
  const [generated, setGenerated] = useState(null); // holds { title, format } once "Generate" is clicked
  const [generating, setGenerating] = useState(false);

  const selectedReport = reportTypes.find((r) => r.id === selectedId) || reportTypes[0];

  const toggleSection = (section) => {
    setSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  };

  const handleSelectReport = (id) => {
    setSelectedId(id);
    setGenerated(null); // switching report type clears any previous preview
  };

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(null);
    // simulate a short generation delay — swap this for a real API call,
    // e.g. POST /api/reports/generate { type: selectedReport.id, format, sections }
    setTimeout(() => {
      setGenerating(false);
      setGenerated({ title: selectedReport.title, format });
    }, 900);
  };

  return (
    <>
      <style>{`
        .reports-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: start;
        }
        .reports-list {
          display: grid;
          gap: 12px;
        }
        .report-card {
          display: flex;
          width: 100%;
          gap: 13px;
          padding: 16px 18px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .report-card:hover {
          border-color: #a6c9f7;
          box-shadow: 0 6px 16px rgba(47, 128, 237, 0.1);
        }
        .report-card.active {
          border-color: #2f80ed;
          background: #f5f9ff;
          box-shadow: 0 6px 16px rgba(47, 128, 237, 0.12);
        }
        .report-icon {
          display: grid;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 10px;
        }
        .report-card strong {
          display: block;
          color: #344158;
          font-size: 13px;
        }
        .report-card p {
          margin: 5px 0 9px;
          color: #8996a8;
          font-size: 11px;
          line-height: 1.5;
        }
        .report-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .report-badge {
          padding: 4px 8px;
          border-radius: 6px;
          color: #4b80c7;
          font-size: 9px;
          font-weight: 700;
          background: #edf5ff;
        }
        .reports-export-card h2 {
          margin: 0 0 18px;
          color: #344158;
          font-size: 15px;
        }
        .reports-section {
          margin-bottom: 20px;
        }
        .reports-section h4 {
          margin: 0 0 10px;
          color: #96a1b1;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }
        .format-option {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          padding: 9px 11px;
          border: 1px solid #e5eaf1;
          border-radius: 8px;
          color: #536177;
          font-size: 12px;
          font-weight: 600;
          text-align: left;
          background: #fff;
          cursor: pointer;
        }
        .format-option.active {
          border-color: #2f80ed;
          color: #2360b8;
          background: #eff6ff;
        }
        .format-radio {
          display: grid;
          flex: 0 0 auto;
          width: 14px;
          height: 14px;
          place-items: center;
          border: 2px solid #c3cee0;
          border-radius: 50%;
        }
        .format-option.active .format-radio {
          border-color: #2f80ed;
        }
        .format-radio-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2f80ed;
        }
        .check-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 0;
          color: #536177;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .reports-generate-btn {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          border-radius: 11px;
          font-size: 13px;
        }
        .reports-generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .reports-preview-card {
          display: grid;
          place-items: center;
          margin-top: 16px;
          padding: 40px 20px;
          min-height: 220px;
          text-align: center;
        }
        .reports-preview-card .placeholder {
          color: #a3afc0;
        }
        .reports-preview-card .placeholder svg {
          margin-bottom: 10px;
          opacity: 0.6;
        }
        .reports-preview-card .placeholder p {
          margin: 0;
          font-size: 12px;
        }
        .reports-preview-card .success {
          color: #2f9e6f;
        }
        .reports-preview-card .success svg {
          margin-bottom: 10px;
        }
        .reports-preview-card .success strong {
          display: block;
          color: #344158;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .reports-preview-card .success p {
          margin: 0;
          color: #96a1b1;
          font-size: 11px;
        }
        @media (max-width: 1000px) {
          .reports-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>Generate and export structured clinical reports for Priya Sharma</p>
        </div>
      </div>
      <div className="reports-layout">
        <div className="reports-list">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            const isActive = report.id === selectedId;
            return (
              <button
                type="button"
                className={`report-card ${isActive ? "active" : ""}`}
                key={report.id}
                onClick={() => handleSelectReport(report.id)}
              >
                <span
                  className="report-icon"
                  style={{ color: report.iconColor, background: report.iconBg }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{report.title}</strong>
                  <p>{report.description}</p>
                  <div className="report-badges">
                    {report.badges.map((badge) => (
                      <span className="report-badge" key={badge}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <aside>
          <div className="settings-card reports-export-card">
            <h2>Export Settings</h2>
            <div className="reports-section">
              <h4>EXPORT FORMAT</h4>
              {formats.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`format-option ${format === item ? "active" : ""}`}
                  onClick={() => setFormat(item)}
                >
                  <span className={`format-radio ${format === item ? "active" : ""}`}>
                    {format === item && <span className="format-radio-dot" />}
                  </span>
                  {item}
                </button>
              ))}
            </div>
            <div className="reports-section" style={{ marginBottom: 12 }}>
              <h4>INCLUDE SECTIONS</h4>
              {sectionOptions.map((item) => (
                <label className="check-row" key={item}>
                  <input
                    type="checkbox"
                    checked={sections.includes(item)}
                    onChange={() => toggleSection(item)}
                    style={{ accentColor: "#2f80ed" }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <button
              className="primary-action reports-generate-btn"
              type="button"
              onClick={handleGenerate}
              disabled={generating}
            >
              <FileDown size={16} />
              {generating ? "Generating…" : `Generate ${selectedReport.title}`}
            </button>
          </div>

          <div className="settings-card reports-preview-card">
            {generated ? (
              <div className="success">
                <CheckCircle2 size={34} />
                <strong>{generated.title} ready</strong>
                <p>Exported as {generated.format} · click to download</p>
              </div>
            ) : (
              <div className="placeholder">
                <FileText size={34} />
                <p>Select a report type and click Generate</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}