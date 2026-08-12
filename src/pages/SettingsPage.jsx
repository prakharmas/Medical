import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Plus,
  Info,
  Ellipsis,
  Settings,
  Upload,
  X,
} from "lucide-react";
import {
  createPadTemplate,
  uploadPadTemplate,
  listPadTemplatesDetailed,
  getPadTemplateDetails,
  getPadTemplateImage,
  editPadTemplate,
} from "../api/api";

const emptyTemplateForm = {
  filename: "",
  preset_uid: "",
  margins: { top: 0, left: 0, right: 0, bottom: 0 },
  date_location: { x: 0, y: 0 },
  font: { name: "", size: 12 },
};

const mapPadTemplate = (p) => {
  const uploadedAt = p.uploaded_at ? new Date(p.uploaded_at * 1000) : null;
  const name = p.filename || p.uid;
  return {
    id: p.uid,
    name,
    sections: null,
    department: "—",
    status: uploadedAt ? "Active" : "Draft",
    createdBy: "—",
    lastUpdated: uploadedAt
      ? uploadedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
    isDefault: Boolean(p.is_default),
  };
};

const features = [
  {
    icon: "\uD83C\uDFA4",
    name: "Voice Dictation",
    desc: "Real-time speech-to-text during consultations",
    on: true,
  },
  {
    icon: "\u2728",
    name: "AI Summary",
    desc: "Auto-generate structured clinical summaries from documents",
    on: true,
  },
  {
    icon: "\uD83D\uDCC5",
    name: "Timeline Generator",
    desc: "Automatically build treatment timelines from records",
    on: true,
  },
  {
    icon: "\uD83D\uDC8A",
    name: "Drug Interaction Alerts",
    desc: "Warn about potential drug interactions in medication lists",
    on: true,
  },
  {
    icon: "\uD83D\uDD22",
    name: "Clinical Coding (ICD-10)",
    desc: "Automatic ICD-10 code suggestions from diagnoses",
    on: true,
  },
  {
    icon: "\uD83D\uDCAC",
    name: "AI Chat Assistant",
    desc: "Ask AI questions about the patient using document context",
    on: true,
  },
  {
    icon: "\uD83D\uDD0D",
    name: "OCR Processing",
    desc: "Extract text from scanned documents and images",
    on: true,
  },
  {
    icon: "\uD83C\uDF10",
    name: "Translation",
    desc: "Translate documents and summaries to regional languages",
    on: true,
  },
  {
    icon: "\uD83D\uDD14",
    name: "Follow-up Reminders",
    desc: "Automated reminders for patient follow-up scheduling",
    on: true,
  },
  {
    icon: "\uD83D\uDCDD",
    name: "Auto SOAP Notes",
    desc: "Generate SOAP notes from voice sessions automatically",
    on: true,
  },
];

