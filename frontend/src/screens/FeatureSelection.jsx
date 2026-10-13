
import { useState } from "react";
import "./FeatureSelection.css";

const features = [
  {
    id: "music",
    title: "Text to Music",
    description: "Turn your words into music.",
    icon: "music",
    status: "Available",
  },
  {
    id: "scale",
    title: "Music Scale Predictor",
    description: "Discover the notes behind song lyrics.",
    icon: "scale",
    status: "New feature",
  },
];

function FeatureIcon({ type }) {
  if (type === "music") {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path
          d="M19 33V11L38 7V29M19 16L38 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="13"
          cy="34"
          rx="6"
          ry="4"
          transform="rotate(-18 13 34)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <ellipse
          cx="32"
          cy="30"
          rx="6"
          ry="4"
          transform="rotate(-18 32 30)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M29 8V29M29 8L40 5V25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse
        cx="23"
        cy="31"
        rx="6"
        ry="4"
        transform="rotate(-18 23 31)"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <ellipse
        cx="34"
        cy="27"
        rx="6"
        ry="4"
        transform="rotate(-18 34 27)"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 12V36M12 17V31M17 21V27"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FeatureSelection({ onSelectFeature }) {
  const [selected, setSelected] = useState(null);

  function handleFeatureClick(feature) {
    setSelected(feature.id);
    onSelectFeature(feature.id);
  }

  return (
    <main className="screen feature-screen">
      <div className="feature-grid-bg" aria-hidden="true" />

      <header className="feature-header">
        <div className="mini-brand" aria-label="Aakaar AI">
          <span className="mini-brand-symbol" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>

          <span className="mini-brand-name">
            Aakaar<span>AI</span>
          </span>
        </div>
      </header>

      <section className="feature-content">
        <h1 className="feature-heading">
          What will you
          <br />
          <span>create today?</span>
        </h1>

        <p className="feature-subtitle">
          Choose your creative direction.
        </p>

        <div className="feature-cards">
          {features.map((feature) => (
            <button
              type="button"
              key={feature.id}
              className={`feature-card ${
                selected === feature.id
                  ? "feature-card-selected"
                  : ""
              }`}
              onClick={() => handleFeatureClick(feature)}
              aria-pressed={selected === feature.id}
            >
              <div className="feature-icon">
                <FeatureIcon type={feature.icon} />
              </div>

              <div className="feature-card-bottom">
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                  <span className="feature-status">
                    {feature.status}
                  </span>
                </div>

                <span className="feature-arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
