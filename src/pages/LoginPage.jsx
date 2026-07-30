import { useState } from "react";
import { Sparkles, Zap, Mic, ShieldCheck, Building2 } from "lucide-react";
import { login } from "../api/api";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("sso");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");

  const signIn = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await login(email, password, role);
      if (response.data.success) {
        localStorage.setItem("access_token", response.data.token);
        onLogin(role);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <span className="brand-icon">
            <Sparkles size={18} strokeWidth={2.5} />
          </span>
          <div>
            <strong>CliniQ</strong>
            <small>CLINICAL AI PLATFORM</small>
          </div>
        </div>
        <div className="login-message">
          <p>AI CLINICAL DOCUMENTATION</p>
          <h1>
            Review patient records
            <br />
            in minutes, not hours.
          </h1>
          <span>
            CliniQ structures messy patient documents, generates clinical
            summaries, and lets you dictate notes — all powered by AI built for
            oncologists.
          </span>
          <div className="login-chips">
            <b>
              <Zap size={15} />
              AI-generated SOAP notes
            </b>

            <b>
              <Mic size={15} />
              Voice-to-clinical text
            </b>

            <b>
              <ShieldCheck size={15} />
              HIPAA compliant
            </b>
          </div>
        </div>
        <div className="hospital-trust">
          <small>TRUSTED BY LEADING HOSPITALS</small>
          <div>
            AIIMS <span>Tata Memorial</span>
            <span>Apollo</span>
            <span>Fortis</span>
            <span>Manipal</span>
          </div>
        </div>
      </section>
      <main className="login-panel">
        <section className="login-card">
          <h2>Sign in to CliniQ</h2>
          <p>Access your clinical workspace</p>
          <div className="login-tabs">
            <button
              className={mode === "sso" ? "active" : ""}
              onClick={() => setMode("sso")}
            >
              Hospital SSO
            </button>
            <button
              className={mode === "email" ? "active" : ""}
              onClick={() => setMode("email")}
            >
              Email &amp; Password
            </button>
          </div>
          {mode === "sso" ? (
            <div className="login-options">
              <button>
                <i className="azure-icon">M</i>Continue with Microsoft Azure AD
              </button>
              <button>
                <i className="google-icon">G</i>Continue with Google Workspace
              </button>
              <button
                className="sso-button"
                onClick={signIn}
                disabled={loading}
              >
                {loading ? "Signing in" : "  Hospital SSO Login"}
              </button>
            </div>
          ) : (
            <form
              className="email-login"
              onSubmit={(event) => {
                event.preventDefault();
                signIn();
              }}
            >
              <label>
                Username
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              {error && <p className="login-error">{error}</p>}
              <button className="sso-button" type="submit" disabled={loading}>
                {loading ? "Signing in" : "Sign in"}
              </button>
            </form>
          )}
          <small className="login-compliance">
            HIPAA compliant . SOC 2 Type II . ISO 27001 certified
          </small>
        </section>
      </main>
    </div>
  );
}
