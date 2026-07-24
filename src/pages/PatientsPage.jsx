import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPatient, listPatientsDetailed } from "../api/api";

function mapApiPatient(p) {
  const genderSuffix = p.gender === "male" ? "M" : p.gender === "female" ? "F" : "";
  const birth = p.dob ? new Date(p.dob * 1000) : null;
  let ageStr = "";
  if (birth) {
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    ageStr = `${age}${genderSuffix}`;
  }
  return {
    name: p.name,
    initials: p.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    age: ageStr || "—",
    status: "Active",
    statusClass: "active",
    diagnosis: p.primary_condition?.diagnosis || "—",
    stage: p.primary_condition?.stage_or_severity || "",
    uhid: p.uid,
    mrn: "—",
    doctor: p.doctor_name || "—",
    visit: "—",
    gender: p.gender,
    dob: p.dob,
    _raw: p,
  };
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    dob: "",
    gender: "male",
    abha_id: "",
  });
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    listPatientsDetailed()
      .then((res) => {
        if (res.data.success && res.data.patients?.length) {
          setPatients(res.data.patients.map(mapApiPatient));
        }
      })
      .catch(() => {});
  }, []);

  const visible = patients.filter((patient) =>
    `${patient.name} ${patient.uhid} ${patient.mrn} ${patient.diagnosis} ${patient.doctor}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const payload = {
        name: createForm.name,
        record_id: null,
        abha_id: createForm.abha_id || null,
        dob: new Date(createForm.dob).getTime() / 1000,
        gender: createForm.gender,
        preset_uid: null,
      };

      const response = await createPatient(payload);

      if (response.data.success) {
        setShowCreateModal(false);
        setCreateForm({ name: "", dob: "", gender: "male", abha_id: "" });
        alert(`Patient created successfully! UID: ${response.data.uid}`);
        listPatientsDetailed()
          .then((res) => {
            if (res.data.success && res.data.patients?.length) {
              setPatients(res.data.patients.map(mapApiPatient));
            }
          })
          .catch(() => {});
      } else {
        setCreateError("Failed to create patient. Please try again.");
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create patient. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

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
        <button
          className="create-patient-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + New Patient
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Patient</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreatePatient}>
              <div className="modal-body">
                <div className="settings-field">
                  <label>Patient Name *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div className="settings-field">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={createForm.dob}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, dob: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="settings-field">
                  <label>Gender *</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, gender: e.target.value })
                    }
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label>ABHA ID (Optional)</label>
                  <input
                    type="text"
                    value={createForm.abha_id}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, abha_id: e.target.value })
                    }
                    placeholder="Enter ABHA ID"
                  />
                </div>
                {createError && <p className="create-error">{createError}</p>}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit"
                  disabled={createLoading}
                >
                  {createLoading ? "Creating..." : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2 className="recent-label">RECENT PATIENTS</h2>

      <section className="reference-patient-list">
        {visible.map((patient) => (
          <button
            key={patient.uhid}
            className={`reference-patient-card ${selectedPatient === patient.name ? "chosen" : ""}`}
            onClick={() => {
              setSelectedPatient(patient.name);
              navigate(`/patients/${patient.uhid}`, { state: { patient: patient._raw } });
            }}
          >
            <span className="reference-avatar">{patient.initials}</span>

            <span className="reference-patient-info">
              <span className="patient-name-line">
                <strong>{patient.name}</strong>
                <em>{patient.age}</em>
                {patient.status && (
                  <b className={patient.statusClass}>{patient.status}</b>
                )}
              </span>
              {patient.diagnosis && patient.diagnosis !== "—" && (
                <span className="patient-diagnosis">{patient.diagnosis}</span>
              )}
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
