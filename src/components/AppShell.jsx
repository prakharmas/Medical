import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Mic,
  Sparkles,
  BrainCircuit,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  Plus,
  Bell,
  LogOut,
  Sparkles as BrandIcon,
} from "lucide-react";
import { getUserInfo, listEventsDetailed, editEvent, checkUnreadEvents } from "../api/api";

const navItems = [
  { id: "admin", path: "/admin", label: "Admin", icon: ShieldCheck },
  { id: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", path: "/patients", label: "Patients", icon: Users },
  { id: "voice", path: "/voice", label: "Voice", icon: Mic },
  { id: "summary", path: "/ai-summary", label: "AI Summary", icon: Sparkles },
  { id: "intelligence", path: "/intelligence", label: "Intelligence", icon: BrainCircuit },
  { id: "reports", path: "/reports", label: "Reports", icon: FileText },
  { id: "analytics", path: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", path: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({ name: "", department: "", role: "" });

  const [events, setEvents] = useState([]);
  const [showEvents, setShowEvents] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchEvents = () => {
    listEventsDetailed({ num_per_page: 10, page_index: 0, order_asc: false })
      .then((res) => {
        if (res.data.success) setEvents(res.data.events);
      })
      .catch(() => {});
  };

  const fetchUnread = () => {
    checkUnreadEvents()
      .then((res) => {
        if (res.data.success) setUnreadCount(res.data.not_read);
      })
      .catch(() => {});
  };

  useEffect(() => {
    getUserInfo()
      .then((res) => {
        const d = res.data;
        setUserInfo({
          name: d.name || "",
          department: d.doctor_department || "",
          role: d.role_chosen || "",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (userInfo.role !== "admin") return;
    fetchEvents();
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [userInfo.role]);

  useEffect(() => {
    if (!showEvents) return;
    const handler = () => setShowEvents(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showEvents]);

  const markRead = (uid) => {
    editEvent({ uids: [uid], is_read: true })
      .then(() => {
        setEvents((prev) => prev.map((e) => (e.uid === uid ? { ...e, read_at: Date.now() } : e)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      })
      .catch(() => {});
  };

  const adminHidden = ["dashboard", "patients", "summary"];
  const doctorOnly = ["voice"];
  const visibleNavItems = navItems.filter((item) => {
    if (item.id === "admin" && userInfo.role !== "admin") return false;
    if (doctorOnly.includes(item.id) && userInfo.role !== "doctor") return false;
    if (userInfo.role === "admin" && adminHidden.includes(item.id)) return false;
    return true;
  });

  const displayName = userInfo.name
    ? `Dr. ${userInfo.name.replace(/^dr\.?\s*/i, "")}`
    : "Doctor";
  const initials = userInfo.name
    ? userInfo.name.split(/[\s._-]+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "DR";

  return (
    <div className="app-shell reference-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-symbol">
            <BrandIcon size={15} strokeWidth={2} className="text-white" />
          </span>
          <div>
            <span>ClinIQ</span>
            <small>CLINICAL AI</small>
          </div>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/patients"
                ? location.pathname.startsWith("/patients") ||
                  location.pathname === "/"
                : location.pathname === item.path;
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
            <span className="doctor-avatar">{initials}</span>
            <div>
              <strong>{displayName}</strong>
              <small>{userInfo.department || "—"}</small>
            </div>
          </div>
          <button className="signout-link" onClick={() => { localStorage.removeItem("access_token"); navigate("/", { replace: true }); }}>
            <LogOut size={15} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">

          <div className="topbar-actions">
            {/* <button className="upload-button">
              <Plus size={14} strokeWidth={2} />
              <span>Upload Records</span>
            </button> */}
            <div className="notif-wrapper" onClick={(e) => e.stopPropagation()}>
              <button className="icon-button" aria-label="Notifications" onClick={() => setShowEvents(!showEvents)}>
                <Bell size={18} strokeWidth={2} />
                {unreadCount > 0 && <i className="notif-dot" />}
              </button>
              {showEvents && (
                <div className="notif-dropdown">
                  <div className="notif-header">Notifications</div>
                  {events.length === 0 ? (
                    <div className="notif-empty">No events</div>
                  ) : events.map((ev) => (
                    <div className={`notif-item ${ev.read_at ? "" : "notif-unread"}`} key={ev.uid} onClick={() => !ev.read_at && markRead(ev.uid)}>
                      <div className="notif-tag">{ev.tag}</div>
                      <div className="notif-desc">
                        <strong>{ev.actor?.name}</strong> created <strong>{ev.subject?.name}</strong> ({ev.subject?.tag})
                      </div>
                      <div className="notif-time">{new Date(ev.ts * 1000).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="doctor-avatar profile-avatar">{initials}</button>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}