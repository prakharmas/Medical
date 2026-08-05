import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, Download, X, FileText } from "lucide-react";
import {
  listPatientsDetailed,
  createAudioSession,
  uploadAudioSession,
  listAudioSessionsDetailed,
  getAudioSessionTranscription,
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

  const closeTranscript = () => {
    setTranscriptSession(null);
    setTranscript(null);
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
          {sessionsLoading && <Loader2 size={16} className="voice-spin" />}
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
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
                  <td colSpan="5" style={{ textAlign: "center", color: "#94a3b8" }}>
                    {sessionsLoading ? "Loading sessions…" : "No audio sessions for this patient yet."}
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.uid}>
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
                ))
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
          </div>
        </div>
      )}
    </>
  );
}
