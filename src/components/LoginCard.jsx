export default function LoginCard({ activeTab, onTabChange, children }) {
  return (
    <main className="right">
      <section className="card" aria-label="Sign in to ClinIQ">
        <h2>Sign in to CliniQ</h2>
        <p>Access your clinical workspace</p>
        <div className="tabs" role="tablist" aria-label="Sign in method">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sso"}
            className={`tab ${activeTab === "sso" ? "active" : ""}`}
            onClick={() => onTabChange("sso")}
          >
            Hospital SSO
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "email"}
            className={`tab ${activeTab === "email" ? "active" : ""}`}
            onClick={() => onTabChange("email")}
          >
            Email &amp; Password
          </button>
        </div>
        {children}
        <p className="compliance">
          HIPAA compliant · SOC 2 Type II · ISO 27001 certified
        </p>
      </section>
    </main>
  );
}
