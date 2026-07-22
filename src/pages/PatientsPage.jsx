import { useState } from "react";

const patients = [
  {
    name: "Priya Sharma",
    initials: "PS",
    age: "48F",
    status: "Active",
    statusClass: "active",
    diagnosis: "Breast Cancer (IDC) · Stage IIIB",
    uhid: "ONC-2024-001",
    mrn: "MRN-88234",
    doctor: "Dr. Ananya Krishnan",
    visit: "2024-07-18",
  },
  {
    name: "Rajesh Kumar",
    initials: "RK",
    age: "62M",
    status: "Follow-up",
    statusClass: "followup",
    diagnosis: "Non-Small Cell Lung Cancer · Stage IIA",
    uhid: "ONC-2024-002",
    mrn: "MRN-77401",
    doctor: "Dr. Vikram Mehta",
    visit: "2024-07-17",
  },
  {
    name: "Sunita Reddy",
    initials: "SR",
    age: "55F",
    status: "Critical",
    statusClass: "critical",
    diagnosis: "Ovarian Cancer (HGSOC) · Stage IIC",
    uhid: "ONC-2024-003",
    mrn: "MRN-91823",
    doctor: "Dr. Priya Nair",
    visit: "2024-07-16",
  },
  {
    name: "Mohammed Aslam",
    initials: "MA",
    age: "70M",
    status: "Active",
    statusClass: "active",
    diagnosis: "Colorectal Cancer · Stage III",
    uhid: "ONC-2024-004",
    mrn: "MRN-66123",
    doctor: "Dr. Ananya Krishnan",
    visit: "2024-07-15",
  },
  {
    name: "Lalita Devi",
    initials: "LD",
    age: "45F",
    status: "Remission",
    statusClass: "remission",
    diagnosis: "Cervical Cancer (SCC) · Stage IB1",
    uhid: "ONC-2024-005",
    mrn: "MRN-54201",
    doctor: "Dr. Rahul Sinha",
    visit: "2024-07-14",
  },
];

export default function PatientsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");

  const visible = patients.filter((patient) =>
    `${patient.name} ${patient.uhid} ${patient.mrn} ${patient.diagnosis}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="reference-patients">
      <div className="patient-page-heading">
        <h1>Patient Search</h1>
        <p>Search by UHID, MRN, phone number, or name</p>
      </div>

      <div className="patient-search-row">
        <div className="large-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients…"
          />
        </div>
        <div className="search-filter-tabs">
          {["All", "UHID", "MRN", "Phone", "Name"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <h2 className="recent-label">RECENT PATIENTS</h2>

      <section className="reference-patient-list">
        {visible.map((patient) => (
          <button
            key={patient.uhid}
            className={`reference-patient-card ${selectedPatient === patient.name ? "chosen" : ""}`}
            onClick={() => setSelectedPatient(patient.name)}
          >
            <span className="reference-avatar">{patient.initials}</span>

            <span className="reference-patient-info">
              <span className="patient-name-line">
                <strong>{patient.name}</strong>
                <em>{patient.age}</em>
                <b className={patient.statusClass}>{patient.status}</b>
              </span>
              <span className="patient-diagnosis">{patient.diagnosis}</span>
              <span className="patient-meta">
                UHID: {patient.uhid} <i /> MRN: {patient.mrn} <i />{" "}
                {patient.doctor}
              </span>
            </span>

            <span className="last-visit">
              <small>▦&nbsp; Last visit</small>
              <strong>{patient.visit}</strong>
            </span>

            <span className="patient-arrow">›</span>
          </button>
        ))}
      </section>
    </div>
  );
}
