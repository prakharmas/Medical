import { useState, useEffect } from "react";
import { createUser, listUsersDetailed, editUser, listEventsDetailed, getSummaryReportArtifact } from "../api/api";

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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    gender: "male",
    dob: "",
    email: "",
    phone: "",
    doctor_department: "",
    preset_uid: "",
    roles: ["doctor"],
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const downloadReport = async (reportUid) => {
    setDownloading(reportUid);
    try {
      const res = await getSummaryReportArtifact({ report_uid: reportUid });
      const disposition = res.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match ? match[1] : `summary-report-${reportUid}.zip`;
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download report.");
    } finally {
      setDownloading(null);
    }
  };

  const fetchAuditEvents = (page) => {
    setLoadingAudit(true);
    listEventsDetailed({ num_per_page: 10, page_index: page, order_asc: false })
      .then((res) => {
        if (res.data.success) {
          setAuditEvents(res.data.events);
          setAuditTotal(res.data.num_total);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAudit(false));
  };

  useEffect(() => {
    if (activeTab === "Audit Log") fetchAuditEvents(auditPage);
  }, [activeTab]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({
      username: "",
      password: "",
      name: "",
      gender: "male",
      dob: "",
      email: "",
      phone: "",
      doctor_department: "",
      preset_uid: "",
      roles: ["doctor"],
      enabled: true,
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username || "",
      password: "",
      name: user.name || "",
      gender: "male",
      dob: "",
      email: user.email || "",
      phone: user.phone || "",
      doctor_department: user.doctor_department || "",
      preset_uid: "",
      roles: user.roles || ["doctor"],
      enabled: user.enabled !== false,
    });
    setFormError("");
    setShowModal(true);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await listUsersDetailed();
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch {
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleToggle = (role) => {
    const exists = form.roles.includes(role);
    setForm({
      ...form,
      roles: exists ? form.roles.filter((r) => r !== role) : [...form.roles, role],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        username: form.username,
        name: form.name,
        email: form.email,
        phone: form.phone,
        doctor_department: form.doctor_department || null,
        roles: form.roles,
        enabled: form.enabled,
      };
      if (form.password) payload.password = form.password;
      if (editingUser) {
        await editUser(payload);
      } else {
        await createUser({ ...payload, gender: form.gender, dob: form.dob ? new Date(form.dob).getTime() : 0, preset_uid: form.preset_uid || null });
      }
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

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
            {/* <p>Tata Memorial Centre &middot; Hospital Administrator</p> */}
          </div>
        </div>
        {/* <div className="admin-header-stats">
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
        </div> */}
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
                All Users ({users.length})
              </span>
              <button className="admin-add-btn" onClick={openCreateModal}>+ Add User</button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Loading...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No users found.</td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.uid}>
                      <td className="admin-table-name">
                        <div className="admin-avatar">
                          {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </td>
                      <td>{user.email || "—"}</td>
                      <td>{user.doctor_department || "—"}</td>
                      <td>
                        <span className={`admin-role-badge ${user.roles?.includes("admin") ? "admin" : "doctor"}`}>
                          {user.roles?.join(", ")}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status ${user.enabled ? "active" : "inactive"}`}>
                          {user.enabled ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <button className="admin-action-btn" onClick={() => openEditModal(user)}>Edit</button>
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
              <span className="admin-table-title">Audit Logs ({auditTotal})</span>
              {/* <button className="admin-outline-btn">Export Logs</button> */}
            </div>
            <div className="admin-audit-list">
              {loadingAudit ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Loading...</div>
              ) : auditEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>No events found.</div>
              ) : auditEvents.map((ev) => (
                <div className="admin-audit-row" key={ev.uid}>
                  <div className="admin-audit-dot account" />
                  <div className="admin-audit-info">
                    <div className="admin-audit-action">
                      <strong>{ev.actor?.name}</strong> created <strong>{ev.subject?.name}</strong> ({ev.subject?.tag})
                    </div>
                    <div className="admin-audit-user">{ev.tag}</div>
                  </div>
                  <div className="admin-audit-time">{new Date(ev.ts * 1000).toLocaleString()}</div>
                  {ev.tag === "summary-report" && ev.subject?.uid ? (
                    <button
                      className="admin-outline-btn"
                      style={{ marginLeft: 8, fontSize: 12, padding: "4px 10px", flexShrink: 0 }}
                      disabled={downloading === ev.subject.uid}
                      onClick={() => downloadReport(ev.subject.uid)}
                    >
                      {downloading === ev.subject.uid ? "..." : "Download"}
                    </button>
                  ) : (
                    <span className="admin-audit-badge account">{ev.tag}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="admin-pagination">
              <button
                className="admin-outline-btn"
                disabled={auditPage === 0}
                onClick={() => {
                  const next = auditPage - 1;
                  setAuditPage(next);
                  fetchAuditEvents(next);
                }}
              >
                Previous
              </button>
              <span className="admin-page-info">Page {auditPage + 1} of {Math.max(1, Math.ceil(auditTotal / 10))}</span>
              <button
                className="admin-outline-btn"
                disabled={(auditPage + 1) * 10 >= auditTotal}
                onClick={() => {
                  const next = auditPage + 1;
                  setAuditPage(next);
                  fetchAuditEvents(next);
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingUser ? "Edit User" : "Create User"}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="admin-modal-form" onSubmit={handleSubmit}>
              <label>
                Username *
                <input name="username" value={form.username} onChange={handleChange} required />
              </label>
              <label>
                Password {editingUser ? "(leave blank to keep)" : "*"}
                <input name="password" type="password" value={form.password} onChange={handleChange} required={!editingUser} />
              </label>
              <label>
                Full Name *
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              {!editingUser && (
                <div className="admin-modal-row">
                  <label>
                    Gender
                    <select name="gender" value={form.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    DOB
                    <input name="dob" type="date" value={form.dob} onChange={handleChange} />
                  </label>
                </div>
              )}
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </label>
              <label>
                Phone
                <input name="phone" value={form.phone} onChange={handleChange} />
              </label>
              <label>
                Department
                <input name="doctor_department" value={form.doctor_department} onChange={handleChange} placeholder="e.g. Medical Oncology" />
              </label>
              {!editingUser && (
                <label>
                  Preset UID
                  <input name="preset_uid" value={form.preset_uid} onChange={handleChange} placeholder="Optional" />
                </label>
              )}
              <div className="admin-modal-field">
                <span className="admin-modal-label">Roles *</span>
                <div className="admin-modal-checkboxes">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={form.roles.includes("doctor")} onChange={() => handleRoleToggle("doctor")} />
                    Doctor
                  </label>
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={form.roles.includes("admin")} onChange={() => handleRoleToggle("admin")} />
                    Admin
                  </label>
                </div>
              </div>
              {editingUser && (
                <div className="admin-modal-field">
                  <span className="admin-modal-label">Status</span>
                  <label className="admin-checkbox-label">
                    <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                    Account enabled
                  </label>
                </div>
              )}
              {formError && <p className="admin-modal-error">{formError}</p>}
              <div className="admin-modal-actions">
                <button type="button" className="admin-outline-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-add-btn" disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
