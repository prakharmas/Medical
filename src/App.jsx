import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import PatientsPage from "./pages/PatientsPage";
import AiSummaryPage from "./pages/AiSummaryPage";
import SettingsPage from "./pages/SettingsPage";

function LoginRoute() {
  const navigate = useNavigate();
  return <LoginPage onLogin={() => navigate("/patients")} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route element={<AppShell />}>
        <Route path="/patients" element={<PatientsPage />} />
        <Route
          path="/ai-summary"
          element={<AiSummaryPage patient="Priya Sharma" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
