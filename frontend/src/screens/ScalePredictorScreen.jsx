
import { useState } from "react";
import "./ScalePredictorScreen.css";

function toSeconds(value) {
  if (!/^\d{2,}:\d{2}$/.test(value)) return NaN;

  const [minutes, seconds] = value.split(":").map(Number);

  if (seconds > 59) return NaN;

  return minutes * 60 + seconds;
}

function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;
}

export default function ScalePredictorScreen({ onBack, onAnalyze }) {
  const [file, setFile] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [start, setStart] = useState("00:00");
  const [end, setEnd] = useState("00:30");
  const [error, setError] = useState("");

  function handleFile(event) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    if (!selected.type.startsWith("audio/")) {
      setError("Please choose a valid audio file.");
      return;
    }

    const url = URL.createObjectURL(selected);
    const audio = new Audio(url);

    audio.onloadedmetadata = () => {
      if (!Number.isFinite(audio.duration)) {
        URL.revokeObjectURL(url);
        setError("Could not read the audio duration.");
        return;
      }

      setFile(selected);
      setAudioDuration(audio.duration);
      setStart("00:00");
      setEnd(formatTime(Math.min(30, Math.floor(audio.duration))));
      setError("");

      URL.revokeObjectURL(url);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Could not read this audio file.");
    };

    event.target.value = "";
  }

  function submit(event) {
    event.preventDefault();
    setError("");

    const startSeconds = toSeconds(start);
    const endSeconds = toSeconds(end);

    if (!file) {
      setError("Please upload an audio file.");
      return;
    }

    if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
      setError("Enter times in MM:SS format, for example 01:15.");
      return;
    }

    if (startSeconds < 0 || endSeconds <= startSeconds) {
      setError("End time must be after start time.");
      return;
    }

    if (endSeconds - startSeconds > 120) {
      setError("The selected segment cannot exceed 2 minutes.");
      return;
    }

    if (endSeconds > audioDuration) {
      setError(`End time cannot exceed ${formatTime(audioDuration)}.`);
      return;
    }

    onAnalyze({
      file,
      startSeconds,
      endSeconds,
      startTime: start,
      endTime: end,
    });
  }

  const segmentSeconds = toSeconds(end) - toSeconds(start);

  const meterWidth = Number.isFinite(segmentSeconds)
    ? Math.min(100, Math.max(0, (segmentSeconds / 120) * 100))
    : 0;

  return (
    <main className="screen scale-page">
      <header className="scale-header">
        <button type="button" className="scale-back" onClick={onBack}>
          ← Back
        </button>

        <div className="scale-brand">
          Aakaar<span>AI</span>
        </div>
      </header>

      <section className="scale-content">
        <p className="scale-eyebrow">FEATURE 02 · MUSIC ANALYSIS</p>

        <h1>
          Music Scale <span>Predictor</span>
        </h1>

        <p className="scale-description">
          Upload a song and choose the section whose lyrics and musical notes
          you want to explore.
        </p>

        <form onSubmit={submit}>
          <section className="scale-card">
            <h2>01. Upload audio</h2>

            <p className="scale-hint">
              Select a song from your device.
            </p>

            <label className="scale-upload">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFile}
              />

              <span className="scale-upload-icon">♫</span>

              <strong>
                {file ? file.name : "Choose an audio file"}
              </strong>

              <span>
                Click to browse · Audio formats supported by your browser
              </span>
            </label>

            {file && (
              <div className="scale-file-info">
                <span>Audio duration</span>
                <strong>{formatTime(audioDuration)}</strong>
              </div>
            )}
          </section>

          <section className="scale-card">
            <h2>02. Select time range</h2>

            <p className="scale-hint">
              Choose the segment to analyze. Maximum: 02:00.
            </p>

            <div className="scale-time-fields">
              <label>
                <span>START TIME</span>
                <input
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  placeholder="00:00"
                  aria-label="Start time in MM:SS"
                />
              </label>

              <span className="scale-time-arrow">→</span>

              <label>
                <span>END TIME</span>
                <input
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  placeholder="01:30"
                  aria-label="End time in MM:SS"
                />
              </label>
            </div>

            <div className="scale-meter">
              <div className="scale-meter-label">
                <span>Selected segment</span>

                <strong>
                  {Number.isFinite(segmentSeconds) && segmentSeconds >= 0
                    ? formatTime(segmentSeconds)
                    : "--:--"}
                </strong>
              </div>

              <div className="scale-meter-track">
                <div
                  className="scale-meter-fill"
                  style={{ width: `${meterWidth}%` }}
                />
              </div>

              <p>Maximum allowed segment: 02:00</p>
            </div>
          </section>

          {error && (
            <p className="scale-error" role="alert">
              {error}
            </p>
          )}

          <button className="scale-primary" type="submit">
            Continue to lyrics and notes <span>→</span>
          </button>

          <p className="scale-footnote">
            Limiting the selected segment helps control processing time and
            resource usage.
          </p>
        </form>
      </section>
    </main>
  );
}
