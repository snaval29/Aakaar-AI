import { useState, useCallback, useRef } from "react";

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
  "https://language-molehill-gong.ngrok-free.dev"
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
  const abortRef = useRef(null);

  // Feature 2: Music Scale Predictor
  const [scaleSelection, setScaleSelection] = useState(null);
  const [scaleResults, setScaleResults] = useState(null);
  const [isAnalyzingScale, setIsAnalyzingScale] = useState(false);
  const [scaleError, setScaleError] = useState("");

  const goToFeatures = useCallback(() => setCurrentScreen("features"), []);

  function startMusicCreation() {
    setError("");
    setCurrentScreen("create");
  }

  async function generateMusic() {
    if (!prompt.trim() || isGenerating) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setAudioUrl(null);
    setDownloadUrl(null);
    setIsGenerating(true);
    setCurrentScreen("loading");

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        signal: controller.signal,
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

      const fullAudioUrl = new URL(data.audio_url, `${API_URL}/`).href;
      
      // Fetch audio binary with ngrok-skip-browser-warning and convert to a local playable Blob URL
      const audioBlobRes = await fetch(fullAudioUrl, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!audioBlobRes.ok) {
        throw new Error(`Failed to load audio stream (HTTP ${audioBlobRes.status}).`);
      }

      const audioBlob = await audioBlobRes.blob();
      const localBlobUrl = URL.createObjectURL(new Blob([audioBlob], { type: "audio/wav" }));

      setAudioUrl(localBlobUrl);
      setDownloadUrl(localBlobUrl);
      setCurrentScreen("output");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Music generation error:", err);

      setError(
        err instanceof TypeError
          ? "Could not connect to the music server. Check that the server and tunnel are running."
          : err.message || "Something went wrong while generating music."
      );

      setCurrentScreen("create");
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }

  function cancelGeneration() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsGenerating(false);
    setCurrentScreen("create");
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
    setScaleError("");
    setScaleSelection(null);
    setScaleResults(null);
    setCurrentScreen("scale-upload");
  }

  async function handleScaleAnalyze(selection) {
    setScaleSelection(selection);
    setScaleError("");
    setIsAnalyzingScale(true);
    setCurrentScreen("scale-results");

    try {
      const formData = new FormData();
      formData.append("file", selection.file);
      formData.append("start_seconds", selection.startSeconds);
      formData.append("end_seconds", selection.endSeconds);

      const response = await fetch(`${API_URL}/api/analyze-scale`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || `Analysis failed (HTTP ${response.status}).`);
      }

      setScaleResults(data);
    } catch (err) {
      console.error("Scale analysis error:", err);
      setScaleError(err.message || "Failed to analyze audio.");
    } finally {
      setIsAnalyzingScale(false);
    }
  }

  function startNewScaleAnalysis() {
    setScaleSelection(null);
    setScaleResults(null);
    setScaleError("");
    setCurrentScreen("scale-upload");
  }

  return (
    <div className="app">
      {currentScreen === "splash" && (
        <SplashScreen onComplete={goToFeatures} />
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
        <GenerationLoadingScreen onBack={cancelGeneration} />
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
          results={scaleResults}
          loading={isAnalyzingScale}
          error={scaleError}
          onBack={() => setCurrentScreen("scale-upload")}
          onNewAnalysis={startNewScaleAnalysis}
        />
      )}
    </div>
  );
}
