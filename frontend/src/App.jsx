import { useState } from "react";
import SplashScreen from "./screens/SplashScreen.jsx";
import FeatureSelection from "./screens/FeatureSelection.jsx";
import {
  CreateMusicScreen,
  GenerationLoadingScreen,
  AudioOutputScreen,
} from "./screens/WorkflowScreens.jsx";
import "./App.css";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("splash");
  const [prompt, setPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);

  function startMusicCreation() {
    setCurrentScreen("create");
  }

  function generateMusic() {
    if (!prompt.trim()) return;

    setAudioUrl(null);
    setCurrentScreen("loading");
  }

  function finishGeneration(url = null) {
    setAudioUrl(url);
    setCurrentScreen("output");
  }

  function goBackToCreate() {
    setCurrentScreen("create");
  }

  function startOver() {
    setPrompt("");
    setAudioUrl(null);
    setCurrentScreen("features");
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
          onSelectFeature={startMusicCreation}
        />
      )}

      {currentScreen === "create" && (
        <CreateMusicScreen
          prompt={prompt}
          setPrompt={setPrompt}
          onBack={() => setCurrentScreen("features")}
          onGenerate={generateMusic}
        />
      )}

      {currentScreen === "loading" && (
        <GenerationLoadingScreen
          onBack={goBackToCreate}
          onComplete={finishGeneration}
        />
      )}

      {currentScreen === "output" && (
        <AudioOutputScreen
          prompt={prompt}
          audioUrl={audioUrl}
          onBack={goBackToCreate}
          onCreateAnother={startOver}
        />
      )}
    </div>
  );
}
