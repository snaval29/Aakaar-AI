
import "./WorkflowScreens.css";

function Brand() {
  return (
    <div className="workflow-brand">
      <span className="workflow-brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Aakaar<span className="brand-ai">AI</span>
      </span>
    </div>
  );
}

function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      className="workflow-back"
      onClick={onClick}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

function WorkflowLayout({ onBack, children }) {
  return (
    <main className="screen workflow-screen">
      <div className="workflow-grid" aria-hidden="true" />

      <header className="workflow-header">
        <BackButton onClick={onBack} />
        <Brand />
        <span className="workflow-header-spacer" aria-hidden="true" />
      </header>

      <section className="workflow-content">
        {children}
      </section>
    </main>
  );
}

export function CreateMusicScreen({
  prompt,
  setPrompt,
  duration,
  setDuration,
  error,
  onBack,
  onGenerate,
}) {
  const maxLength = 500;

  return (
    <WorkflowLayout onBack={onBack}>
      <div className="workflow-eyebrow">TEXT TO MUSIC</div>

      <h1 className="workflow-title">
        Describe your sound.
      </h1>

      <p className="workflow-description">
        Put the music you imagine into words.
      </p>

      <form
        className="prompt-form"
        onSubmit={(event) => {
          event.preventDefault();
          onGenerate();
        }}
      >
        <label className="prompt-label" htmlFor="music-prompt">
          YOUR PROMPT
        </label>

        <textarea
          id="music-prompt"
          className="music-prompt"
          value={prompt}
          onChange={(event) =>
            setPrompt(event.target.value.slice(0, maxLength))
          }
          placeholder="A calm piano melody with warm strings, soft rain, and a cinematic atmosphere..."
          maxLength={maxLength}
          required
        />

        <div className="prompt-footer">
          <span>Be as descriptive as you like.</span>
          <span>{prompt.length}/{maxLength}</span>
        </div>

        <label className="prompt-label" htmlFor="music-duration">
          DURATION
        </label>

        <select
          id="music-duration"
          className="music-prompt"
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        >
          {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((seconds) => (
            <option key={seconds} value={seconds}>
              {seconds} seconds
            </option>
          ))}
        </select>

        {error && (
          <p role="alert" className="generation-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="workflow-primary-button"
          disabled={!prompt.trim()}
        >
          <span>Generate music</span>
          <span aria-hidden="true">↗</span>
        </button>
      </form>
    </WorkflowLayout>
  );
}

export function GenerationLoadingScreen({ onBack }) {
  return (
    <WorkflowLayout onBack={onBack}>
      <div
        className="loading-visual"
        aria-hidden="true"
      >
        <div className="loading-orbit orbit-one" />
        <div className="loading-orbit orbit-two" />
        <div className="loading-core">
          <div className="loading-bars">
            {[1, 2, 3, 4, 5].map((bar) => (
              <span key={bar} className={`loading-bar bar-${bar}`} />
            ))}
          </div>
        </div>
      </div>

      <h1 className="workflow-title">
        Creating your sound.
      </h1>

      <p className="workflow-description" role="status">
        MusicGen is generating your music. This may take a few minutes.
      </p>

      <div className="generation-progress">
        <div className="generation-progress-track">
          <div
            className="generation-progress-fill"
            style={{ width: "65%" }}
          />
        </div>
        <span>Working</span>
      </div>
    </WorkflowLayout>
  );
}

export function AudioOutputScreen({
  prompt,
  audioUrl,
  downloadUrl,
  onBack,
  onCreateAnother,
}) {
  return (
    <WorkflowLayout onBack={onBack}>
      <div className="workflow-eyebrow">
        YOUR CREATION
      </div>

      <h1 className="workflow-title">
        Your sound is ready.
      </h1>

      <p className="workflow-description">
        Generated from your words.
      </p>

      <div className="audio-output-card">
        <div className="audio-artwork" aria-hidden="true">
          <div className="audio-artwork-ring ring-one" />
          <div className="audio-artwork-ring ring-two" />
          <div className="audio-artwork-center">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="audio-details">
          <h2>Untitled composition</h2>
          <p>AI-generated music · WAV audio</p>
        </div>

        {audioUrl ? (
          <>
<audio
  className="audio-player"
  controls
  preload="metadata"
  crossOrigin="anonymous"
  src={audioUrl}
  onError={(event) => {
    console.error(
      "Audio playback error:",
      event.currentTarget.error,
      audioUrl
    );
  }}
>
  Your browser does not support audio playback.
</audio>

            <a
              className="workflow-primary-button download-button"
              href={downloadUrl || audioUrl}
            >
              <span>Download audio (.wav)</span>
              <span aria-hidden="true">↓</span>
            </a>
          </>
        ) : (
          <p role="alert" className="generation-error">
            No audio URL was returned. Please generate your music again.
          </p>
        )}
      </div>

      <button
        type="button"
        className="workflow-secondary-button"
        onClick={onCreateAnother}
      >
        Create another
      </button>

      <p className="output-prompt">{prompt}</p>
    </WorkflowLayout>
  );
}
