import { useEffect, useState } from "react";
import "./SplashScreen.css";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4500;
    const startTime = performance.now();
    let frameId;

    function updateProgress(now) {
      const elapsed = now - startTime;
      const nextProgress = Math.min(
        100,
        Math.floor((elapsed / duration) * 100)
      );

      setProgress(nextProgress);

      if (elapsed >= duration) {
        setProgress(100);
        onComplete();
      } else {
        frameId = requestAnimationFrame(updateProgress);
      }
    }

    frameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(frameId);
  }, [onComplete]);

  return (
    <main className="screen splash">
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-vignette" aria-hidden="true" />

      <div className="splash-meta meta-top-left">
        <span>Text to music</span>
        <span>Studio</span>
      </div>

      <div className="splash-meta meta-top-right">
        <span>Desktop</span>
        <span>v1.0</span>
      </div>

      <span className="registration-mark registration-top">+</span>
      <span className="registration-mark registration-bottom">+</span>

      <section className="splash-center">
        <div className="mark-intro">
          <div className="logo-float">
            <div className="logo-ring" />
            <div className="logo-ring logo-ring-two" />
            <div className="logo-halo" />
            <div className="logo-blob" />

            <div className="logo-bars" aria-label="Aakaar AI">
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  className={`logo-bar bar-${bar}`}
                  key={bar}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="wordmark-group">
          <h1 className="wordmark">
            <span>Aakaar</span>
            <span className="wordmark-ai">AI</span>
          </h1>

          <div className="wordmark-streak">
            <span />
          </div>
        </div>

        <p className="splash-tagline">
          Give your words a sound.
        </p>
      </section>

      <div className="splash-meta meta-bottom-left">
        <span>Loading</span>
        <span className="loading-count">
          {String(progress).padStart(2, "0")}%
        </span>
      </div>

      <div className="splash-meta meta-bottom-right">
        <span>Words into</span>
        <span>music</span>
      </div>

      <div
        className="splash-progress-track"
        aria-label={`Loading ${progress}%`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="splash-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </main>
  );
}