import { useState } from "react";
import {
  FileText,
  Users,
  History,
  Send,
  ShieldCheck,
  LogOut,
  FileDown,
} from "lucide-react";

const reportTypes = [
  {
    icon: FileText,
    title: "Patient Summary PDF",
    description: "One-page overview of diagnosis, treatment, and current status.",
    badges: ["PDF", "1 page"],
  },
  {
    icon: Users,
    title: "Tumor Board Report",
    description: "Multi-disciplinary case summary formatted for board review.",
    badges: ["Multi-specialty", "PDF"],
  },
  {
    icon: History,
    title: "Clinical Timeline",
    description: "Chronological record of diagnosis, treatment, and follow-up.",
    badges: ["Chronological", "Interactive"],
  },
  {
    icon: Send,
    title: "Referral Summary",
    description: "Condensed clinical brief for referring or receiving physicians.",
    badges: ["Referral", "PDF"],
  },
  {
    icon: ShieldCheck,
    title: "Insurance Summary",
    description: "Structured documentation formatted for insurance and claims.",
    badges: ["Insurance", "PDF"],
  },
  {
    icon: LogOut,
    title: "Discharge Summary",
    description: "Complete discharge record including plan and instructions.",
    badges: ["Discharge", "PDF"],
  },
];

const formats = ["PDF", "Word (.docx)", "FHIR R4", "HL7 v2", "CSV"];
const sectionOptions = ["AI Summary", "Timeline", "Documents", "Doctor Signature"];

export default function ReportsPage() {
  const [format, setFormat] = useState("PDF");
  const [sections, setSections] = useState(sectionOptions);

  const toggleSection = (section) => {
    setSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  };

  return (
    <>
      <style>{`
        .reports-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }
        .reports-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .report-card {
          display: flex;
          gap: 13px;
          padding: 18px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
          transition: all 0.15s ease;
        }
        .report-card:hover {
          border-color: #a6c9f7;
          box-shadow: 0 6px 16px rgba(47, 128, 237, 0.1);
        }
        .report-icon {
          display: grid;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 10px;
          color: #2f80ed;
          background: #edf5ff;
        }
        .report-card strong {
          display: block;
          color: #344158;
          font-size: 13px;
        }
        .report-card p {
          margin: 6px 0 10px;
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
        }
        .reports-generate-btn {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 52px;
          margin-top: 20px;
          border-radius: 11px;
          font-size: 14px;
        }
        @media (max-width: 1000px) {
          .reports-layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .reports-grid {
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
        <div className="reports-grid">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div className="report-card" key={report.title}>
                <span className="report-icon">
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
              </div>
            );
          })}
        </div>

        <aside className="settings-card reports-export-card">
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
          <div className="reports-section">
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
        </aside>
      </div>

      <button className="primary-action reports-generate-btn" type="button">
        <FileDown size={17} /> Generate Patient Summary PDF
      </button>
    </>
  );
}