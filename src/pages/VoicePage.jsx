import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, Download, X, FileText, Sparkles } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import {
  listPatientsDetailed,
  createAudioSession,
  uploadAudioSession,
  listAudioSessionsDetailed,
  getAudioSessionTranscription,
  submitTranscriptionForSummary,
  listPadTemplatesDetailed,
  renderTranscriptionOnPad,
  downloadRenderedPad,
  createTextNote,
  listTextNotes,
} from "../api/api";
import { Mp3Encoder } from "@breezystack/lamejs";

async function audioBufferToMp3(audioBuffer) {
  const pcm = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(1, sampleRate, 128);
  const blockSize = 1152;
  const input = new Int16Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) {
    const s = pcm[i];
    input[i] = s > 0 ? s * 0x7fff : s * 0x8000;
  }
  const mp3Chunks = [];
  for (let i = 0; i < input.length; i += blockSize) {
    const chunk = input.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length) mp3Chunks.push(new Uint8Array(encoded));
  }
  const tail = encoder.flush();
  if (tail.length) mp3Chunks.push(new Uint8Array(tail));
  return new Blob(mp3Chunks, { type: "audio/mpeg" });
}

async function blobToMp3(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return await audioBufferToMp3(audioBuffer);
  } finally {
    ctx.close();
  }
}

async function classifyRenderBlob(blob) {
  const mime = blob?.type || "";
  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";
  if (isImage || isPdf) {
    return {
      url: URL.createObjectURL(blob),
      type: isImage ? "image" : "pdf",
    };
  }
  try {
    const buf = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    const pdfMagic =
      buf[0] === 0x25 &&
      buf[1] === 0x50 &&
      buf[2] === 0x44 &&
      buf[3] === 0x46;
    if (pdfMagic) {
      return { url: URL.createObjectURL(blob), type: "pdf" };
    }
    const pngMagic =
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47;
    const jpegMagic = buf[0] === 0xff && buf[1] === 0xd8;
    if (pngMagic || jpegMagic) {
      return { url: URL.createObjectURL(blob), type: "image" };
    }
  } catch {
    return null;
  }
  return null;
}

async function refitPdfBlob(blob) {
  const bytes = await blob.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const dstDoc = await PDFDocument.create();
  const A4 = [595.28, 841.89];
  const pages = srcDoc.getPages();
  if (pages.length === 0) return blob;
  for (const page of pages) {
    const embed = await dstDoc.embedPage(page);
    const pageW = embed.width;
    const pageH = embed.height;
    const targetW = A4[0];
    const targetH = A4[1];
    const scale = Math.min(targetW / pageW, targetH / pageH);
    const drawW = pageW * scale;
    const drawH = pageH * scale;
    const x = (targetW - drawW) / 2;
    const y = (targetH - drawH) / 2;
    const newPage = dstDoc.addPage(A4);
    newPage.drawPage(embed, { x, y, width: drawW, height: drawH });
  }
  const outBytes = await dstDoc.save();
  return new Blob([outBytes], { type: "application/pdf" });
}

