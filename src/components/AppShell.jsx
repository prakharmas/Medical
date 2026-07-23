import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Mic,
  Sparkles,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", path: "/patients", label: "Patients", icon: Users },
  { id: "voice", path: "/voice", label: "Voice", icon: Mic },
  {
    id: "summary",
    path: "/ai-summary",
    label: "AI Summary",
    icon: Sparkles,
    badge: "5",
  },
  { id: "reports", path: "/reports", label: "Reports", icon: FileText },
  { id: "analytics", path: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", path: "/settings", label: "Settings", icon: SettingsIcon },
  { id: "admin", label: "Admin", icon: ShieldCheck },
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !!item.path && location.pathname === item.path;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => item.path && navigate(item.path)}
              >
                <span className="nav-icon">
                  <Icon size={17} strokeWidth={2} />
                </span>
                {item.label}
                {item.badge && <b className="nav-badge">{item.badge}</b>}
              </button>
            );
          })}
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