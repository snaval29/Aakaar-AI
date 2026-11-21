import "./ScaleResultsScreen.css";

export default function ScaleResultsScreen({
  selection,
  results,
  loading,
  error,
  onBack,
  onNewAnalysis,
}) {
  const lines = results?.lines || [];
  const detectedScale = results?.detected_scale || "Detecting...";
  const language = results?.language ? results.language.toUpperCase() : "HI";

  return (
    <main className="screen scale-results-page">
      <header className="scale-results-header">
        <button
          type="button"
          onClick={onBack}
          className="scale-results-back"
        >
          ← Back to upload
        </button>

        <div className="scale-results-brand">
          Aakaar<span>AI</span>
        </div>
      </header>

      <section className="scale-results-content">
        <p className="scale-results-eyebrow">
          FEATURE 02 · REAL AUDIO ANALYSIS
        </p>

        <h1>
          Notes behind <span>the lyrics</span>
        </h1>

        <p className="scale-results-description">
          Detected musical notes matched with your audio segment using Whisper & pitch detection.
        </p>

        <section className="scale-results-file">
          <div className="scale-results-file-icon" aria-hidden="true">♫</div>

          <div className="scale-results-file-details">
            <strong>
              {results?.file_name || selection?.file?.name || "Selected audio"}
            </strong>

            <span>
              {results ? `${results.start_seconds}s – ${results.end_seconds}s` : `${selection?.startTime || "00:00"} – ${selection?.endTime || "00:30"}`}
            </span>
          </div>

          <span className="scale-results-tag">
            {detectedScale} ({language})
          </span>
        </section>

        {loading ? (
          <div className="scale-results-notice" role="status">
            <strong>Analyzing audio in Colab GPU...</strong>
            <p>
              Transcribing lyrics with Whisper and estimating pitch frequencies with librosa pYIN. This takes about 10-20 seconds.
            </p>
          </div>
        ) : error ? (
          <div className="scale-error" role="alert">
            {error}
          </div>
        ) : (
          <section className="scale-lyrics-card">
            <div className="scale-lyrics-card-header">
              <h2>Lyric Note Map</h2>
              <p>
                {results?.lyrics || "Transcribed lyrics and notes detected directly from your audio."}
              </p>
            </div>

            {lines.length > 0 ? (
              <div className="scale-lyrics">
                {lines.map((line, lIndex) => (
                  <div className="scale-lyric-line" key={lIndex}>
                    {line.map((item, wIndex) => (
                      <div
                        className="scale-lyric-word"
                        key={`${lIndex}-${wIndex}-${item.word}`}
                      >
                        <span className="scale-note">{item.note}</span>
                        <span className="scale-note-stem" />
                        <strong>{item.word}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="scale-lyrics-caption">
                No distinct lyrics detected in this segment.
              </p>
            )}

            <p className="scale-lyrics-caption">
              Analysis powered by Whisper speech recognition & librosa pYIN pitch tracking.
            </p>
          </section>
        )}

        {!loading && (
          <button
            type="button"
            className="scale-results-primary"
            onClick={onNewAnalysis}
          >
            Analyze another song →
          </button>
        )}
      </section>
    </main>
  );
}
