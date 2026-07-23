import { useState } from "react";

const doctors = [
  {
    name: "Dr. Ananya Krishnan",
    initials: "KA",
    dept: "Medical Oncology",
    role: "Attending Oncologist",
    sessions: 847,
    status: "active",
  },
  {
    name: "Dr. Vikram Mehta",
    initials: "MV",
    dept: "Radiation Oncology",
    role: "Attending Oncologist",
    sessions: 612,
    status: "active",
  },
  {
    name: "Dr. Priya Nair",
    initials: "NP",
    dept: "Surgical Oncology",
    role: "Senior Resident",
    sessions: 423,
    status: "active",
  },
  {
    name: "Dr. Rahul Sinha",
    initials: "SR",
    dept: "Hemato-Oncology",
    role: "Junior Resident",
    sessions: 318,
    status: "active",
  },
  {
    name: "Dr. Meera Iyer",
    initials: "IM",
    dept: "Palliative Care",
    role: "Attending Oncologist",
    sessions: 205,
    status: "inactive",
  },
];

const tabs = [
  "Doctors",
  "Departments",
  "Usage",
  "Billing",
  "Integrations",
  "Audit Log",
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("Doctors");

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-header-icon">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1>Admin Panel</h1>
            <p>Tata Memorial Centre &middot; Hospital Administrator</p>
          </div>
        </div>
        <div className="admin-header-stats">
          <div className="admin-header-stat">
            <div className="admin-header-stat-value">24</div>
            <div className="admin-header-stat-label">Active Doctors</div>
          </div>
          <div className="admin-header-stat">
            <div className="admin-header-stat-value">6</div>
            <div className="admin-header-stat-label">Departments</div>
          </div>
          <div className="admin-header-stat">
            <div className="admin-header-stat-value">312</div>
            <div className="admin-header-stat-label">Patients (MTD)</div>
          </div>
          <div className="admin-header-stat">
            <div className="admin-header-stat-value">99.9%</div>
            <div className="admin-header-stat-label">API Uptime</div>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === "Doctors" && (
          <div className="admin-table-section">
            <div className="admin-table-header">
              <span className="admin-table-title">
                All Doctors ({doctors.length})
              </span>
              <button className="admin-add-btn">+ Add Doctor</button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>AI Sessions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.initials}>
                      <td className="admin-table-name">
                        <div className="admin-avatar">{doc.initials}</div>
                        <span>{doc.name}</span>
                      </td>
                      <td>{doc.dept}</td>
                      <td>{doc.role}</td>
                      <td className="admin-table-sessions">{doc.sessions}</td>
                      <td>
                        <span className={`admin-status ${doc.status}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <button className="admin-action-btn">Edit</button>
                        <button className="admin-action-btn danger">
                          Disable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Departments" && (
          <div className="admin-departments">
            <div className="admin-table-header">
              <span className="admin-table-title">All Departments</span>
              <button className="admin-add-btn">+ Add Department</button>
            </div>
            <div className="admin-dept-grid">
              {[
                { name: "Medical Oncology", doctors: 4, patients: 153 },
                { name: "Radiation Oncology", doctors: 2, patients: 89 },
                { name: "Surgical Oncology", doctors: 3, patients: 112 },
                { name: "Hemato-Oncology", doctors: 2, patients: 67 },
                { name: "Palliative Care", doctors: 1, patients: 21 },
                { name: "Diagnostics", doctors: 2, patients: 44 },
              ].map((dept) => (
                <div className="admin-dept-card" key={dept.name}>
                  <div className="admin-dept-icon">
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
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="admin-dept-name">{dept.name}</div>
                  <div className="admin-dept-meta">
                    {dept.doctors} doctors &middot; {dept.patients} patients
                  </div>
                  <div className="admin-dept-actions">
                    <button className="admin-dept-btn">Configure</button>
                    <button className="admin-dept-btn">View Members</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Usage" && (
          <div className="admin-usage">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">1,716</div>
                <div className="admin-stat-label">AI Summaries</div>
                <div className="admin-stat-trend up">+12% vs last month</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">370</div>
                <div className="admin-stat-label">Voice Sessions</div>
                <div className="admin-stat-trend up">+17% vs last month</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">2,840</div>
                <div className="admin-stat-label">Documents Uploaded</div>
                <div className="admin-stat-trend up">+8% vs last month</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">12</div>
                <div className="admin-stat-label">Active Doctors</div>
                <div className="admin-stat-trend neutral">No change</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Billing" && (
          <div className="admin-billing">
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-value">37 / 50</div>
                <div className="admin-stat-label">Active Licenses</div>
                <div className="admin-stat-trend neutral">74% utilized</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">$4,250</div>
                <div className="admin-stat-label">Monthly Cost</div>
                <div className="admin-stat-trend neutral">Enterprise plan</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">8,240 / 10,000</div>
                <div className="admin-stat-label">AI Credits Used</div>
                <div className="admin-stat-trend warn">82% consumed</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-value">Aug 1, 2026</div>
                <div className="admin-stat-label">Next Billing</div>
                <div className="admin-stat-trend neutral">Auto-renew</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Integrations" && (
          <div className="admin-integrations">
            <div className="admin-table-header">
              <span className="admin-table-title">Hospital Integrations</span>
              <button className="admin-add-btn">+ Add Integration</button>
            </div>
            <div className="admin-intg-list">
              {[
                {
                  name: "EMR System",
                  provider: "Meditech Expanse",
                  status: "Connected",
                  sync: "2 min ago",
                },
                {
                  name: "PACS Imaging",
                  provider: "Change Healthcare",
                  status: "Connected",
                  sync: "15 min ago",
                },
                {
                  name: "Lab Information System",
                  provider: "Sunquest",
                  status: "Connected",
                  sync: "30 min ago",
                },
                {
                  name: "Pharmacy System",
                  provider: "BDRx",
                  status: "Pending",
                  sync: "Setup required",
                },
              ].map((intg) => (
                <div className="admin-intg-row" key={intg.name}>
                  <div className="admin-intg-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div className="admin-intg-info">
                    <div className="admin-intg-name">{intg.name}</div>
                    <div className="admin-intg-provider">{intg.provider}</div>
                  </div>
                  <div className="admin-intg-sync">Last sync: {intg.sync}</div>
                  <span
                    className={`admin-status ${intg.status === "Connected" ? "active" : "pending"}`}
                  >
                    {intg.status}
                  </span>
                  <button className="admin-intg-btn">
                    {intg.status === "Connected" ? "Configure" : "Setup"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Audit Log" && (
          <div className="admin-audit">
            <div className="admin-table-header">
              <span className="admin-table-title">Audit Logs</span>
              <button className="admin-outline-btn">Export Logs</button>
            </div>
            <div className="admin-audit-list">
              {[
                {
                  action: "Patient record exported",
                  user: "Dr. Ananya Krishnan",
                  time: "2 min ago",
                  type: "export",
                },
                {
                  action: "AI summary approved",
                  user: "Dr. Vikram Mehta",
                  time: "8 min ago",
                  type: "review",
                },
                {
                  action: "New document uploaded",
                  user: "Dr. Priya Nair",
                  time: "14 min ago",
                  type: "upload",
                },
                {
                  action: "SSO configuration updated",
                  user: "Hospital Admin",
                  time: "1 hr ago",
                  type: "security",
                },
                {
                  action: "Doctor account created",
                  user: "Hospital Admin",
                  time: "2 hrs ago",
                  type: "account",
                },
                {
                  action: "EMR integration synced",
                  user: "System",
                  time: "3 hrs ago",
                  type: "integration",
                },
                {
                  action: "API key rotated",
                  user: "Hospital Admin",
                  time: "5 hrs ago",
                  type: "security",
                },
                {
                  action: "Department permissions updated",
                  user: "Hospital Admin",
                  time: "Yesterday",
                  type: "permissions",
                },
              ].map((log, i) => (
                <div className="admin-audit-row" key={i}>
                  <div className={`admin-audit-dot ${log.type}`} />
                  <div className="admin-audit-info">
                    <div className="admin-audit-action">{log.action}</div>
                    <div className="admin-audit-user">{log.user}</div>
                  </div>
                  <div className="admin-audit-time">{log.time}</div>
                  <span className={`admin-audit-badge ${log.type}`}>
                    {log.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
