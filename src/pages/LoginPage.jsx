import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("sso");
  const [loading, setLoading] = useState(false);
  const signIn = () => {
    setLoading(true);
    setTimeout(onLogin, 450);
  };
  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <span>?</span>
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
            summaries, and lets you dictate notes � all powered by AI built for
            oncologists.
          </span>
          <div className="login-chips">
            <b>? AI-generated SOAP notes</b>
            <b>? Voice-to-clinical text</b>
            <b>? HIPAA compliant</b>
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
                {loading ? "Signing in�" : "?  Hospital SSO Login"}
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
                Email address
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </label>
              <button className="sso-button" disabled={loading}>
                {loading ? "Signing in�" : "Sign in"}
              </button>
            </form>
          )}
          <small className="login-compliance">
            HIPAA compliant � SOC 2 Type II � ISO 27001 certified
          </small>
        </section>
      </main>
    </div>
  );
}
