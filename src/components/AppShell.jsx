import { Outlet, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "patients", path: "/patients", label: "Patients", icon: "?" },
  // {
  //   id: "summary",
  //   path: "/ai-summary",
  //   label: "AI Summary",
  //   icon: "?",
  //   badge: "5",
  // },
  // { id: "settings", path: "/settings", label: "Settings", icon: "?" },
  // { id: "admin", label: "Admin", icon: "?" },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="app-shell reference-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-symbol">?</span>
          <div>
            <span>CliniQ</span>
            <small>CLINICAL AI</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => item.path && navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge && <b className="nav-badge">{item.badge}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="signed-user">
            <span className="doctor-avatar">AK</span>
            <div>
              <strong>Dr. Ananya Krishnan</strong>
              <small>Medical Oncology</small>
            </div>
          </div>
          <button className="signout-link" onClick={() => navigate("/")}>
            ? <span>Sign out</span>
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div className="global-search">
            <span>?</span>
            <input placeholder="Search patient by name, UHID, MRN�" />
          </div>
          <div className="topbar-actions">
            <button className="upload-button">
              + <span>Upload Records</span>
            </button>
            <button className="icon-button" aria-label="Notifications">
              ?<i />
            </button>
            <button className="doctor-avatar profile-avatar">AK</button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
