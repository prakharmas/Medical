import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  Mic,
  Eye,
  Search,
  Upload,
  Sparkles,
  FileUp,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { getDashboard, getUserInfo } from "../api/api";
const defaultStats = [
  {
    icon: Users,
    value: "—",
    label: "Patients Today",
    delta: "",
    iconColor: "#5b6b85",
    iconBg: "#eef2f7",
  },
  {
    icon: Clock,
    value: "—",
    label: "Avg. Summary Time",
    delta: "",
    iconColor: "#2f9e6f",
    iconBg: "#e6f8f0",
  },
  {
    icon: Mic,
    value: "-",
    label: "Voice Sessions",
    delta: "Today",
    iconColor: "#7554b8",
    iconBg: "#eee7fa",
  },
  {
    icon: Eye,
    value: "-",
    label: "Pending Review",
    delta: "Needs your approval",
    iconColor: "#c98a2c",
    iconBg: "#fdf1de",
  },
];
// NOTE: added a stable "id" per patient so we can deep-link straight
// into that patient's record instead of just the generic /patients list.
const consultations = [
  {
    id: "priya-sharma",
    time: "09:00 AM",
    name: "Priya Sharma",
    initials: "PS",
    avatarClass: "purple",
    subtitle: "Follow-up · T-DM1 Cycle 10",
    status: "Completed",
  },
  {
    id: "rajesh-kumar",
    time: "10:30 AM",
    name: "Rajesh Kumar",
    initials: "RK",
    avatarClass: "blue",
    subtitle: "CT Review · Post-Chemo",
    status: "Completed",
  },
  {
    id: "sunita-reddy",
    time: "12:00 PM",
    name: "Sunita Reddy",
    initials: "SR",
    avatarClass: "orange",
    subtitle: "Urgent Review · CA-125",
    status: "Urgent",
  },
  {
    id: "mohammed-aslam",
    time: "02:00 PM",
    name: "Mohammed Aslam",
    initials: "MA",
    avatarClass: "green",
    subtitle: "Cycle 5 Assessment",
    status: "Upcoming",
  },
  {
    id: "lalita-devi",
    time: "03:30 PM",
    name: "Lalita Devi",
    initials: "LD",
    avatarClass: "purple",
    subtitle: "Radiotherapy Planning",
    status: "Upcoming",
  },
  {
    id: "new-patient",
    time: "04:30 PM",
    name: "New Patient",
    initials: "NP",
    avatarClass: "grey",
    subtitle: "First Consultation",
    status: "Upcoming",
  },
];
const statusStyles = {
  Completed: "#2f9e6f",
  Urgent: "#ee4c54",
  Upcoming: "#2f80ed",
};
export default function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [stats, setStats] = useState(defaultStats);
  const [userName, setUserName] = useState("");
  const [userDept, setUserDept] = useState("");

  useEffect(() => {
    getDashboard()
      .then((res) => {
        const d = res.data;
        if (d.success) {
          setStats((prev) => [
            { ...prev[0], value: String(d.patients_created_today ?? "—") },
            { ...prev[1], value: d.average_summary_time ? `${Math.round(d.average_summary_time)}s` : "—" },
            prev[2],
            prev[3],
          ]);
        }
      })
      .catch(() => {});

    getUserInfo()
      .then((res) => {
        const d = res.data;
        if (d.name) setUserName(d.name.replace(/^dr\.?\s*/i, ""));
        if (d.doctor_department) setUserDept(d.doctor_department);
      })
      .catch(() => {});
  }, []);

  // Opens the OS file picker. Wired to both the header "Upload Records"
  // button and the Quick Actions "Upload Records" row.
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Fires once the user actually picks file(s) from the dialog.
  // Replace the body of this function with your real upload API call
  // (e.g. POST to /api/records/upload with FormData).
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log("Files selected for upload:", files);
    // TODO: send `files` to your backend here, e.g.:
    // const formData = new FormData();
    // files.forEach((f) => formData.append("records", f));
    // await fetch("/api/records/upload", { method: "POST", body: formData });

    alert(`${files.length} file(s) ready to upload:\n${files.map((f) => f.name).join("\n")}`);

    // reset so selecting the same file again still fires onChange
    e.target.value = "";
  };

  // Navigates straight into a specific patient's history/detail view.
  // Update the path below to match whatever route your app actually
  // uses for a single patient (e.g. "/patients/:id").
  const goToPatient = (patient) => {
    navigate(`/patients/${patient.id}`, {
      state: { patientId: patient.id, patientName: patient.name },
    });
  };

  const quickActions = [
    {
      icon: Search,
      title: "Search Patient",
      subtitle: "UHID, MRN, Name",
      onClick: () => navigate("/patients"),
    },
    // {
    //   icon: Upload,
    //   title: "Upload Records",
    //   subtitle: "PDF, Scans, Reports",
    //   onClick: handleUploadClick,
    // },
    {
      icon: Mic,
      title: "Start Voice Note",
      subtitle: "Live transcription",
      onClick: () => navigate("/voice"),
    },
    {
      icon: Sparkles,
      title: "Review AI Summaries",
      subtitle: "5 pending approval",
      onClick: () => navigate("/ai-summary"),
    },
  ];
  const pendingReviews = [
    { id: "priya-sharma", name: "Priya Sharma", initials: "PS", avatarClass: "purple", type: "Breast Cancer (IDC)" },
    { id: "rajesh-kumar", name: "Rajesh Kumar", initials: "RK", avatarClass: "blue", type: "Non-Small Cell Lung Cancer" },
    { id: "sunita-reddy", name: "Sunita Reddy", initials: "SR", avatarClass: "orange", type: "Ovarian Cancer (HGSOC)" },
  ];
  const activity = [
    {
      icon: Sparkles,
      color: "#7554b8",
      bg: "#eee7fa",
      title: "AI Summary Ready",
      subtitle: "Priya Sharma · Breast Cancer follow-up",
      time: "10 min ago",
    },
    {
      icon: FileUp,
      color: "#397dc4",
      bg: "#e1efff",
      title: "Documents Uploaded",
      subtitle: "Rajesh Kumar · 3 files (CT + Lab Reports)",
      time: "28 min ago",
    },
    {
      icon: Mic,
      color: "#2f9e6f",
      bg: "#e6f8f0",
      title: "Voice Session Completed",
      subtitle: "Sunita Reddy · 14 min consultation",
      time: "1 hr ago",
    },
    {
      icon: Eye,
      color: "#c98a2c",
      bg: "#fdf1de",
      title: "Review Pending",
      subtitle: "Mohammed Aslam · Chemo Cycle 5 summary",
      time: "2 hrs ago",
    },
    {
      icon: AlertTriangle,
      color: "#d33f3f",
      bg: "#ffe8e9",
      title: "Critical Finding Flagged",
      subtitle: "Sunita Reddy · CA-125 significantly elevated",
      time: "3 hrs ago",
    },
    {
      icon: Sparkles,
      color: "#7554b8",
      bg: "#eee7fa",
      title: "AI Summary Ready",
      subtitle: "Lalita Devi · Radiation planning notes",
      time: "4 hrs ago",
    },
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      {/* hidden input powering both "Upload Records" buttons */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={handleFilesSelected}
      />

      <div className="dash-greeting-row">
        <div>
          <h1>{greeting}, Dr. {userName || "Doctor"}</h1>
          <p>{dateLabel} · {userDept || "—"}</p>
        </div>
        <div className="dash-greeting-actions">
          {/* <button className="outline-button" onClick={handleUploadClick}>
            <Upload size={14} /> Upload Records
          </button>
          <button className="primary-action" onClick={() => navigate("/voice")}>
            <Mic size={14} /> Start Voice
          </button> */}
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card" key={stat.label}>
              <span
                className="stat-icon"
                style={{ color: stat.iconColor, background: stat.iconBg }}
              >
                <Icon size={17} />
              </span>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
              <span className="stat-delta">{stat.delta}</span>
            </div>
          );
        })}
      </div>
      <div className="dash-columns">
        <section className="dash-panel">
          <div className="panel-title">
            <h3>
              <Calendar size={15} /> Today's Consultations
            </h3>
            <span>{consultations.length} scheduled</span>
          </div>
          <div className="consult-list">
            {consultations.map((item) => (
              <button
                key={item.id}
                className="consult-row"
                onClick={() => goToPatient(item)}
              >
                <span className="consult-time">{item.time}</span>
                <span className={`patient-avatar ${item.avatarClass}`}>
                  {item.initials}
                </span>
                <span className="consult-info">
                  <strong>{item.name}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <span
                  className="consult-status"
                  style={{ color: statusStyles[item.status] }}
                >
                  {item.status}
                </span>
                <span className="consult-arrow">›</span>
              </button>
            ))}
          </div>
        </section>
        <div>
          <section className="dash-panel">
            <div className="panel-title">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions-list">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    className="quick-action-row"
                    onClick={action.onClick}
                  >
                    <span className="quick-action-icon">
                      <Icon size={16} />
                    </span>
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.subtitle}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="dash-panel review-panel">
            <div className="panel-title">
              <h3>Pending AI Reviews</h3>
              <span className="review-badge">{pendingReviews.length}</span>
            </div>
            <div className="review-list">
              {pendingReviews.map((item) => (
                <button
                  key={item.id}
                  className="review-row"
                  onClick={() => goToPatient(item)}
                >
                  <span className={`patient-avatar ${item.avatarClass}`}>
                    {item.initials}
                  </span>
                  <span className="review-info">
                    <strong>{item.name}</strong>
                    <small>{item.type}</small>
                  </span>
                  <span className="consult-arrow">›</span>
                </button>
              ))}
            </div>
            <button className="review-view-all" onClick={() => navigate("/ai-summary")}>
              View all 5 →
            </button>
          </section>
        </div>
      </div>
      <section className="dash-panel" style={{ marginTop: 16 }}>
        <div className="panel-title">
          <h3>Recent Activity</h3>
          <span>Last 8 hours</span>
        </div>
        <div className="activity-grid">
          {activity.map((item, index) => {
            const Icon = item.icon;
            return (
              <div className="activity-item" key={index}>
                <span
                  className="activity-icon"
                  style={{ color: item.color, background: item.bg }}
                >
                  <Icon size={15} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                  <time>{item.time}</time>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}