export default function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [patients, setPatients] = useState([]);
  const [patientUid, setPatientUid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [lastFile, setLastFile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [transcriptSession, setTranscriptSession] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [defaultPadUid, setDefaultPadUid] = useState("");
  const [defaultPadName, setDefaultPadName] = useState("");
  const [renderingPadUid, setRenderingPadUid] = useState(null);
  const [padRender, setPadRender] = useState(null);
  const [padRenderError, setPadRenderError] = useState("");
  const [selectedSessionUids, setSelectedSessionUids] = useState([]);
  const [selectedNoteUids, setSelectedNoteUids] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [textNote, setTextNote] = useState("");
  const [textNoteStatus, setTextNoteStatus] = useState({ type: "idle", text: "" });
  const [textNoteSaving, setTextNoteSaving] = useState(false);
  const [textNotes, setTextNotes] = useState([]);
  const [textNotesLoading, setTextNotesLoading] = useState(false);

  const intervalRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const secondsRef = useRef(0);
  const lastFileUrlRef = useRef(null);

  useEffect(() => {
    listPatientsDetailed()
      .then((res) => {
        if (res.data.success && res.data.patients?.length) {
          setPatients(res.data.patients);
          setPatientUid(res.data.patients[0].uid);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (lastFileUrlRef.current) URL.revokeObjectURL(lastFileUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!patientUid) return;
    let cancelled = false;
    setSessionsLoading(true);
    listAudioSessionsDetailed(patientUid)
      .then((res) => {
        if (!cancelled && res.data.success) {
          setSessions(res.data.audio_sessions || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientUid, refreshKey]);

  useEffect(() => {
    if (!patientUid) return;
    let cancelled = false;
    setTextNotesLoading(true);
    listTextNotes(patientUid)
      .then((res) => {
        if (!cancelled && res.data.success) {
          setTextNotes(res.data.text_notes || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTextNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientUid, refreshKey]);

  useEffect(() => {
    listPadTemplatesDetailed()
      .then((res) => {
        const def = (res.data?.pad_templates || []).find((p) => p.is_default);
        if (def) {
          setDefaultPadUid(def.uid);
          setDefaultPadName(def.filename || def.uid);
        }
      })
      .catch(() => {});
  }, []);

  const formatTime = (total) => {
    const mins = String(Math.floor(total / 60)).padStart(2, "0");
    const secs = String(total % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleStop = async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const duration = Math.max(1, secondsRef.current);
    setUploading(true);
    setStatus({ type: "info", text: "Encoding recording to MP3…" });
    try {
      const mp3 = await blobToMp3(
        new Blob(chunksRef.current, {
          type: chunksRef.current[0]?.type || "audio/webm",
        }),
      );
      const filename = `Voice_${patientUid}_${duration}.mp3`;
      const sessionRes = await createAudioSession({
        filename,
        patient_uid: patientUid,
        time_of_recording: duration,
        preset_uid: null,
      });
      const audioSessionUid = sessionRes.data?.uid;
      if (!audioSessionUid) throw new Error("No session uid returned");
      const formData = new FormData();
      formData.append("audio_session_uid", audioSessionUid);
      formData.append("file", mp3, filename);
      await uploadAudioSession(formData);

      if (lastFileUrlRef.current) URL.revokeObjectURL(lastFileUrlRef.current);
      const url = URL.createObjectURL(mp3);
      lastFileUrlRef.current = url;
      setLastFile({ url, name: filename, duration });
      setStatus({
        type: "success",
        text: `Saved ${filename} (${duration}s) — session ${audioSessionUid}.`,
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setStatus({
        type: "error",
        text:
          err?.response?.data?.detail || err.message || "Failed to upload recording.",
      });
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (!patientUid) {
      setStatus({ type: "error", text: "Select a patient first." });
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices) {
      setStatus({
        type: "error",
        text: "Microphone requires a secure context. Open the app via http://localhost:5173 or https://.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorderRef.current = recorder;
      recorder.start();
      secondsRef.current = 0;
      setSeconds(0);
      setLastFile(null);
      setRecording(true);
      setStatus({ type: "idle", text: "" });
    } catch (err) {
      const name = err?.name || "";
      const secure = window.isSecureContext
        ? ""
        : " Access mic over https:// or localhost.";
      const message =
        name === "NotAllowedError"
          ? "Microphone permission was denied. Allow it in the browser and retry."
          : name === "NotFoundError"
            ? "No microphone device was found."
            : name === "NotReadableError"
              ? "Microphone is in use by another app."
              : `Microphone access failed${secure}.`;
      setStatus({ type: "error", text: `${message} (${err?.message || name})` });
    }
  };

  const stopRecording = () => {
    setRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (uploading) return;
    if (recording) stopRecording();
    else startRecording();
  };

  const busy = recording || uploading;

  const totalSelected = selectedSessionUids.length + selectedNoteUids.length;

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    return d.toLocaleString();
  };

  const formatDuration = (secs) => {
    const mins = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${mins}:${s}`;
  };

  const openTranscript = async (session) => {
    setTranscriptSession(session);
    setTranscript(null);
    setTranscriptLoading(true);
    setSubmitStatus("");
    try {
      const res = await getAudioSessionTranscription(session.uid);
      setTranscript({
        text: res.data?.transcript || "",
        pad: res.data?.pad_content || "",
      });
    } catch (err) {
      setTranscript({
        error: err?.response?.data?.detail || err.message || "Failed to load transcript.",
      });
    } finally {
      setTranscriptLoading(false);
    }
  };

  const submitForSummary = async () => {
    if (!transcriptSession) return;
    setSubmitting(true);
    setSubmitStatus("");
    try {
      await submitTranscriptionForSummary(transcriptSession.uid);
      setSubmitStatus("Submitted for summary generation.");
    } catch (err) {
      setSubmitStatus(
        err?.response?.data?.detail || err.message || "Failed to submit for summary.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeTranscript = () => {
    setTranscriptSession(null);
    setTranscript(null);
    setSubmitStatus("");
  };

  const renderOnPad = async () => {
    const srcUids = [...selectedSessionUids, ...selectedNoteUids];
    if (srcUids.length === 0) {
      setPadRenderError(
        "Select at least one audio session or text note to render on pad."
      );
      return;
    }
    setPadRenderError("");
    setPadRender(null);
    setRenderingPadUid("multi");
    try {
      let padUid = defaultPadUid;
      if (!padUid) {
        const listRes = await listPadTemplatesDetailed();
        const def = (listRes.data?.pad_templates || []).find((p) => p.is_default);
        if (!def) {
          throw new Error(
            "No default pad template is set. Set a default template in Settings first."
          );
        }
        padUid = def.uid;
        setDefaultPadUid(padUid);
      }
      const res = await renderTranscriptionOnPad({
        pad_uid: padUid,
        src_uids: srcUids,
        mock_info: null,
      });
      const type = res.data?.type || "";
      if (type.startsWith("image") || type === "application/pdf") {
        setPadRender({
          sessions: srcUids,
          url: URL.createObjectURL(res.data),
          type: type.startsWith("image") ? "image" : "pdf",
        });
      } else {
        const text = await res.data.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          // ignore
        }
        if (parsed?.image_base64) {
          const base64 = parsed.image_base64.split(",").pop() || parsed.image_base64;
          setPadRender({
            sessions: srcUids,
            url: `data:image/png;base64,${base64}`,
            type: "image",
          });
        } else if (parsed?.success && parsed?.render_uid) {
          let renderUid = parsed.render_uid;
          let downloaded = null;
          try {
            const downRes = await downloadRenderedPad({ uid: renderUid });
            downloaded = await classifyRenderBlob(downRes.data);
            if (downloaded) downloaded.renderUid = renderUid;
            if (downloaded?.type === "pdf") {
              const refitted = await refitPdfBlob(downRes.data);
              if (downloaded.url) URL.revokeObjectURL(downloaded.url);
              downloaded.url = URL.createObjectURL(refitted);
            }
          } catch {
            downloaded = null;
          }
          if (downloaded) {
            setPadRender({
              sessions: srcUids,
              url: downloaded.url,
              type: downloaded.type,
              renderUid: downloaded.renderUid,
            });
          } else {
            setPadRender({
              sessions: srcUids,
              url: null,
              type: "none",
              renderUid,
            });
          }
        } else {
          throw new Error(
            parsed?.reason || parsed?.detail || "Rendering on pad failed."
          );
        }
      }
    } catch (err) {
      setPadRenderError(
        err?.response?.data?.reason ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to render on pad."
      );
    } finally {
      setRenderingPadUid(null);
    }
  };

  const closePadRender = () => {
    if (padRender?.url?.startsWith("blob:")) URL.revokeObjectURL(padRender.url);
    setPadRender(null);
  };

  const saveTextNote = async (e) => {
    e.preventDefault();
    const content = textNote.trim();
    if (!patientUid) {
      setTextNoteStatus({ type: "error", text: "Select a patient first." });
      return;
    }
    if (!content) {
      setTextNoteStatus({ type: "error", text: "Note content is empty." });
      return;
    }
    setTextNoteSaving(true);
    setTextNoteStatus({ type: "idle", text: "" });
    try {
      const res = await createTextNote({
        patient_uid: patientUid,
        content,
        mock_info: null,
      });
      const uid = res.data?.uid;
      setTextNoteStatus({
        type: "success",
        text: `Note saved${uid ? ` (uid: ${uid})` : ""}.`,
      });
      setTextNote("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setTextNoteStatus({
        type: "error",
        text:
          err?.response?.data?.detail ||
          err?.response?.data?.reason ||
          err.message ||
          "Failed to save text note.",
      });
    } finally {
      setTextNoteSaving(false);
    }
  };

  const statusIcon =
    status.type === "success" ? (
      <CheckCircle2 size={20} />
    ) : status.type === "error" ? (
      <AlertCircle size={20} />
    ) : status.type === "info" ? (
      <Loader2 size={20} className="voice-spin" />
    ) : null;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Voice Consultation</h1>
          <p>Record a voice note and save it as an MP3</p>
        </div>
      </div>

      <div className="voice-top-row">
        <section className="settings-card voice-stage">
          <div className="voice-patient-select">
            <label htmlFor="voice-patient">Patient</label>
            <select
              id="voice-patient"
              value={patientUid}
              onChange={(e) => setPatientUid(e.target.value)}
              disabled={recording || uploading}
            >
              {patients.length === 0 && <option value="">No patients available</option>}
              {patients.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.name} • {p.uid}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={`voice-mic-button ${recording ? "recording" : ""}`}
            onClick={toggleRecording}
            disabled={busy && !recording}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square size={30} /> : uploading ? <Loader2 size={36} className="voice-spin" /> : <Mic size={36} />}
          </button>
          <div className="voice-timer">{formatTime(seconds)}</div>
          <p className="voice-hint">
            {recording
              ? "Listening… click the microphone to stop"
              : uploading
                ? "Saving MP3…"
                : "Click the microphone to start recording"}
          </p>
        </section>

        <div className="voice-top-right">
          <section className="settings-card voice-text-note-card">
            <div className="panel-title">
              <h3>Text Note</h3>
            {textNoteSaving && <Loader2 size={16} className="voice-spin" />}
          </div>
          <form onSubmit={saveTextNote}>
            <textarea
              className="voice-text-note-input"
              value={textNote}
              onChange={(e) => setTextNote(e.target.value)}
              placeholder="Type a text note for the selected patient…"
              rows={5}
              disabled={textNoteSaving}
            />
            <div className="voice-text-note-footer">
              <span
                className={`voice-status-line voice-text-note-status ${textNoteStatus.type}`}
              >
                {textNoteStatus.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : textNoteStatus.type === "error" ? (
                  <AlertCircle size={16} />
                ) : null}
                {textNoteStatus.text}
              </span>
              <button
                type="submit"
                className="admin-action-btn"
                disabled={textNoteSaving || recording || uploading}
              >
                {textNoteSaving ? (
                  <Loader2 size={14} className="voice-spin" />
                ) : (
                  <FileText size={14} />
                )}
                {textNoteSaving ? "Saving…" : "Save Note"}
              </button>
            </div>
          </form>
          </section>

          <section className="settings-card voice-text-notes-card">
            <div className="panel-title voice-text-notes-title">
              <h3>
                <input
                  type="checkbox"
                  checked={
                    textNotes.length > 0 &&
                    selectedNoteUids.length === textNotes.length
                  }
                  onChange={(e) =>
                    setSelectedNoteUids(
                      e.target.checked ? textNotes.map((n) => n.uid) : []
                    )
                  }
                  aria-label="Select all text notes"
                />
                Text Notes ({textNotes.length})
              </h3>
              {textNotesLoading && <Loader2 size={16} className="voice-spin" />}
            </div>
            {textNotes.length === 0 ? (
              <p className="voice-modal-empty">
                {textNotesLoading
                  ? "Loading notes…"
                  : "No text notes for this patient yet."}
              </p>
            ) : (
              <div className="voice-text-notes-list">
                {textNotes.map((n) => {
                  const noteChecked = selectedNoteUids.includes(n.uid);
                  const expanded = expandedNotes.includes(n.uid);
                  return (
                    <div
                      className={`voice-text-note-item${noteChecked ? " voice-note-selected" : ""}`}
                      key={n.uid}
                    >
                      <div className="voice-text-note-item-meta">
                        <label className="voice-text-note-item-check">
                          <input
                            type="checkbox"
                            checked={noteChecked}
                            onChange={(e) =>
                              setSelectedNoteUids((p) =>
                                e.target.checked
                                  ? [...p, n.uid]
                                  : p.filter((uid) => uid !== n.uid)
                              )
                            }
                            aria-label={`Select note ${n.uid}`}
                          />
                        </label>
                        <span className="voice-text-note-item-date">
                          {formatDate(n.created_on)}
                        </span>
                        <span className="voice-text-note-item-uid">{n.uid}</span>
                      </div>
                      <p
                        className={`voice-text-note-item-content${expanded ? " expanded" : ""}`}
                        onClick={() =>
                          setExpandedNotes((p) =>
                            expanded
                              ? p.filter((uid) => uid !== n.uid)
                              : [...p, n.uid]
                          )
                        }
                        title={expanded ? "Click to collapse" : "Click to expand"}
                      >
                        {n.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="settings-card voice-status-card">
        <div className="panel-title">
          <h3>Recording Status</h3>
          {recording && <span className="voice-live-dot">● Live</span>}
        </div>
        <div className="voice-status-box">
          <p className={`voice-status-line ${status.type}`}>
            {statusIcon}
            {status.text ||
              (recording
                ? "Recording…"
                : "Start recording to capture an MP3 voice note for the selected patient.")}
          </p>
          {lastFile && status.type === "success" && (
            <div className="voice-playback">
              <audio controls src={lastFile.url} />
              <a className="voice-download" href={lastFile.url} download={lastFile.name}>
                <Download size={16} />
                Download {lastFile.name}
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="admin-table-section">
        <div className="admin-table-header">
          <span className="admin-table-title">
            Audio Sessions ({sessions.length})
          </span>
          {defaultPadName && (
            <span className="voice-default-pad" title={defaultPadUid}>
              <FileText size={13} />
              Pad: {defaultPadName}
              <em>Default</em>
            </span>
          )}
          {sessionsLoading && <Loader2 size={16} className="voice-spin" />}
          {totalSelected > 0 && (
            <button
              type="button"
              className="admin-action-btn voice-render-selected"
              onClick={renderOnPad}
              disabled={!!renderingPadUid}
            >
              {renderingPadUid ? (
                <Loader2 size={14} className="voice-spin" />
              ) : (
                <FileText size={14} />
              )}
              {renderingPadUid ? "Rendering…" : `Render Selected (${totalSelected})`}
            </button>
          )}
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      sessions.length > 0 &&
                      selectedSessionUids.length === sessions.length
                    }
                    onChange={(e) =>
                      setSelectedSessionUids(
                        e.target.checked ? sessions.map((s) => s.uid) : []
                      )
                    }
                    aria-label="Select all sessions"
                  />
                </th>
                <th>Filename</th>
                <th>Uploaded</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Transcript</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#94a3b8" }}>
                    {sessionsLoading ? "Loading sessions…" : "No audio sessions for this patient yet."}
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const checked = selectedSessionUids.includes(s.uid);
                  return (
                    <tr
                      key={s.uid}
                      className={checked ? "voice-row-selected" : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSelectedSessionUids((p) =>
                              e.target.checked
                                ? [...p, s.uid]
                                : p.filter((uid) => uid !== s.uid)
                            )
                          }
                          aria-label={`Select ${s.filename}`}
                        />
                      </td>
                      <td className="admin-table-name">{s.filename}</td>
                      <td>{formatDate(s.uploaded_at)}</td>
                      <td>{formatDuration(s.time_of_recording)}</td>
                      <td>
                        <span
                          className={`admin-status ${s.is_transcribed ? "active" : "pending"}`}
                        >
                          {s.is_transcribed ? "Transcribed" : "Processing"}
                        </span>
                      </td>
                      <td className="admin-table-actions">
                        <button
                          type="button"
                          className="admin-action-btn"
                          onClick={() => openTranscript(s)}
                        >
                          <FileText size={14} />
                          View transcript
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {transcriptSession && (
        <div className="voice-modal-overlay" onClick={closeTranscript}>
          <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <div>
                <h3>Transcript</h3>
                <span>
                  {transcriptSession.filename} • {formatDate(transcriptSession.uploaded_at)}
                </span>
              </div>
              <button
                type="button"
                className="voice-modal-close"
                onClick={closeTranscript}
                aria-label="Close transcript"
              >
                <X size={16} />
              </button>
            </div>
            <div className="voice-modal-body">
              {transcriptLoading ? (
                <span className="voice-modal-empty">
                  <Loader2 size={16} className="voice-spin" /> Loading transcript…
                </span>
              ) : transcript?.error ? (
                <span className="voice-status-line error">{transcript.error}</span>
              ) : (
                <>
                  {transcript?.text || (
                    <span className="voice-modal-empty">No transcript available.</span>
                  )}
                  {transcript?.pad && <div className="voice-pad">{transcript.pad}</div>}
                </>
              )}
            </div>
            <div className="voice-modal-footer">
              <span
                className={`voice-submit-status ${
                  submitStatus && !submitStatus.startsWith("Failed") ? "success" : "error"
                }`}
              >
                {submitStatus}
              </span>
              {/* <button
                type="button"
                className="voice-download"
                onClick={submitForSummary}
                disabled={submitting || transcriptLoading || !!transcript?.error}
              >
                {submitting ? (
                  <Loader2 size={16} className="voice-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Submit for summary
              </button> */}
            </div>
          </div>
        </div>
      )}

      {padRender && (
        <div className="voice-modal-overlay" onClick={closePadRender}>
          <div className="voice-modal voice-pad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <div>
                <h3>Rendered Pad</h3>
                <span>
                  {padRender.sessions.length} session(s)
                </span>
              </div>
              <button
                type="button"
                className="voice-modal-close"
                onClick={closePadRender}
                aria-label="Close rendered pad"
              >
                <X size={16} />
              </button>
            </div>
            <div className="voice-modal-body">
              {padRender.type === "none" ? (
                <span className="voice-status-line success">
                  <CheckCircle2 size={16} />
                  Pad rendered successfully.
                  {padRender.renderUid && (
                    <span className="voice-render-uid">
                      Render ID: {padRender.renderUid}
                    </span>
                  )}
                </span>
              ) : (
                padRender.url &&
                (padRender.type === "pdf" ? (
                  <iframe
                    className="voice-pad-pdf"
                    src={`${padRender.url}#view=FitH`}
                    title="Rendered pad PDF"
                  />
                ) : (
                  <img
                    className="voice-pad-image"
                    src={padRender.url}
                    alt="Rendered pad"
                  />
                ))
              )}
            </div>
            <div className="voice-modal-footer">
              {padRender.url && (
                <a
                  className="voice-download"
                  href={padRender.url}
                  download={`pad-${padRender.sessions.length}-sessions.${padRender.type === "pdf" ? "pdf" : "png"}`}
                >
                  <Download size={16} />
                  Download {padRender.type === "pdf" ? "PDF" : "Image"}
                </a>
              )}
              <button
                type="button"
                className="voice-download"
                onClick={closePadRender}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {padRenderError && (
        <div className="voice-modal-overlay">
          <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <div>
                <h3>Render on Pad</h3>
                <span>Could not render transcription</span>
              </div>
              <button
                type="button"
                className="voice-modal-close"
                onClick={() => setPadRenderError("")}
                aria-label="Close error"
              >
                <X size={16} />
              </button>
            </div>
            <div className="voice-modal-body">
              <span className="voice-status-line error">{padRenderError}</span>
            </div>
            <div className="voice-modal-footer">
              <button
                type="button"
                className="voice-download"
                onClick={() => setPadRenderError("")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
