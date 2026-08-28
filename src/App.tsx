import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Game } from "./components/Game";
import React, { useEffect, useState } from "react";
import { Infos } from "./components/panels/Infos";
import { Settings } from "./components/panels/Settings";
import { useSettings } from "./hooks/useSettings";
import { Stats } from "./components/panels/Stats";
import Twemoji from "./components/Twemoji";
import { Profile } from "./components/panels/Profile";
import { loadProgress, PlayerProgress } from "./domain/progress";

export type GameMode = "daily" | "practice" | "challenge";

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(() =>
    loadProgress()
  );
  const challengeSeed = new URLSearchParams(window.location.search).get(
    "challenge"
  );
  const [gameMode, setGameMode] = useState<GameMode>(
    challengeSeed ? "challenge" : "daily"
  );
  const [practiceRound, setPracticeRound] = useState(() =>
    Number(localStorage.getItem("melble-practice-round") || "1")
  );

  const [settingsData, updateSettings] = useSettings();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <>
      <ToastContainer
        hideProgressBar
        position="top-center"
        transition={Flip}
        theme="dark"
        autoClose={2000}
        bodyClassName="font-bold text-center"
        toastClassName="flex justify-center m-2 max-w-full"
        style={{ width: 500, maxWidth: "100%" }}
      />
      <Infos
        isOpen={infoOpen}
        close={() => setInfoOpen(false)}
        settingsData={settingsData}
      />
      <Settings
        isOpen={settingsOpen}
        close={() => setSettingsOpen(false)}
        settingsData={settingsData}
        updateSettings={updateSettings}
      />
      <Stats isOpen={statsOpen} close={() => setStatsOpen(false)} />
      <Profile
        isOpen={profileOpen}
        close={() => setProfileOpen(false)}
        progress={progress}
        onChange={setProgress}
      />
      <div className="cafe-world flex justify-center flex-auto text-stone-100">
        <div className="cafe-window" aria-hidden="true">
          <div className="pixel-rain" />
          <div className="tram">96</div>
        </div>
        <div className="w-full max-w-xl flex flex-col cafe-game-shell">
          <header className="cafe-header px-3 flex items-center">
            <button
              className="mr-3 text-xl"
              type="button"
              onClick={() => setInfoOpen(true)}
            >
              <Twemoji text="❓" />
            </button>
            <h1 className="pixel-title text-center my-2 flex-auto">
              ME<span>l</span>B<span>l</span>E
            </h1>
            <button
              className="ml-3 text-xl"
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="Player card"
            >
              <Twemoji text="☕" />
            </button>
            <button
              className="ml-3 text-xl"
              type="button"
              onClick={() => setStatsOpen(true)}
            >
              <Twemoji text="📈" />
            </button>
            <button
              className="ml-3 text-xl"
              type="button"
              onClick={() => setSettingsOpen(true)}
            >
              <Twemoji text="⚙️" />
            </button>
          </header>
          <nav className="mode-switcher" aria-label="Game mode">
            <button
              className={gameMode === "daily" ? "active" : ""}
              onClick={() => setGameMode("daily")}
            >
              Daily
            </button>
            <button
              className={gameMode === "practice" ? "active" : ""}
              onClick={() => setGameMode("practice")}
            >
              Practice
            </button>
            {challengeSeed && (
              <button
                className={gameMode === "challenge" ? "active" : ""}
                onClick={() => setGameMode("challenge")}
              >
                Challenge
              </button>
            )}
          </nav>
          <Game
            settingsData={settingsData}
            updateSettings={updateSettings}
            gameMode={gameMode}
            practiceRound={practiceRound}
            challengeSeed={challengeSeed || undefined}
            onProgress={setProgress}
            onNextPractice={() => {
              const next = practiceRound + 1;
              localStorage.setItem("melble-practice-round", String(next));
              setPracticeRound(next);
            }}
          />
          <div className="cafe-table-edge" aria-hidden="true">
            <span className="coffee-cup">☕</span>
            <span className="table-note">
              MELBOURNE · 8 BIT · ONE MORE ROUND
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
