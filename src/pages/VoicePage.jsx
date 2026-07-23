import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

export default function VoicePage() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [recording]);

  const formatTime = (total) => {
    const mins = String(Math.floor(total / 60)).padStart(2, "0");
    const secs = String(total % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const toggleRecording = () => {
    if (recording) {
      setRecording(false);
    } else {
      setSeconds(0);
      setRecording(true);
    }
  };

  return (
    <>
      <style>{`
        .voice-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          padding: 56px 24px;
          text-align: center;
        }
        .voice-mic-button {
          display: grid;
          place-items: center;
          width: 108px;
          height: 108px;
          border: 0;
          border-radius: 50%;
          color: #fff;
          background: linear-gradient(135deg, #2879ea, #1f57bb);
          box-shadow: 0 10px 26px rgba(47, 128, 237, 0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .voice-mic-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(47, 128, 237, 0.34);
        }
        .voice-mic-button.recording {
          background: linear-gradient(135deg, #ef5350, #d33f3f);
          box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.45);
          animation: voice-pulse 1.6s ease-out infinite;
        }
        @keyframes voice-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.4);
          }
          70% {
            box-shadow: 0 0 0 18px rgba(239, 83, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 83, 80, 0);
          }
        }
        .voice-timer {
          margin-top: 6px;
          color: #172338;
          font-size: 34px;
          font-weight: 700;
          letter-spacing: 1px;
          font-variant-numeric: tabular-nums;
        }
        .voice-hint {
          margin: 0;
          color: #8b98aa;
          font-size: 13px;
        }
        .voice-transcript-card {
          margin-top: 20px;
        }
        .voice-live-dot {
          color: #ee4c54;
          font-size: 11px;
          font-weight: 700;
        }
        .voice-transcript-box {
          min-height: 160px;
          margin-top: 4px;
          padding: 18px;
          border: 1px dashed #dce5f0;
          border-radius: 10px;
          background: #f9fbfd;
        }
        .voice-transcript-box p {
          margin: 0;
          color: #96a1b1;
          font-size: 13px;
          font-style: italic;
          text-align: center;
        }
      `}</style>

      <div className="page-heading">
        <div>
          <h1>Voice Consultation</h1>
          <p>Priya Sharma • Medical Oncology • Live Transcription</p>
        </div>
      </div>

      <section className="settings-card voice-stage">
        <button
          type="button"
          className={`voice-mic-button ${recording ? "recording" : ""}`}
          onClick={toggleRecording}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? <Square size={30} /> : <Mic size={36} />}
        </button>
        <div className="voice-timer">{formatTime(seconds)}</div>
        <p className="voice-hint">
          {recording
            ? "Listening… click the microphone to stop"
            : "Click the microphone to start recording"}
        </p>
      </section>

      <section className="settings-card voice-transcript-card">
        <div className="panel-title">
          <h3>Live Transcript</h3>
          {recording && <span className="voice-live-dot">● Live</span>}
        </div>
        <div className="voice-transcript-box">
          <p>Transcript will appear here as you speak...</p>
        </div>
      </section>
    </>
  );
}