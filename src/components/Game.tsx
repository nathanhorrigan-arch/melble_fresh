import React, { ReactText, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getSuburbName, sanitizeSuburbName } from "../domain/suburbs";
import { SuburbInput } from "./SuburbInput";
import * as geolib from "geolib";
import { Guesses } from "./Guesses";
import { useTranslation } from "react-i18next";
import { SettingsData } from "../hooks/useSettings";
import { useMode } from "../hooks/useMode";
import { getDayString, getSuburbForDay, useTodays } from "../hooks/useTodays";
import Twemoji from "./Twemoji";
import { suburbs } from "../domain/suburbs.position";
import { event } from "../domain/analytics";
import { bestGuessPercent, dayCount } from "../domain/guessStats";
import type { GameMode } from "../App";
import { getGameScore } from "../domain/guess";
import { PlayerProgress, recordCompletedGame } from "../domain/progress";
import { synchronizeCompletedGame } from "../domain/cloudProgress";

const MAX_TRY_COUNT = 6;
const RETRY_PROMPTS = [
  "Coffee down. Where next?",
  "Cafe miss - try again.",
  "Wrong tram stop.",
  "Another sip. Where next?",
  "Last cup - choose wisely!",
];

function getGuessPlaceholder(guessCount: number) {
  if (guessCount === 0) return "Start your guess here...";

  const guessesLeft = MAX_TRY_COUNT - guessCount;
  const prompt =
    RETRY_PROMPTS[Math.min(guessCount - 1, RETRY_PROMPTS.length - 1)];
  const guessLabel = guessesLeft === 1 ? "guess" : "guesses";
  return `${prompt} ${guessesLeft} ${guessLabel} left.`;
}

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
  const yesterdaySuburbName = useMemo(
    () =>
      getSuburbName(i18n.resolvedLanguage, getSuburbForDay(getDayString(-1))),
    [i18n.resolvedLanguage]
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
  const [showWinCelebration, setShowWinCelebration] = useState(false);
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
  const awardsPoints = gameMode === "daily";
  const gameScore = awardsPoints
    ? getGameScore(guesses, revealedClues.length)
    : 0;

  useEffect(() => {
    const stored = localStorage.getItem(`clues-${dayString}`);
    setRevealedClues(stored ? JSON.parse(stored) : []);
  }, [dayString]);

  useEffect(() => {
    if (!showWinCelebration) return;
    const timeout = window.setTimeout(() => setShowWinCelebration(false), 2600);
    return () => window.clearTimeout(timeout);
  }, [showWinCelebration]);

  useEffect(() => {
    if (gameEnded && guesses.length > 0) {
      const localProgress = recordCompletedGame(
        dayString,
        guesses,
        revealedClues.length,
        awardsPoints
      );
      onProgress(localProgress);
      synchronizeCompletedGame(
        dayString,
        gameMode,
        guesses,
        revealedClues.length
      )
        .then((cloudProgress) => {
          if (cloudProgress) onProgress(cloudProgress);
        })
        .catch(() => {
          toast.info(
            "Score saved on this device. Cloud sync will retry later."
          );
        });
    }
  }, [
    dayString,
    gameEnded,
    gameMode,
    guesses,
    onProgress,
    awardsPoints,
    revealedClues.length,
  ]);

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
      setShowWinCelebration(true);
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
        <span className="suburb-answer-toast">
          <Twemoji text="☕" />
          <span className="suburb-answer-details">
            <strong>
              {getSuburbName(i18n.resolvedLanguage, suburb).toUpperCase()}
            </strong>
            <small>
              {awardsPoints
                ? `+${gameScore} POINTS`
                : `${gameMode.toUpperCase()} — NO POINTS`}
            </small>
            <a href="#history">VIEW YOUR HISTORY</a>
          </span>
        </span>,
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
  }, [
    todays,
    dayString,
    gameMode,
    gameScore,
    awardsPoints,
    i18n.resolvedLanguage,
  ]);

  return (
    <div className="flex-grow flex flex-col mx-3 sm:mx-5">
      {showWinCelebration && (
        <div className="win-celebration" role="status" aria-live="polite">
          <img
            src={`${process.env.PUBLIC_URL}/images/cafe/melburb-win-cup.png`}
            alt="8-bit coffee cup sparkling in celebration"
          />
          <strong>PERFECT POUR!</strong>
        </div>
      )}
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
      <div className="my-2">
        {gameEnded && suburb ? (
          <>
            {guesses.some((guess) => guess.distance === 0) ? (
              <div className="suburb-revealed-card">
                <div className="suburb-revealed-header">
                  <span className="suburb-revealed-emoji">🎉</span>
                  <span className="suburb-revealed-title">
                    You got it, you found
                  </span>
                  <strong className="suburb-revealed-name">
                    {suburbName}!
                  </strong>
                  <span className="suburb-revealed-points">
                    +{gameScore} POINTS
                  </span>
                </div>
                <div className="suburb-revealed-actions">
                  <a
                    className="suburb-revealed-action"
                    href={`https://www.google.com/maps?q=${suburbName},+VIC&hl=${i18n.resolvedLanguage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="block text-4xl">🗺️</span>
                    <span className="text-sm">View {suburbName} on Maps</span>
                  </a>
                  <a
                    className="suburb-revealed-action"
                    href={`https://${i18n.resolvedLanguage}.wikipedia.org/wiki/${suburbName},_Victoria`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="block text-4xl">📖</span>
                    <span className="text-sm">Read about {suburbName}</span>
                  </a>
                  <a
                    className="suburb-revealed-action"
                    href={getBroadsheetSuburbUrl(suburbName)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twemoji
                      text="☕"
                      options={{ className: "block text-4xl" }}
                    />
                    <span className="text-sm">Find cafés in {suburbName}</span>
                  </a>
                </div>
              </div>
            ) : (
              <>
                <div className="score-ticket">
                  <span>
                    {gameScore ? "CLOSE CALL" : "NEXT COFFEE'S ON US"}
                  </span>
                  <strong>+{gameScore} POINTS</strong>
                  {gameScore > 0 && (
                    <small>
                      Distance points awarded because the suburb was not guessed
                      exactly.
                    </small>
                  )}
                </div>
                <div className="suburb-revealed-card mt-3">
                  <div className="suburb-revealed-header">
                    <span className="suburb-revealed-emoji">☕</span>
                    <span className="suburb-revealed-title">
                      Last cup poured — the suburb was
                    </span>
                    <strong className="suburb-revealed-name">
                      {suburbName}!
                    </strong>
                  </div>
                  <div className="suburb-revealed-actions">
                    <a
                      className="suburb-revealed-action"
                      href={`https://www.google.com/maps?q=${suburbName},+VIC&hl=${i18n.resolvedLanguage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="block text-4xl">🗺️</span>
                      <span className="text-sm">View {suburbName} on Maps</span>
                    </a>
                    <a
                      className="suburb-revealed-action"
                      href={`https://${i18n.resolvedLanguage}.wikipedia.org/wiki/${suburbName},_Victoria`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="block text-4xl">📖</span>
                      <span className="text-sm">Read about {suburbName}</span>
                    </a>
                    <a
                      className="suburb-revealed-action"
                      href={getBroadsheetSuburbUrl(suburbName)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twemoji
                        text="☕"
                        options={{ className: "block text-4xl" }}
                      />
                      <span className="text-sm">
                        Find cafés in {suburbName}
                      </span>
                    </a>
                  </div>
                </div>
                {gameMode === "practice" && (
                  <button
                    type="button"
                    className="cafe-button w-full mt-3"
                    onClick={onNextPractice}
                  >
                    Next practice
                  </button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <SuburbInput
                  inputRef={suburbInputRef}
                  currentGuess={currentGuess}
                  setCurrentGuess={setCurrentGuess}
                  placeholder={getGuessPlaceholder(guesses.length)}
                />
                <button
                  className="rounded font-bold p-3 flex items-center justify-center border-2 uppercase my-0.5 w-full bg-amber-500 text-stone-950 hover:bg-amber-400 active:bg-amber-600 border-amber-600 transition-colors text-xl sm:text-2xl"
                  type="submit"
                >
                  <Twemoji
                    text="☕"
                    options={{ className: "inline-block" }}
                    className="flex items-center justify-center mr-3"
                  />
                  <span>{t("guess")}</span>
                  <Twemoji
                    text="☕"
                    options={{ className: "inline-block" }}
                    className="flex items-center justify-center ml-3"
                  />
                </button>
              </div>
            </form>
            {suburb && (
              <div className="flex gap-3 my-2">
                <section className="clue-board flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h2>BARISTA CLUES</h2>
                    <span>
                      {awardsPoints ? "-10 points each" : "Free in practice"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {clueText.map((clue, index) => (
                      <button
                        key={clue}
                        type="button"
                        onClick={() => revealClue(index)}
                        className={
                          revealedClues.includes(index) ? "revealed" : ""
                        }
                      >
                        {revealedClues.includes(index)
                          ? clue
                          : `Clue ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </section>
                {awardsPoints && (
                  <div className="clue-board flex-shrink-0 w-36 text-center">
                    <div className="flex items-center justify-between mb-2">
                      <h2>POT</h2>
                    </div>
                    <strong
                      aria-live="polite"
                      className="text-xl font-bold text-amber-400"
                    >
                      {Math.max(25, 100 - revealedClues.length * 10)} PTS
                    </strong>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <section className="yesterday-cafe">
        <span>YESTERDAY&apos;S CAFÉ LOCATION</span>
        <strong>{yesterdaySuburbName.toUpperCase()}</strong>
        <div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${yesterdaySuburbName} cafés VIC`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twemoji text="☕" options={{ className: "inline-block" }} /> Find
            cafés in {yesterdaySuburbName}
          </a>
        </div>
      </section>
    </div>
  );
}

function getBroadsheetSuburbUrl(suburbName: string): string {
  const encodedSuburb = encodeURIComponent(suburbName);
  return `https://www.google.com/maps/search/coffee+shops+in+${encodedSuburb},+Victoria`;
}
