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

const stats = [
  {
    icon: Users,
    value: "24",
    label: "Patients Today",
    delta: "+3 from yesterday",
    iconColor: "#5b6b85",
    iconBg: "#eef2f7",
  },
  {
    icon: Clock,
    value: "8m",
    label: "Avg. Summary Time",
    delta: "↓ 2m vs last week",
    iconColor: "#2f9e6f",
    iconBg: "#e6f8f0",
  },
  {
    icon: Mic,
    value: "12",
    label: "Voice Sessions",
    delta: "Today",
    iconColor: "#7554b8",
    iconBg: "#eee7fa",
  },
  {
    icon: Eye,
    value: "5",
    label: "Pending Review",
    delta: "Needs your approval",
    iconColor: "#c98a2c",
    iconBg: "#fdf1de",
  },
];

const consultations = [
  {
    time: "09:00 AM",
    name: "Priya Sharma",
    initials: "PS",
    avatarClass: "purple",
    subtitle: "Follow-up · T-DM1 Cycle 10",
    status: "Completed",
  },
  {
    time: "10:30 AM",
    name: "Rajesh Kumar",
    initials: "RK",
    avatarClass: "blue",
    subtitle: "CT Review · Post-Chemo",
    status: "Completed",
  },
  {
    time: "12:00 PM",
    name: "Sunita Reddy",
    initials: "SR",
    avatarClass: "orange",
    subtitle: "Urgent Review · CA-125",
    status: "Urgent",
  },
  {
    time: "02:00 PM",
    name: "Mohammed Aslam",
    initials: "MA",
    avatarClass: "green",
    subtitle: "Cycle 5 Assessment",
    status: "Upcoming",
  },
  {
    time: "03:30 PM",
    name: "Lalita Devi",
    initials: "LD",
    avatarClass: "purple",
    subtitle: "Radiotherapy Planning",
    status: "Upcoming",
  },
  {
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

  const quickActions = [
    {
      icon: Search,
      title: "Search Patient",
      subtitle: "UHID, MRN, Name",
      onClick: () => navigate("/patients"),
    },
    {
      icon: Upload,
      title: "Upload Records",
      subtitle: "PDF, Scans, Reports",
      onClick: undefined,
    },
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
    { name: "Priya Sharma", initials: "PS", avatarClass: "purple", type: "Breast Cancer (IDC)" },
    { name: "Rajesh Kumar", initials: "RK", avatarClass: "blue", type: "Non-Small Cell Lung Cancer" },
    { name: "Sunita Reddy", initials: "SR", avatarClass: "orange", type: "Ovarian Cancer (HGSOC)" },
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
      <style>{`
        .dash-greeting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .dash-greeting-row h1 {
          margin: 0;
          color: #172338;
          font-size: 21px;
          letter-spacing: -0.4px;
        }
        .dash-greeting-row p {
          margin: 5px 0 0;
          color: #758399;
          font-size: 13px;
        }
        .dash-greeting-actions {
          display: flex;
          gap: 10px;
        }
        .dash-greeting-actions button {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-card {
          padding: 18px 19px;
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
        }
        .stat-icon {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 9px;
        }
        .stat-card strong {
          display: block;
          color: #172338;
          font-size: 25px;
          letter-spacing: -0.6px;
        }
        .stat-card small {
          display: block;
          margin-top: 3px;
          color: #64738a;
          font-size: 12px;
          font-weight: 650;
        }
        .stat-delta {
          display: block;
          margin-top: 8px;
          color: #98a5b6;
          font-size: 11px;
        }
        .dash-columns {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 16px;
          align-items: start;
        }
        .dash-panel {
          border: 1px solid #e8edf4;
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 3px 12px rgba(28, 53, 88, 0.025);
        }
        .dash-panel .panel-title {
          padding: 17px 20px 13px;
          border-bottom: 1px solid #edf1f6;
        }
        .dash-panel .panel-title h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .consult-list {
          padding: 6px 10px 10px;
        }
        .consult-row {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 13px;
          padding: 11px 10px;
          border: 0;
          border-radius: 9px;
          text-align: left;
          background: transparent;
        }
        .consult-row:hover {
          background: #f7faff;
        }
        .consult-time {
          width: 68px;
          flex: 0 0 auto;
          color: #96a1b1;
          font-size: 11px;
          font-weight: 650;
        }
        .consult-info {
          min-width: 0;
          flex: 1;
        }
        .consult-info strong {
          display: block;
          color: #314058;
          font-size: 13px;
        }
        .consult-info small {
          display: block;
          margin-top: 3px;
          color: #8b98aa;
          font-size: 11px;
        }
        .consult-status {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
        }
        .consult-arrow {
          flex: 0 0 auto;
          color: #b5c5da;
          font-size: 19px;
        }
        .patient-avatar.grey {
          color: #5b6b85;
          background: #eef2f7;
        }
        .quick-actions-list {
          display: grid;
          gap: 8px;
          padding: 14px;
        }
        .quick-action-row {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 11px;
          padding: 10px;
          border: 1px solid #e5eaf1;
          border-radius: 9px;
          text-align: left;
          background: #fff;
        }
        .quick-action-row:hover {
          border-color: #a6c9f7;
          background: #f7faff;
        }
        .quick-action-icon {
          display: grid;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 8px;
          color: #2f80ed;
          background: #edf5ff;
        }
        .quick-action-row strong {
          display: block;
          color: #344158;
          font-size: 12px;
        }
        .quick-action-row small {
          display: block;
          margin-top: 2px;
          color: #96a1b1;
          font-size: 10px;
        }
        .review-panel {
          margin-top: 16px;
        }
        .review-badge {
          display: grid;
          width: 18px;
          height: 18px;
          place-items: center;
          border-radius: 50%;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          background: #ef8b3d;
        }
        .review-list {
          padding: 6px 10px 4px;
        }
        .review-row {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 11px;
          padding: 9px 10px;
          border: 0;
          border-radius: 9px;
          text-align: left;
          background: transparent;
        }
        .review-row:hover {
          background: #f7faff;
        }
        .review-row .patient-avatar {
          width: 30px;
          height: 30px;
          font-size: 10px;
        }
        .review-info {
          min-width: 0;
          flex: 1;
        }
        .review-info strong {
          display: block;
          color: #314058;
          font-size: 12px;
        }
        .review-info small {
          display: block;
          margin-top: 2px;
          color: #8b98aa;
          font-size: 10px;
        }
        .review-view-all {
          display: block;
          width: 100%;
          padding: 10px 20px 16px;
          border: 0;
          border-top: 1px solid #edf1f6;
          color: #347ee6;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
          background: transparent;
        }
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          padding: 6px;
        }
        .activity-item {
          display: flex;
          gap: 11px;
          padding: 14px;
          border-radius: 10px;
        }
        .activity-item:hover {
          background: #f9fbfd;
        }
        .activity-icon {
          display: grid;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 8px;
        }
        .activity-item strong {
          display: block;
          color: #344158;
          font-size: 12px;
        }
        .activity-item p {
          margin: 3px 0 0;
          color: #8996a8;
          font-size: 10px;
          line-height: 1.4;
        }
        .activity-item time {
          display: block;
          margin-top: 6px;
          color: #a3afc0;
          font-size: 10px;
        }
        @media (max-width: 1180px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dash-columns {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .stat-grid {
            grid-template-columns: 1fr;
          }
          .activity-grid {
            grid-template-columns: 1fr;
          }
          .dash-greeting-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }
      `}</style>

      <div className="dash-greeting-row">
        <div>
          <h1>{greeting}, Dr. Krishnan</h1>
          <p>{dateLabel} · Medical Oncology · Tata Memorial Centre</p>
        </div>
        <div className="dash-greeting-actions">
          <button className="outline-button">
            <Upload size={14} /> Upload Records
          </button>
          <button className="primary-action" onClick={() => navigate("/voice")}>
            <Mic size={14} /> Start Voice
          </button>
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
                key={item.time + item.name}
                className="consult-row"
                onClick={() => navigate("/patients")}
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
                  key={item.name}
                  className="review-row"
                  onClick={() => navigate("/ai-summary")}
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