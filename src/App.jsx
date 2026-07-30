import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import VoicePage from "./pages/VoicePage";
import PatientProfilePage from "./pages/PatientProfilePage";
import AiSummaryPage from "./pages/AiSummaryPage";
import ReportsPage from "./pages/ReportsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";

function LoginRoute() {
  const navigate = useNavigate();
  return <LoginPage onLogin={(role) => navigate(role === "admin" ? "/admin" : "/dashboard")} />;
}

function ProtectedRoute() {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/patients/:patientId" element={<PatientProfilePage />} />
          <Route
            path="/ai-summary"
            element={<AiSummaryPage patient="Priya Sharma" />}
          />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}