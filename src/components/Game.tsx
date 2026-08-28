import React, { ReactText, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getSuburbName, sanitizeSuburbName } from "../domain/suburbs";
import { SuburbInput } from "./SuburbInput";
import * as geolib from "geolib";
import { Share } from "./Share";
import { Guesses } from "./Guesses";
import { useTranslation } from "react-i18next";
import { SettingsData } from "../hooks/useSettings";
import { useMode } from "../hooks/useMode";
import { getDayString, useTodays } from "../hooks/useTodays";
import Twemoji from "./Twemoji";
import { suburbs } from "../domain/suburbs.position";
import { event } from "../domain/analytics";
import { bestGuessPercent, dayCount } from "../domain/guessStats";
import type { GameMode } from "../App";
import { getGameScore } from "../domain/guess";
import { PlayerProgress, recordCompletedGame } from "../domain/progress";

const ENABLE_TWITCH_LINK = false;
const MAX_TRY_COUNT = 6;

interface GameProps {
  settingsData: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
  gameMode: GameMode;
  practiceRound: number;
  challengeSeed?: string;
  onNextPractice: () => void;
  onProgress: (progress: PlayerProgress) => void;
}

export function Game({
  settingsData,
  updateSettings,
  gameMode,
  practiceRound,
  challengeSeed,
  onNextPractice,
  onProgress,
}: GameProps) {
  const { t, i18n } = useTranslation();
  const dailyKey = useMemo(
    () => getDayString(settingsData.shiftDayCount),
    [settingsData.shiftDayCount]
  );
  const dayString =
    gameMode === "practice"
      ? `practice-${practiceRound}`
      : gameMode === "challenge"
      ? `challenge-${challengeSeed}`
      : dailyKey;

  const suburbInputRef = useRef<HTMLInputElement>(null);

  const [todays, addGuess, randomAngle, imageScale] = useTodays(dayString);
  const { suburb, guesses } = todays;
  const suburbName = useMemo(
    () => (suburb ? getSuburbName(i18n.resolvedLanguage, suburb) : ""),
    [suburb, i18n.resolvedLanguage]
  );

  const [currentGuess, setCurrentGuess] = useState("");
  const [revealedClues, setRevealedClues] = useState<number[]>(() => {
    const stored = localStorage.getItem(`clues-${dayString}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [hideImageMode, setHideImageMode] = useMode(
    "hideImageMode",
    dayString,
    settingsData.noImageMode
  );
  const [rotationMode, setRotationMode] = useMode(
    "rotationMode",
    dayString,
    settingsData.rotationMode
  );

  const gameEnded =
    guesses.length === MAX_TRY_COUNT ||
    guesses[guesses.length - 1]?.distance === 0;
  const gameScore = getGameScore(guesses, revealedClues.length);

  useEffect(() => {
    const stored = localStorage.getItem(`clues-${dayString}`);
    setRevealedClues(stored ? JSON.parse(stored) : []);
  }, [dayString]);

  useEffect(() => {
    if (gameEnded && guesses.length > 0) {
      onProgress(recordCompletedGame(dayString, guesses, revealedClues.length));
    }
  }, [dayString, gameEnded, guesses, onProgress, revealedClues.length]);

  const revealClue = (index: number) => {
    if (revealedClues.includes(index)) return;
    const next = [...revealedClues, index];
    localStorage.setItem(`clues-${dayString}`, JSON.stringify(next));
    setRevealedClues(next);
  };

  const clueText = useMemo(() => {
    if (!suburbName || !suburb) return [];
    const cbdDistance = Math.round(
      geolib.getDistance(suburb, { latitude: -37.8136, longitude: 144.9631 }) /
        1000
    );
    return [
      `Starts with “${suburbName.charAt(0).toUpperCase()}”`,
      `${suburbName.replace(/[^a-z]/gi, "").length} letters`,
      `About ${cbdDistance} km from the CBD`,
    ];
  }, [suburb, suburbName]);

  const copyChallenge = async () => {
    const seed =
      gameMode === "challenge" ? challengeSeed || dailyKey : dayString;
    const url = `${window.location.origin}${
      window.location.pathname
    }?challenge=${encodeURIComponent(seed)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Challenge link copied!");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (suburb == null) {
      return;
    }
    e.preventDefault();
    const guessedSuburb = suburbs.find(
      (suburb) =>
        sanitizeSuburbName(getSuburbName(i18n.resolvedLanguage, suburb)) ===
        sanitizeSuburbName(currentGuess)
    );

    if (guessedSuburb == null) {
      toast.error(t("unknownSuburb"));
      return;
    }

    const newGuess = {
      name: currentGuess,
      distance: geolib.getDistance(guessedSuburb, suburb),
      direction: geolib.getCompassDirection(
        guessedSuburb,
        suburb,
        (origin, dest) =>
          Math.round(geolib.getRhumbLineBearing(origin, dest) / 45) * 45
      ),
    };

    if (guesses.length === 0) {
      event("level_start", { level_name: `#${dayCount(dayString)}` });
    }

    addGuess(newGuess);
    setCurrentGuess("");

    if (newGuess.distance === 0) {
      toast.success(t("welldone"), { delay: 2000 });

      const level = dayCount(dayString);
      event("game_won", { level, event_label: "Success" });
      event("level_end", { level_name: `#${level}`, success: true });
      event("post_score", { level, score: 100 });
    }
  };

  useEffect(() => {
    let toastId: ReactText;
    const { suburb, guesses } = todays;
    if (
      suburb &&
      guesses.length === MAX_TRY_COUNT &&
      guesses[guesses.length - 1].distance > 0
    ) {
      const level = dayCount(dayString);
      event("game_lost", { level, event_label: "Fail" });
      event("level_end", { level_name: `#${level}`, success: false });
      event("post_score", { level, score: bestGuessPercent(guesses) });

      toastId = toast.info(
        getSuburbName(i18n.resolvedLanguage, suburb).toUpperCase(),
        {
          autoClose: false,
          delay: 2000,
        }
      );
    }

    return () => {
      if (toastId != null) {
        toast.dismiss(toastId);
      }
    };
  }, [todays, dayString, i18n.resolvedLanguage]);

  return (
    <div className="flex-grow flex flex-col mx-3 sm:mx-5">
      <div className="game-status">
        <div>
          <span className="status-label">MODE</span>
          <strong>{gameMode.toUpperCase()}</strong>
        </div>
        <div>
          <span className="status-label">TABLE</span>
          <strong>
            {gameMode === "daily"
              ? `#${dayCount(dailyKey)}`
              : gameMode === "practice"
              ? practiceRound
              : "FRIEND"}
          </strong>
        </div>
        <div>
          <span className="status-label">POT</span>
          <strong>{Math.max(25, 100 - revealedClues.length * 10)} PTS</strong>
        </div>
      </div>
      {hideImageMode && !gameEnded && (
        <button
          className="font-bold border-2 p-1 rounded uppercase my-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          type="button"
          onClick={() => setHideImageMode(false)}
        >
          <Twemoji
            text={t("showSuburb")}
            options={{ className: "inline-block" }}
          />
        </button>
      )}
      <div className="flex my-1">
        {settingsData.allowShiftingDay && settingsData.shiftDayCount > 0 && (
          <button
            type="button"
            onClick={() =>
              updateSettings({
                shiftDayCount: Math.max(0, settingsData.shiftDayCount - 1),
              })
            }
          >
            <Twemoji text="↪️" className="text-xl" />
          </button>
        )}
        <img
          className={`pointer-events-none max-h-52 m-auto transition-transform duration-700 ease-in dark:invert ${
            hideImageMode && !gameEnded ? "h-0" : "h-full"
          }`}
          alt="suburb to guess"
          src={`images/suburbs/${suburb?.code.toLowerCase()}/vector.svg`}
          style={
            rotationMode && !gameEnded
              ? {
                  transform: `rotate(${randomAngle}deg) scale(${imageScale})`,
                }
              : {}
          }
        />
        {settingsData.allowShiftingDay && settingsData.shiftDayCount < 7 && (
          <button
            type="button"
            onClick={() =>
              updateSettings({
                shiftDayCount: Math.min(7, settingsData.shiftDayCount + 1),
              })
            }
          >
            <Twemoji text="↩️" className="text-xl" />
          </button>
        )}
      </div>
      {rotationMode && !hideImageMode && !gameEnded && (
        <button
          className="font-bold rounded p-1 border-2 uppercase mb-2 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
          type="button"
          onClick={() => setRotationMode(false)}
        >
          <Twemoji
            text={t("cancelRotation")}
            options={{ className: "inline-block" }}
          />
        </button>
      )}
      <Guesses
        targetSuburb={suburb}
        rowCount={MAX_TRY_COUNT}
        guesses={guesses}
        settingsData={settingsData}
        suburbInputRef={suburbInputRef}
      />
      {!gameEnded && suburb && (
        <section className="clue-board">
          <div className="flex items-center justify-between mb-2">
            <h2>BARISTA CLUES</h2>
            <span>-10 points each</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {clueText.map((clue, index) => (
              <button
                key={clue}
                type="button"
                onClick={() => revealClue(index)}
                className={revealedClues.includes(index) ? "revealed" : ""}
              >
                {revealedClues.includes(index) ? clue : `Clue ${index + 1}`}
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="my-2">
        {gameEnded && suburb ? (
          <>
            <div className="score-ticket">
              <span>
                {guesses.some((guess) => guess.distance === 0)
                  ? "SUBURB FOUND"
                  : gameScore
                  ? "CLOSE CALL"
                  : "NEXT COFFEE'S ON US"}
              </span>
              <strong>+{gameScore} POINTS</strong>
              {!guesses.some((guess) => guess.distance === 0) &&
                gameScore > 0 && (
                  <small>
                    Distance points awarded because the suburb was not guessed
                    exactly.
                  </small>
                )}
            </div>
            <Share
              guesses={guesses}
              dayString={dayString}
              settingsData={settingsData}
              hideImageMode={hideImageMode}
              rotationMode={rotationMode}
            />
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                className="cafe-button flex-1"
                onClick={copyChallenge}
              >
                Challenge a friend
              </button>
              {gameMode === "practice" && (
                <button
                  type="button"
                  className="cafe-button flex-1"
                  onClick={onNextPractice}
                >
                  Next practice
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                className="underline text-center block mt-4 whitespace-nowrap"
                href={`https://www.google.com/maps?q=${suburbName},+VIC&hl=${i18n.resolvedLanguage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twemoji
                  text={t("showOnGoogleMaps")}
                  options={{ className: "inline-block" }}
                />
              </a>
              <a
                className="underline text-center block mt-4 whitespace-nowrap"
                href={`https://${i18n.resolvedLanguage}.wikipedia.org/wiki/${suburbName},_Victoria`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twemoji
                  text={t("showOnWikipedia")}
                  options={{ className: "inline-block" }}
                />
              </a>
            </div>
            {ENABLE_TWITCH_LINK && (
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  className="underline text-center block mt-4 whitespace-nowrap"
                  href="https://www.twitch.tv/t3uteuf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twemoji
                    text="More? Play on Twitch! 👾"
                    options={{ className: "inline-block" }}
                  />
                </a>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <SuburbInput
                inputRef={suburbInputRef}
                currentGuess={currentGuess}
                setCurrentGuess={setCurrentGuess}
              />
              <button
                className="rounded font-bold p-1 flex items-center justify-center border-2 uppercase my-0.5 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-slate-800 dark:active:bg-slate-700"
                type="submit"
              >
                <Twemoji
                  text="🇦🇺"
                  options={{ className: "inline-block" }}
                  className="flex items-center justify-center"
                />{" "}
                <span className="ml-1">{t("guess")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
