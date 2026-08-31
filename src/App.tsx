import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Game } from "./components/Game";
import React, { useEffect, useState } from "react";
import { Infos } from "./components/panels/Infos";
import { Settings } from "./components/panels/Settings";
import { useSettings } from "./hooks/useSettings";
import { Profile } from "./components/panels/Profile";
import { loadProgress, PlayerProgress } from "./domain/progress";
import { History } from "./components/panels/History";
import { Statistics } from "./components/panels/Statistics";
import Twemoji from "./components/Twemoji";

export type GameMode = "daily" | "practice" | "challenge";

export default function App() {
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(
    () => window.location.hash === "#history"
  );
  const [statsOpen, setStatsOpen] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(() =>
    loadProgress()
  );
  const challengeSeed = new URLSearchParams(window.location.search).get(
    "challenge"
  );
  const gameMode: GameMode = challengeSeed ? "challenge" : "daily";
  const [practiceRound, setPracticeRound] = useState(() =>
    Number(localStorage.getItem("melble-practice-round") || "1")
  );

  const [settingsData, updateSettings] = useSettings();

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const openHistoryFromHash = () =>
      setHistoryOpen(window.location.hash === "#history");
    window.addEventListener("hashchange", openHistoryFromHash);
    return () => window.removeEventListener("hashchange", openHistoryFromHash);
  }, []);

  const closeHistory = () => {
    setHistoryOpen(false);
    if (window.location.hash === "#history") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
  };

  const closeStats = () => {
    setStatsOpen(false);
  };

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
      <Profile
        isOpen={profileOpen}
        close={() => setProfileOpen(false)}
        progress={progress}
        onChange={setProgress}
      />
      <History
        isOpen={historyOpen}
        close={closeHistory}
        onViewStats={() => setStatsOpen(true)}
      />
      <Statistics isOpen={statsOpen} close={closeStats} />
      <div className="cafe-world flex justify-center flex-auto text-stone-100">
        <div className="w-full flex flex-col cafe-game-shell">
          <div className="cafe-game-content">
            <section
              className="barista-banner"
              aria-label="MelBurb café barista"
            >
              <img
                src={`${process.env.PUBLIC_URL}/images/cafe/melburb-barista.gif`}
                alt="An 8-bit barista making coffee at a Melbourne café"
              />
              <div className="barista-banner-copy">
                <h1 className="pixel-title barista-title">
                  ME<span>L</span>BU<span>R</span>B
                </h1>
                <span>FRESHLY BREWED DAILY</span>
                <strong>ONE MELBOURNE SUBURB</strong>
                <small>CAN YOU NAME IT?</small>
              </div>
              <nav className="site-menu" aria-label="Player menu">
                <button type="button" onClick={() => setInfoOpen(true)}>
                  How to Play
                </button>
                <button type="button" onClick={() => setProfileOpen(true)}>
                  Login / Register
                </button>
                <button type="button" onClick={() => setStatsOpen(true)}>
                  Statistics
                </button>
                <button type="button" onClick={() => setSettingsOpen(true)}>
                  Settings
                </button>
              </nav>
            </section>
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
            <footer className="cafe-credit">
              <Twemoji text="☕" className="cafe-credit-icon" />
              <p>
                We&apos;re shouting a coffee to the original Melble GitHub brew,
                the Worldle fork that inspired this site — with a tip of the
                beanie to Wordle creator Josh Wardle.
              </p>
              <Twemoji text="☕" className="cafe-credit-icon" />
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
