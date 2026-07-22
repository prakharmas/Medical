export default function LeftPanel() {
  return (
    <section className="left" aria-label="ClinIQ overview">
      <div className="brand" aria-label="ClinIQ clinical AI platform">
        <div className="brand-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 2.8 13.7 8.3 19.2 10 13.7 11.7 12 17.2l-1.7-5.5L4.8 10l5.5-1.7L12 2.8Z" />
            <path d="M18.3 15.4 19.1 18l2.6.8-2.6.8-.8 2.6-.8-2.6-2.6-.8 2.6-.8.8-2.6Z" />
          </svg>
        </div>
        <div>
          <div className="brand-name">CliniQ</div>
          <div className="brand-tagline">CLINICAL AI PLATFORM</div>
        </div>
      </div>

      <div className="intro">
        <h4>AI CLINICAL DOCUMENTATION</h4>
        <h1>
          Review patient records
          <br />
          in minutes, not hours.
        </h1>
        <p>
          CliniQ structures messy patient documents, generates clinical
          summaries, and lets you dictate notes � all powered by AI built for
          oncologists.
        </p>
        <div className="chips" aria-label="ClinIQ features">
          <span>
            <b>?</b> AI-generated SOAP notes
          </span>
          <span>
            <b>?</b> Voice-to-clinical text
          </span>
          <span>
            <b>?</b> HIPAA compliant
          </span>
        </div>
      </div>

      <div className="footer">
        <div>TRUSTED BY LEADING HOSPITALS</div>
        <p>
          <span>AIIMS</span>
          <span>Tata Memorial</span>
          <span>Apollo</span>
          <span>Fortis</span>
          <span>Manipal</span>
        </p>
      </div>
    </section>
  );
}