export default function SettingsPage() {
  const [featureStates, setFeatureStates] = useState(features.map((f) => f.on));
  const [autoSummary, setAutoSummary] = useState(true);
  const [saved, setSaved] = useState(false);
  const [templateList, setTemplateList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [templateFormError, setTemplateFormError] = useState("");
  const [templateImage, setTemplateImage] = useState(null);
  const [templateImageUrl, setTemplateImageUrl] = useState("");
  const [templateImageSize, setTemplateImageSize] = useState(null);
  const [viewTemplate, setViewTemplate] = useState(null);
  const [viewTemplateError, setViewTemplateError] = useState("");
  const [viewTemplateLoading, setViewTemplateLoading] = useState(false);
  const [viewTemplateImageUrl, setViewTemplateImageUrl] = useState("");
  const [editTemplate, setEditTemplate] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editTemplateError, setEditTemplateError] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [editTemplateImage, setEditTemplateImage] = useState(null);
  const [editTemplateImageUrl, setEditTemplateImageUrl] = useState("");
  const [editTemplateImageSize, setEditTemplateImageSize] = useState(null);
  const [defaultSavingId, setDefaultSavingId] = useState(null);
  const [setDefaultError, setSetDefaultError] = useState("");
  const imageBoxRef = useRef(null);
  const editImageBoxRef = useRef(null);
  const dragRef = useRef(null);
  const normMarginsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadPadTemplates = async () => {
      try {
        const res = await listPadTemplatesDetailed();
        if (cancelled) return;
        const list = res.data?.pad_templates || [];
        if (res.data?.success && list.length) {
          setTemplateList(list.map(mapPadTemplate));
        }
      } catch {
        // keep the fallback sample list on failure
      }
    };
    loadPadTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const setDefaultTemplate = async (id) => {
    setDefaultSavingId(id);
    setSetDefaultError("");
    try {
      const res = await getPadTemplateDetails(id);
      if (!res.data?.success) {
        setSetDefaultError(res.data?.reason || "Failed to load template details.");
        return;
      }
      const info = res.data.info;
      await editPadTemplate({
        uid: id,
        template_info: info.template_info,
        is_default: true,
      });
      setTemplateList((p) => p.map((t) => ({ ...t, isDefault: t.id === id })));
    } catch (err) {
      setSetDefaultError(
        err.response?.data?.reason || err.message || "Failed to set default template."
      );
    } finally {
      setDefaultSavingId(null);
    }
  };

  const openViewTemplateModal = async (t) => {
    setViewTemplateLoading(true);
    setViewTemplateError("");
    setViewTemplateImageUrl("");
    setViewTemplate({ template: t, details: null });
    try {
      const res = await getPadTemplateDetails(t.id);
      if (res.data?.success) {
        setViewTemplate({ template: t, details: res.data.info });
      } else {
        setViewTemplateError(res.data?.reason || "Failed to load template details.");
      }
      try {
        const imgRes = await getPadTemplateImage(t.id);
        if (imgRes.data?.size) {
          setViewTemplateImageUrl(URL.createObjectURL(imgRes.data));
        }
      } catch {
        // image is optional; keep details-only view
      }
    } catch (err) {
      setViewTemplateError(
        err.response?.data?.reason || err.message || "Failed to load template details."
      );
    } finally {
      setViewTemplateLoading(false);
    }
  };

  const closeViewTemplateModal = () => {
    if (viewTemplateImageUrl) URL.revokeObjectURL(viewTemplateImageUrl);
    setViewTemplateImageUrl("");
    setViewTemplate(null);
  };

  const downloadViewTemplateImage = () => {
    if (!viewTemplateImageUrl) return;
    const a = document.createElement("a");
    a.href = viewTemplateImageUrl;
    const name = viewTemplate.template.name || "pad-template";
    a.download = /\.[^./]+$/.test(name) ? name : `${name}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const openEditTemplateModal = async (t) => {
    setEditingTemplate(false);
    setEditTemplateError("");
    if (editTemplateImageUrl) URL.revokeObjectURL(editTemplateImageUrl);
    setEditTemplateImage(null);
    setEditTemplateImageUrl("");
    setEditTemplateImageSize(null);
    setEditTemplate({ template: t, details: null });
    try {
      const res = await getPadTemplateDetails(t.id);
      if (res.data?.success) {
        const info = res.data.info;
        setEditTemplate({ template: t, details: info });
        normMarginsRef.current = {
          top: Number(info.template_info.margins.top),
          left: Number(info.template_info.margins.left),
          right: Number(info.template_info.margins.right),
          bottom: Number(info.template_info.margins.bottom),
        };
        setEditForm({
          margins: {
            top: normMarginsRef.current.top,
            left: normMarginsRef.current.left,
            right: normMarginsRef.current.right,
            bottom: normMarginsRef.current.bottom,
          },
          date_location: {
            x: Number(info.template_info.date_location.x),
            y: Number(info.template_info.date_location.y),
          },
          font: {
            name: info.template_info.font.name || "",
            size: Number(info.template_info.font.size),
          },
          is_default: Boolean(info.is_default),
        });
      } else {
        setEditTemplate({ template: t, details: null });
        setEditTemplateError(res.data?.reason || "Failed to load template details.");
      }
      try {
        const imgRes = await getPadTemplateImage(t.id);
        if (imgRes.data?.size) {
          setEditTemplateImageUrl(URL.createObjectURL(imgRes.data));
        }
      } catch {
        // image is optional; keep details-only edit
      }
    } catch (err) {
      setEditTemplate({ template: t, details: null });
      setEditTemplateError(
        err.response?.data?.reason || err.message || "Failed to load template details."
      );
    }
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editTemplateImageUrl) URL.revokeObjectURL(editTemplateImageUrl);
    setEditTemplateImage(file);
    setEditTemplateImageUrl(URL.createObjectURL(file));
    setEditTemplateImageSize(null);
  };

  const closeEditTemplateModal = () => {
    if (editTemplateImageUrl) URL.revokeObjectURL(editTemplateImageUrl);
    setEditTemplate(null);
    setEditForm(null);
    setEditTemplateImage(null);
    setEditTemplateImageUrl("");
    setEditTemplateImageSize(null);
    normMarginsRef.current = null;
  };

  const updateEditInfo = (key, subKey, value) =>
    setEditForm((p) => ({ ...p, [key]: { ...p[key], [subKey]: value } }));

  const handleEditTemplate = async (e) => {
    e.preventDefault();
    setEditingTemplate(true);
    setEditTemplateError("");
    try {
      const payload = {
        uid: editTemplate.template.id,
        template_info: {
          margins: marginsToNormalized(editForm.margins, editTemplateImageSize),
          date_location: {
            x: Number(editForm.date_location.x),
            y: Number(editForm.date_location.y),
          },
          font: {
            name: editForm.font.name || null,
            size: Number(editForm.font.size),
          },
        },
        is_default: Boolean(editForm.is_default),
      };
      const res = await editPadTemplate(payload);
      if (res.data?.success) {
        if (editTemplateImage) {
          const formData = new FormData();
          formData.append("pad_template_uid", editTemplate.template.id);
          formData.append("file", fileWithMime(editTemplateImage));
          const upRes = await uploadPadTemplate(formData);
          if (!upRes.data?.success) {
            const reason = upRes.data?.reason;
            throw new Error(
              `Template updated, but image upload failed${
                reason ? `: ${reason}` : "."
              }`
            );
          }
        }
        setTemplateList((p) =>
          p.map((t) =>
            t.id === editTemplate.template.id
              ? { ...t, isDefault: payload.is_default }
              : payload.is_default
                ? { ...t, isDefault: false }
                : t
          )
        );
        if (editTemplateImageUrl) URL.revokeObjectURL(editTemplateImageUrl);
        setEditTemplate(null);
        setEditForm(null);
        setEditTemplateImage(null);
        setEditTemplateImageUrl("");
        setEditTemplateImageSize(null);
        normMarginsRef.current = null;
      } else {
        setEditTemplateError(
          res.data?.reason
            ? `Update rejected: ${res.data.reason}`
            : "Failed to update template."
        );
      }
    } catch (err) {
      setEditTemplateError(
        err.response?.data?.reason || err.message || "Failed to update template."
      );
    } finally {
      setEditingTemplate(false);
    }
  };

  const openCreateTemplateModal = () => {
    setTemplateForm({
      ...emptyTemplateForm,
      font: { ...emptyTemplateForm.font },
      margins: { ...emptyTemplateForm.margins },
      date_location: { ...emptyTemplateForm.date_location },
    });
    setTemplateFormError("");
    setTemplateImage(null);
    setTemplateImageUrl("");
    setTemplateImageSize(null);
    setShowCreateModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (templateImageUrl) URL.revokeObjectURL(templateImageUrl);
    setTemplateImage(file);
    setTemplateImageUrl(URL.createObjectURL(file));
    setTemplateForm((p) => ({
      ...p,
      filename: p.filename || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const imageExtension = (file) => {
    const ext = file?.name?.split(".")?.pop()?.toLowerCase();
    return ext && ext !== file?.name ? ext : "png";
  };

  const fileWithMime = (file) => {
    const map = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      pdf: "application/pdf",
    };
    const mime = map[imageExtension(file)] || file?.type || "image/png";
    if (!file || file.type === mime) return file;
    return new File([file], file.name, {
      type: mime,
      lastModified: file.lastModified,
    });
  };

  const filenameWithExtension = (name, file) => {
    const trimmed = (name || "").trim();
    const ext = imageExtension(file);
    return /\.[^./]+$/.test(trimmed)
      ? trimmed
      : `${trimmed || "pad-template"}.${ext}`;
  };

  const marginsToNormalized = (margins, size) => ({
    top: size?.h ? Number(margins.top) / size.h : Number(margins.top),
    left: size?.w ? Number(margins.left) / size.w : Number(margins.left),
    right: size?.w ? Number(margins.right) / size.w : Number(margins.right),
    bottom: size?.h ? Number(margins.bottom) / size.h : Number(margins.bottom),
  });

  const marginsToPixels = (margins, size) => ({
    top: size?.h ? Math.round(Number(margins.top) * size.h) : Number(margins.top),
    left: size?.w ? Math.round(Number(margins.left) * size.w) : Number(margins.left),
    right: size?.w ? Math.round(Number(margins.right) * size.w) : Number(margins.right),
    bottom: size?.h ? Math.round(Number(margins.bottom) * size.h) : Number(margins.bottom),
  });

  const displayedSize = (boxRef = imageBoxRef) => {
    const box = boxRef.current;
    const img = box?.querySelector("img");
    if (!img || !img.naturalWidth) return null;
    const rect = img.getBoundingClientRect();
    return {
      scaleX: img.naturalWidth / rect.width,
      scaleY: img.naturalHeight / rect.height,
      rect,
    };
  };

  const startDrag = (side, e, boxRef = imageBoxRef, update = updateTemplateInfo) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { side };
    const onMove = (ev) => {
      const { scaleX, scaleY, rect } = displayedSize(boxRef) || {};
      if (!rect) return;
      if (side === "top" || side === "bottom") {
        const rel = (ev.clientY - rect.top) / rect.height;
        const val = Math.max(0, Math.min(100, rel * 100));
        update("margins", side, Math.round(val * scaleY));
      } else {
        const rel = (ev.clientX - rect.left) / rect.width;
        const val = Math.max(0, Math.min(100, rel * 100));
        update("margins", side, Math.round(val * scaleX));
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    onMove(e);
  };

  const startDateDrag = (e, boxRef = imageBoxRef, update = updateTemplateInfo) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { side: "date" };
    const onMove = (ev) => {
      const { scaleX, scaleY, rect } = displayedSize(boxRef) || {};
      if (!rect) return;
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      update("date_location", "x", Math.round(Math.max(0, Math.min(1, x)) * scaleX));
      update("date_location", "y", Math.round(Math.max(0, Math.min(1, y)) * scaleY));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    onMove(e);
  };

  const updateTemplateInfo = (key, subKey, value) =>
    setTemplateForm((p) => ({ ...p, [key]: { ...p[key], [subKey]: value } }));

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setSavingTemplate(true);
    setTemplateFormError("");
    try {
      const payload = {
        template_info: {
          margins: marginsToNormalized(templateForm.margins, templateImageSize),
          date_location: {
            x: Number(templateForm.date_location.x),
            y: Number(templateForm.date_location.y),
          },
          font: {
            name: templateForm.font.name || null,
            size: Number(templateForm.font.size),
          },
        },
        filename: filenameWithExtension(templateForm.filename, templateImage),
        preset_uid: templateForm.preset_uid || null,
      };
      const res = await createPadTemplate(payload);
      const uid = res.data?.uid;
      if (uid && templateImage) {
        const formData = new FormData();
        formData.append("pad_template_uid", uid);
        formData.append("file", fileWithMime(templateImage));
        const upRes = await uploadPadTemplate(formData);
        if (!upRes.data?.success) {
          const reason = upRes.data?.reason;
          throw new Error(
            `Pad template created (${uid}), but image upload failed${
              reason ? `: ${reason}` : "."
            }`
          );
        }
      }
      if (res.data.success) {
        setTemplateList((p) => [
          ...p,
          {
            id: uid || Date.now(),
            name: templateForm.filename,
            sections: 0,
            department: "—",
            status: "Draft",
            createdBy: "You",
            lastUpdated: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            isDefault: false,
          },
        ]);
        setShowCreateModal(false);
      }
    } catch (err) {
      const reason = err.response?.data?.reason;
      setTemplateFormError(
        reason
          ? `Upload rejected: ${reason}${err.response?.data?.field_name ? ` (${err.response?.data?.field_name})` : ""}`
          : err.message || "Failed to create template."
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const toggleFeature = (i) =>
    setFeatureStates((p) => p.map((v, j) => (j === i ? !v : v)));

  const enabledCount = featureStates.filter(Boolean).length;

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>Settings</h1>
        <p>Customize ClinIQ for your workflow</p>
      </div>

      <div className="settings-sections">
        <div className="settings-section-card">
          <div className="settings-section-header">
            <Sparkles
              width="16"
              height="16"
              strokeWidth="1.75"
              className="settings-section-icon"
            />
            <span className="settings-section-title">AI Preferences</span>
          </div>
          <div className="settings-section-body settings-grid-2">
            <div className="settings-field">
              <label>Medical Specialty</label>
              <select defaultValue="Medical Oncology">
                <option>Medical Oncology</option>
                <option>Radiation Oncology</option>
                <option>Surgical Oncology</option>
                <option>Hemato-Oncology</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Language</label>
              <select defaultValue="English">
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Tamil</option>
                <option>Bengali</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Voice Model</label>
              <select defaultValue="ClinIQ-Voice-Pro">
                <option>ClinIQ-Voice-Pro</option>
                <option>Standard</option>
                <option>Fast</option>
              </select>
            </div>
            <div className="settings-field">
              <label>Summary Style</label>
              <select defaultValue="SOAP Format">
                <option>SOAP Format</option>
                <option>Narrative</option>
                <option>Bullet Points</option>
              </select>
            </div>
            <div className="settings-field settings-field-full">
              <div className="settings-toggle-row">
                <div>
                  <div className="settings-toggle-label">
                    Auto Summary on Upload
                  </div>
                  <div className="settings-toggle-desc">
                    Automatically generate AI summary when documents are
                    uploaded
                  </div>
                </div>
                <button
                  className={`toggle ${autoSummary ? "on" : ""}`}
                  onClick={() => setAutoSummary(!autoSummary)}
                  aria-label="Auto Summary on Upload"
                >
                  <i />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section-card">
          <div className="settings-section-header">
            <ShieldCheck
              width="16"
              height="16"
              strokeWidth="1.75"
              className="settings-section-icon"
            />
            <span className="settings-section-title">Hospital Branding</span>
          </div>
          <div className="settings-section-body settings-grid-2">
            <div className="settings-field">
              <label>Hospital Name</label>
              <input defaultValue="Tata Memorial Centre" />
            </div>
            <div className="settings-field">
              <label>Department</label>
              <input defaultValue="Medical Oncology" />
            </div>
            <div className="settings-field">
              <label>Unit</label>
              <input defaultValue="Oncology Unit B" />
            </div>
            <div className="settings-field">
              <label>Contact</label>
              <input defaultValue="+91-22-2417-7000" />
            </div>
            <div className="settings-field">
              <label>Hospital Logo</label>
              <div className="settings-logo-upload">
                <div className="settings-logo-placeholder">TMC</div>
                <span>Click to upload logo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section-card">
          <div className="settings-section-header">
            <FileText
              width="16"
              height="16"
              strokeWidth="1.75"
              className="settings-section-icon"
            />
            <span className="settings-section-title">Consultation Templates</span>
            <button
              className="settings-add-template-btn"
              onClick={openCreateTemplateModal}
            >
              <Plus width="14" height="14" strokeWidth="2.5" />
              Add OPD Format
            </button>
          </div>
          <div className="settings-section-body">
            <div className="settings-template-note">
              <Info width="16" height="16" strokeWidth="2" />
              <p>
                <strong>Your format, your way.</strong> ClinIQ adapts to the OPD
                format your doctors already use — no need to rebuild your
                templates from scratch.
              </p>
            </div>
            <div className="settings-template-table-wrap">
              <table className="settings-template-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    {/* <th>Department</th> */}
                    {/* <th>Status</th> */}
                    {/* <th>Created By</th> */}
                    <th>Uploaded At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templateList.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="settings-template-name">
                          <div className="settings-template-file-icon">
                            <FileText width="14" height="14" strokeWidth="2" />
                          </div>
                          <div>
                            <b>{t.name}</b>
                            <span>
                              {t.sections == null
                                ? "—"
                                : `${t.sections} ${
                                    t.sections === 1 ? "section" : "sections"
                                  }`}
                            </span>
                          </div>
                          {t.isDefault && (
                            <span className="settings-template-default">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      {/* <td className="settings-template-cell">{t.department}</td> */}
                      {/* <td>
                        <span
                          className={`settings-template-status ${t.status.toLowerCase()}`}
                        >
                          <span className="dot" />
                          {t.status}
                        </span>
                      </td> */}
                      {/* <td className="settings-template-cell">{t.createdBy}</td> */}
                      <td className="settings-template-cell-light">
                        {t.lastUpdated}
                      </td>
                      <td>
                        <div className="settings-template-actions">
                          <button
                            className="settings-template-btn"
                            onClick={() => openViewTemplateModal(t)}
                          >
                            View
                          </button>
                          <button
                            className="settings-template-btn"
                            onClick={() => openEditTemplateModal(t)}
                          >
                            Edit
                          </button>
                          {!t.isDefault && (
                            <button
                              className="settings-template-btn"
                              onClick={() => setDefaultTemplate(t.id)}
                              disabled={defaultSavingId === t.id}
                            >
                              {defaultSavingId === t.id
                                ? "Saving..."
                                : "Set Default"}
                            </button>
                          )}
                          {/* <button
                            className="settings-template-more"
                            aria-label="More actions"
                          >
                            <Ellipsis width="14" height="14" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="settings-template-footnote">
              Templates with <strong>Default</strong> status are automatically
              selected when a doctor starts a consultation in that department.
            </p>
            {setDefaultError && (
              <p className="settings-modal-error">{setDefaultError}</p>
            )}
          </div>
        </div>

        <div className="settings-section-card">
          <div className="settings-section-header">
            <Settings
              width="16"
              height="16"
              strokeWidth="1.75"
              className="settings-section-icon"
            />
            <span className="settings-section-title">Features</span>
            <span className="settings-section-count">
              {enabledCount} / {features.length} enabled
            </span>
          </div>
          <div className="settings-feature-list">
            {features.map((f, i) => (
              <div className="settings-feature-row" key={f.name}>
                <span className="settings-feature-icon">{f.icon}</span>
                <div className="settings-feature-info">
                  <div className="settings-feature-name">{f.name}</div>
                  <div className="settings-feature-desc">{f.desc}</div>
                </div>
                <button
                  className={`toggle ${featureStates[i] ? "on" : ""}`}
                  onClick={() => toggleFeature(i)}
                  aria-label={`${f.name} ${featureStates[i] ? "enabled" : "disabled"}`}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-actions">
          <button
            className="settings-save-btn"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
          <button className="settings-reset-btn">Reset to Defaults</button>
        </div>
      </div>

      {showCreateModal && (
        <div className="settings-modal-overlay">
          <div
            className={`settings-modal ${templateImageUrl ? "settings-modal-preview" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h2>Add OPD Format</h2>
              <button
                className="settings-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X width="18" height="18" />
              </button>
            </div>
            <form className="settings-modal-form" onSubmit={handleCreateTemplate}>
              <span className="settings-modal-label">
                1. Upload pad image
              </span>
              {!templateImageUrl ? (
                <label className="settings-pad-upload">
                  <Upload
                    width="22"
                    height="22"
                    strokeWidth="1.75"
                    className="settings-pad-upload-icon"
                  />
                  <b>Click to upload your OPD pad image</b>
                  <span>PNG, JPG or PDF preview — drag margins on it below</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="settings-pad-editor" ref={imageBoxRef}>
                  <img
                    src={templateImageUrl}
                    alt="Pad template preview"
                    onLoad={(e) =>
                      setTemplateImageSize({
                        w: e.target.naturalWidth,
                        h: e.target.naturalHeight,
                      })
                    }
                  />
                  {templateImageSize && (
                    <>
                      <div
                        className="settings-pad-margin pad-margin-top"
                        style={{ height: `${(templateForm.margins.top / templateImageSize.h) * 100}%` }}
                        onPointerDown={(e) => startDrag("top", e)}
                      >
                        <span className="pad-handle" />
                        <i className="pad-label">Top</i>
                      </div>
                      <div
                        className="settings-pad-margin pad-margin-bottom"
                        style={{ height: `${(templateForm.margins.bottom / templateImageSize.h) * 100}%` }}
                        onPointerDown={(e) => startDrag("bottom", e)}
                      >
                        <span className="pad-handle" />
                        <i className="pad-label">Bottom</i>
                      </div>
                      <div
                        className="settings-pad-margin pad-margin-left"
                        style={{ width: `${(templateForm.margins.left / templateImageSize.w) * 100}%` }}
                        onPointerDown={(e) => startDrag("left", e)}
                      >
                        <span className="pad-handle" />
                        <i className="pad-label">Left</i>
                      </div>
                      <div
                        className="settings-pad-margin pad-margin-right"
                        style={{ width: `${(templateForm.margins.right / templateImageSize.w) * 100}%` }}
                        onPointerDown={(e) => startDrag("right", e)}
                      >
                        <span className="pad-handle" />
                        <i className="pad-label">Right</i>
                      </div>
                      <div
                        className="settings-pad-date"
                        title="Drag to set date location"
                        style={{
                          left: `${(templateForm.date_location.x / templateImageSize.w) * 100}%`,
                          top: `${(templateForm.date_location.y / templateImageSize.h) * 100}%`,
                        }}
                        onPointerDown={startDateDrag}
                      >
                        <span className="pad-date-label">Date</span>
                      </div>
                      <button
                        type="button"
                        className="settings-pad-change-img"
                        onClick={() => {
                          setTemplateImage(null);
                          setTemplateImageUrl("");
                          setTemplateImageSize(null);
                        }}
                      >
                        Change image
                      </button>
                    </>
                  )}
                </div>
              )}
              <label>
                Filename *
                <input
                  name="filename"
                  value={templateForm.filename}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, filename: e.target.value })
                  }
                  required
                  placeholder="e.g. oncology-followup (extension added automatically)"
                />
              </label>
              <label>
                Preset UID
                <input
                  name="preset_uid"
                  value={templateForm.preset_uid}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      preset_uid: e.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </label>
              <span className="settings-modal-label">2. Margins (drag on image)</span>
              <div className="settings-modal-row">
                {["top", "left", "right", "bottom"].map((m) => (
                  <label key={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                    <input
                      type="number"
                      min="0"
                      value={templateForm.margins[m]}
                      onChange={(e) =>
                        updateTemplateInfo("margins", m, e.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
              <span className="settings-modal-label">3. Date Location (drag Date marker)</span>
              <div className="settings-modal-row">
                {["x", "y"].map((a) => (
                  <label key={a}>
                    {a.toUpperCase()}
                    <input
                      type="number"
                      min="0"
                      value={templateForm.date_location[a]}
                      onChange={(e) =>
                        updateTemplateInfo("date_location", a, e.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
              <span className="settings-modal-label">4. Font</span>
              <div className="settings-modal-row">
                <label>
                  Name
                  <input
                    value={templateForm.font.name}
                    onChange={(e) =>
                      updateTemplateInfo("font", "name", e.target.value)
                    }
                    placeholder="e.g. Arial"
                  />
                </label>
                <label>
                  Size
                  <input
                    type="number"
                    value={templateForm.font.size}
                    onChange={(e) =>
                      updateTemplateInfo("font", "size", e.target.value)
                    }
                  />
                </label>
              </div>
              {templateFormError && (
                <p className="settings-modal-error">{templateFormError}</p>
              )}
              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-outline-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={savingTemplate}
                >
                  {savingTemplate
                    ? "Saving..."
                    : templateImage
                      ? "Save & Upload Template"
                      : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewTemplate && (
        <div className="settings-modal-overlay">
          <div
            className="settings-modal settings-modal-preview settings-view-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-view-header">
              <div className="settings-view-title">
                <span className="settings-view-icon">
                  <FileText width="18" height="18" strokeWidth="1.75" />
                </span>
                <div>
                  <h2>{viewTemplate.template.name}</h2>
                  <span className="settings-view-subtitle">Pad Template</span>
                </div>
              </div>
              <div className="settings-view-header-right">
                {viewTemplate.details?.is_default && (
                  <span className="settings-view-badge">
                    <span className="dot" /> Default
                  </span>
                )}
                <button
                  className="settings-modal-close"
                  onClick={closeViewTemplateModal}
                >
                  <X width="18" height="18" />
                </button>
              </div>
            </div>
            {viewTemplateLoading ? (
              <div className="settings-view-loading">
                <span className="settings-view-spinner" />
                <p>Loading template details...</p>
              </div>
            ) : viewTemplateError ? (
              <p className="settings-modal-error">{viewTemplateError}</p>
            ) : viewTemplate.details ? (
              <div className="settings-view-body">
                {viewTemplateImageUrl && (
                  <div className="settings-view-image">
                    <img
                      src={viewTemplateImageUrl}
                      alt="Pad template preview"
                    />
                    {viewTemplate.details.is_default && (
                      <span className="settings-view-image-badge">Default</span>
                    )}
                  </div>
                )}
                <div className="settings-view-info">
                  <div className="settings-view-meta">
                    <div className="settings-view-meta-item">
                      <span className="settings-view-meta-label">Uploaded At</span>
                      <span className="settings-view-meta-value">
                        {viewTemplate.details.uploaded_at
                          ? new Date(
                              viewTemplate.details.uploaded_at * 1000
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="settings-view-meta-item">
                      <span className="settings-view-meta-label">Filename</span>
                      <span className="settings-view-meta-value settings-view-meta-filename">
                        {viewTemplate.details.filename}
                      </span>
                    </div>
                  </div>

                  <div className="settings-view-card">
                    <div className="settings-view-card-title">Margins</div>
                    <div className="settings-view-grid">
                      {["top", "left", "right", "bottom"].map((m) => (
                        <div className="settings-view-stat" key={m}>
                          <span className="settings-view-stat-label">
                            {m[0].toUpperCase() + m.slice(1)}
                          </span>
                          <span className="settings-view-stat-value">
                            {viewTemplate.details.template_info.margins[m]}
                            <em>px</em>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="settings-view-card">
                    <div className="settings-view-card-title">Date Location</div>
                    <div className="settings-view-grid settings-view-grid-2">
                      {["x", "y"].map((a) => (
                        <div className="settings-view-stat" key={a}>
                          <span className="settings-view-stat-label">
                            {a.toUpperCase()} axis
                          </span>
                          <span className="settings-view-stat-value">
                            {viewTemplate.details.template_info.date_location[a]}
                            <em>px</em>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="settings-view-card">
                    <div className="settings-view-card-title">Font</div>
                    <div className="settings-view-grid settings-view-grid-2">
                      <div className="settings-view-stat">
                        <span className="settings-view-stat-label">Family</span>
                        <span className="settings-view-stat-value settings-view-stat-text">
                          {viewTemplate.details.template_info.font.name || "Default"}
                        </span>
                      </div>
                      <div className="settings-view-stat">
                        <span className="settings-view-stat-label">Size</span>
                        <span className="settings-view-stat-value">
                          {viewTemplate.details.template_info.font.size}
                          <em>pt</em>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="settings-view-footer">
              <span className="settings-view-uid">
                {viewTemplate.details?.uid}
              </span>
              <div className="settings-view-footer-actions">
                {viewTemplateImageUrl && (
                  <button
                    type="button"
                    className="settings-view-download-btn"
                    onClick={downloadViewTemplateImage}
                  >
                    <Upload width="14" height="14" strokeWidth="2" />
                    Download image
                  </button>
                )}
                <button
                  type="button"
                  className="settings-outline-btn"
                  onClick={closeViewTemplateModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editTemplate && (
        <div className="settings-modal-overlay">
          <div
            className="settings-modal settings-modal-preview settings-modal-view"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-modal-header">
              <h2>Edit {editTemplate.template.name}</h2>
              <button
                className="settings-modal-close"
                onClick={closeEditTemplateModal}
              >
                <X width="18" height="18" />
              </button>
            </div>
            {editForm ? (
              <form className="settings-modal-form" onSubmit={handleEditTemplate}>
                <span className="settings-modal-label">1. Pad image (drag margins / Date)</span>
                {!editTemplateImageUrl ? (
                  <label className="settings-pad-upload">
                    <Upload
                      width="22"
                      height="22"
                      strokeWidth="1.75"
                      className="settings-pad-upload-icon"
                    />
                    <b>Click to upload a new pad image</b>
                    <span>PNG, JPG or PDF preview — drag margins on it below</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleEditImageUpload}
                    />
                  </label>
                ) : (
                  <div className="settings-pad-editor" ref={editImageBoxRef}>
                    <img
                      src={editTemplateImageUrl}
                      alt="Pad template preview"
                      onLoad={(e) => {
                        const size = {
                          w: e.target.naturalWidth,
                          h: e.target.naturalHeight,
                        };
                        setEditTemplateImageSize(size);
                        if (normMarginsRef.current) {
                          setEditForm((p) => ({
                            ...p,
                            margins: marginsToPixels(normMarginsRef.current, size),
                          }));
                        }
                      }}
                    />
                    {editTemplateImageSize && (
                      <>
                        <div
                          className="settings-pad-margin pad-margin-top"
                          style={{ height: `${(editForm.margins.top / editTemplateImageSize.h) * 100}%` }}
                          onPointerDown={(e) => startDrag("top", e, editImageBoxRef, updateEditInfo)}
                        >
                          <span className="pad-handle" />
                          <i className="pad-label">Top</i>
                        </div>
                        <div
                          className="settings-pad-margin pad-margin-bottom"
                          style={{ height: `${(editForm.margins.bottom / editTemplateImageSize.h) * 100}%` }}
                          onPointerDown={(e) => startDrag("bottom", e, editImageBoxRef, updateEditInfo)}
                        >
                          <span className="pad-handle" />
                          <i className="pad-label">Bottom</i>
                        </div>
                        <div
                          className="settings-pad-margin pad-margin-left"
                          style={{ width: `${(editForm.margins.left / editTemplateImageSize.w) * 100}%` }}
                          onPointerDown={(e) => startDrag("left", e, editImageBoxRef, updateEditInfo)}
                        >
                          <span className="pad-handle" />
                          <i className="pad-label">Left</i>
                        </div>
                        <div
                          className="settings-pad-margin pad-margin-right"
                          style={{ width: `${(editForm.margins.right / editTemplateImageSize.w) * 100}%` }}
                          onPointerDown={(e) => startDrag("right", e, editImageBoxRef, updateEditInfo)}
                        >
                          <span className="pad-handle" />
                          <i className="pad-label">Right</i>
                        </div>
                        <div
                          className="settings-pad-date"
                          title="Drag to set date location"
                          style={{
                            left: `${(editForm.date_location.x / editTemplateImageSize.w) * 100}%`,
                            top: `${(editForm.date_location.y / editTemplateImageSize.h) * 100}%`,
                          }}
                          onPointerDown={(e) => startDateDrag(e, editImageBoxRef, updateEditInfo)}
                        >
                          <span className="pad-date-label">Date</span>
                        </div>
                        <button
                          type="button"
                          className="settings-pad-change-img"
                          onClick={() => {
                            if (editTemplateImageUrl) URL.revokeObjectURL(editTemplateImageUrl);
                            setEditTemplateImage(null);
                            setEditTemplateImageUrl("");
                            setEditTemplateImageSize(null);
                          }}
                        >
                          Change image
                        </button>
                      </>
                    )}
                  </div>
                )}
                <span className="settings-modal-label">2. Margins</span>
                <div className="settings-modal-row">
                  {["top", "left", "right", "bottom"].map((m) => (
                    <label key={m}>
                      {m[0].toUpperCase() + m.slice(1)}
                      <input
                        type="number"
                        min="0"
                        value={editForm.margins[m]}
                        onChange={(e) =>
                          updateEditInfo("margins", m, e.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
                <span className="settings-modal-label">3. Date Location (drag Date marker)</span>
                <div className="settings-modal-row">
                  {["x", "y"].map((a) => (
                    <label key={a}>
                      {a.toUpperCase()}
                      <input
                        type="number"
                        min="0"
                        value={editForm.date_location[a]}
                        onChange={(e) =>
                          updateEditInfo("date_location", a, e.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
                <span className="settings-modal-label">4. Font</span>
                <div className="settings-modal-row">
                  <label>
                    Name
                    <input
                      value={editForm.font.name}
                      onChange={(e) =>
                        updateEditInfo("font", "name", e.target.value)
                      }
                      placeholder="e.g. Arial"
                    />
                  </label>
                  <label>
                    Size
                    <input
                      type="number"
                      value={editForm.font.size}
                      onChange={(e) =>
                        updateEditInfo("font", "size", e.target.value)
                      }
                    />
                  </label>
                </div>
                <label className="settings-edit-default-row">
                  <div>
                    <div className="settings-toggle-label">Set as Default</div>
                    <div className="settings-toggle-desc">
                      Automatically selected when a doctor starts a consultation
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle ${editForm.is_default ? "on" : ""}`}
                    onClick={() =>
                      setEditForm((p) => ({ ...p, is_default: !p.is_default }))
                    }
                    aria-label="Set as Default"
                  >
                    <i />
                  </button>
                </label>
                {editTemplateError && (
                  <p className="settings-modal-error">{editTemplateError}</p>
                )}
                <div className="settings-modal-actions">
                  <button
                    type="button"
                    className="settings-outline-btn"
                    onClick={closeEditTemplateModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={editingTemplate}
                  >
                    {editingTemplate ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {editTemplateError ? (
                  <p className="settings-modal-error">{editTemplateError}</p>
                ) : (
                  <p className="settings-modal-loading">
                    Loading template details...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
