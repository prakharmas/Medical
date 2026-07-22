import { useState } from "react";
import LeftPanel from "../components/LeftPanel";
import LoginCard from "../components/LoginCard";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("sso");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = (event) => {
    event.preventDefault();
    alert(`Login with Email: ${email}`);
  };

  return (
    <div className="page">
      <LeftPanel />
      <LoginCard activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "sso" ? (
          <div className="sso-options" role="tabpanel">
            <button className="btn provider-btn" type="button"><span className="provider-icon azure">M</span>Continue with Microsoft Azure AD</button>
            <button className="btn provider-btn" type="button"><span className="provider-icon google">G</span>Continue with Google Workspace</button>
            <button className="primary" type="button"><span aria-hidden="true">?</span> Hospital SSO Login</button>
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} role="tabpanel">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="doctor@hospital.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <button className="primary" type="submit">Sign In</button>
          </form>
        )}
      </LoginCard>
    </div>
  );
}
