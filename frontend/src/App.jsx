
import { useState } from "react";

import SplashScreen from "./screens/SplashScreen.jsx";
import FeatureSelection from "./screens/FeatureSelection.jsx";

import {
  CreateMusicScreen,
  GenerationLoadingScreen,
  AudioOutputScreen,
} from "./screens/WorkflowScreens.jsx";

import ScalePredictorScreen from "./screens/ScalePredictorScreen.jsx";
import ScaleResultsScreen from "./screens/ScaleResultsScreen.jsx";

import "./App.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://marine-scale-sacrament.ngrok-free.dev"
).replace(/\/+$/, "");

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("splash");

  // Feature 1: Text-to-Music
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [audioUrl, setAudioUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Feature 2: Music Scale Predictor
  const [scaleSelection, setScaleSelection] = useState(null);

  function startMusicCreation() {
    setError("");
    setCurrentScreen("create");
  }

  async function generateMusic() {
    if (!prompt.trim() || isGenerating) return;

    setError("");
    setAudioUrl(null);
    setDownloadUrl(null);
    setIsGenerating(true);
    setCurrentScreen("loading");

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || `Generation failed (HTTP ${response.status}).`
        );
      }

      if (!data.audio_url || !data.download_url) {
        throw new Error("The API did not return an audio file URL.");
      }

      setAudioUrl(new URL(data.audio_url, `${API_URL}/`).href);
      setDownloadUrl(new URL(data.download_url, `${API_URL}/`).href);
      setCurrentScreen("output");
    } catch (err) {
      console.error("Music generation error:", err);

      setError(
        err instanceof TypeError
          ? "Could not connect to the music server. Check that the server and tunnel are running."
          : err.message || "Something went wrong while generating music."
      );

      setCurrentScreen("create");
    } finally {
      setIsGenerating(false);
    }
  }

  function startOver() {
    setPrompt("");
    setDuration(5);
    setAudioUrl(null);
    setDownloadUrl(null);
    setError("");
    setCurrentScreen("features");
  }

  function startScalePrediction() {
    setError("");
    setScaleSelection(null);
    setCurrentScreen("scale-upload");
  }

  function handleScaleAnalyze(selection) {
    setScaleSelection(selection);
    setCurrentScreen("scale-results");
  }

  function startNewScaleAnalysis() {
    setScaleSelection(null);
    setCurrentScreen("scale-upload");
  }

  return (
    <div className="app">
      {currentScreen === "splash" && (
        <SplashScreen
          onComplete={() => setCurrentScreen("features")}
        />
      )}

      {currentScreen === "features" && (
        <FeatureSelection
          onSelectFeature={(featureId) => {
            if (featureId === "scale") {
              startScalePrediction();
            } else {
              startMusicCreation();
            }
          }}
        />
      )}

      {/* Feature 1: Text-to-Music */}

      {currentScreen === "create" && (
        <CreateMusicScreen
          prompt={prompt}
          setPrompt={setPrompt}
          duration={duration}
          setDuration={setDuration}
          error={error}
          onBack={() => setCurrentScreen("features")}
          onGenerate={generateMusic}
        />
      )}

      {currentScreen === "loading" && (
        <GenerationLoadingScreen
          onBack={() => setCurrentScreen("create")}
        />
      )}

      {currentScreen === "output" && (
        <AudioOutputScreen
          prompt={prompt}
          audioUrl={audioUrl}
          downloadUrl={downloadUrl}
          onBack={() => setCurrentScreen("create")}
          onCreateAnother={startOver}
        />
      )}

      {/* Feature 2: Music Scale Predictor */}

      {currentScreen === "scale-upload" && (
        <ScalePredictorScreen
          onBack={() => setCurrentScreen("features")}
          onAnalyze={handleScaleAnalyze}
        />
      )}

      {currentScreen === "scale-results" && (
        <ScaleResultsScreen
          selection={scaleSelection}
          onBack={() => setCurrentScreen("scale-upload")}
          onNewAnalysis={startNewScaleAnalysis}
        />
      )}
    </div>
  );
}
