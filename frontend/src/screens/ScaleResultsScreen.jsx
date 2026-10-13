
import "./ScaleResultsScreen.css";

const DEMO_LINES = [
  [
    { word: "My", note: "G♯4" },
    { word: "heart", note: "G♯4" },
  ],
  [
    { word: "will", note: "A♯4" },
    { word: "go", note: "G♯4" },
  ],
  [{ word: "on", note: "F♯4" }],
];

export default function ScaleResultsScreen({
  selection,
  onBack,
  onNewAnalysis,
}) {
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
          FEATURE 02 · RESULTS PREVIEW
        </p>

        <h1>
          Notes behind <span>the lyrics</span>
        </h1>

        <p className="scale-results-description">
          Musical notes will appear above the corresponding words or syllables.
        </p>

        <section className="scale-results-file">
          <div className="scale-results-file-icon">♫</div>

          <div className="scale-results-file-details">
            <strong>
              {selection?.file?.name || "Selected audio"}
            </strong>

            <span>
              {selection?.startTime || "00:00"} –{" "}
              {selection?.endTime || "00:30"}
            </span>
          </div>

          <span className="scale-results-tag">DEMO</span>
        </section>

        <section className="scale-lyrics-card">
          <div className="scale-lyrics-card-header">
            <h2>Lyric note map</h2>
            <p>
              Illustrative example — not actual analysis results.
            </p>
          </div>

          <div className="scale-lyrics">
            {DEMO_LINES.map((line, lineIndex) => (
              <div className="scale-lyric-line" key={lineIndex}>
                {line.map((item, wordIndex) => (
                  <div className="scale-lyric-word" key={wordIndex}>
                    <span className="scale-note">{item.note}</span>
                    <span className="scale-note-stem" />
                    <strong>{item.word}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="scale-lyrics-caption">
            Sample lyrics and notes · Prediction engine not connected
          </p>
        </section>

        <div className="scale-results-notice" role="status">
          <strong>Preview mode</strong>
          <p>
            The integrated model will replace these sample labels with
            predicted notes and lyrics aligned to your selected audio.
          </p>
        </div>

        <button
          type="button"
          className="scale-results-primary"
          onClick={onNewAnalysis}
        >
          Analyze another song →
        </button>
      </section>
    </main>
  );
}
