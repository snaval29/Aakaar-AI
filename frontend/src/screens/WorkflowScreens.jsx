
import { useEffect, useState } from "react";
import "./WorkflowScreens.css";

function Brand() {
  return (
    <div className="workflow-brand">
      <span className="workflow-brand-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Aakaar<span className="brand-ai">AI</span></span>
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
  onBack,
  onGenerate,
}) {
  const maxLength = 500;

  return (
    <WorkflowLayout onBack={onBack}>
      <div className="workflow-eyebrow">
        TEXT TO MUSIC
      </div>

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

export function GenerationLoadingScreen({ onBack, onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4000;
    const startTime = performance.now();
    let frameId;

    function update(now) {
      const elapsed = now - startTime;
      const next = Math.min(
        100,
        Math.floor((elapsed / duration) * 100)
      );

      setProgress(next);

      if (elapsed >= duration) {
        onComplete(null);
      } else {
        frameId = requestAnimationFrame(update);
      }
    }

    frameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return (
    <WorkflowLayout onBack={onBack}>
      <div className="loading-visual" aria-hidden="true">
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

      <p className="workflow-description">
        Turning your words into music.
      </p>

      <div className="generation-progress">
        <div className="generation-progress-track">
          <div
            className="generation-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span>{progress}%</span>
      </div>
    </WorkflowLayout>
  );
}

export function AudioOutputScreen({
  prompt,
  audioUrl,
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
          <p>AI-generated music</p>
        </div>

        {audioUrl ? (
          <>
            <audio
              className="audio-player"
              controls
              src={audioUrl}
            >
              Your browser does not support audio playback.
            </audio>

            <a
              className="workflow-primary-button download-button"
              href={audioUrl}
              download="aakaar-ai-composition.mp3"
            >
              <span>Download audio</span>
              <span aria-hidden="true">↓</span>
            </a>
          </>
        ) : (
          <div className="audio-unavailable">
            <p>
              Your audio player will appear here when the music
              generator is connected.
            </p>
            <button
              type="button"
              className="workflow-primary-button"
              disabled
            >
              Audio not connected yet
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        className="workflow-secondary-button"
        onClick={onCreateAnother}
      >
        Create another
      </button>

      <p className="output-prompt">
        {prompt}
      </p>
    </WorkflowLayout>
  );
}
