import { Guess, getGameScore } from "./guess";

export interface PlayerProgress {
  displayName: string;
  totalPoints: number;
  completedGames: number;
  closeCalls: number;
  achievements: string[];
  scoredGames: string[];
}

const STORAGE_KEY = "melble-player-progress-v1";

const initialProgress: PlayerProgress = {
  displayName: "Café Guest",
  totalPoints: 0,
  completedGames: 0,
  closeCalls: 0,
  achievements: [],
  scoredGames: [],
};

export function loadProgress(): PlayerProgress {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialProgress;
  try {
    return { ...initialProgress, ...JSON.parse(stored) };
  } catch {
    return initialProgress;
  }
}

export function saveDisplayName(displayName: string): PlayerProgress {
  const progress = {
    ...loadProgress(),
    displayName: displayName.trim() || "Café Guest",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function recordCompletedGame(
  gameKey: string,
  guesses: Guess[],
  clueCount: number
): PlayerProgress {
  const current = loadProgress();
  if (current.scoredGames.includes(gameKey)) return current;

  const score = getGameScore(guesses, clueCount);
  const won = guesses.some((guess) => guess.distance === 0);
  const bestDistance = Math.min(...guesses.map((guess) => guess.distance));
  const closeCall = !won && bestDistance <= 1000;
  const completedGames = current.completedGames + 1;
  const achievements = new Set(current.achievements);

  achievements.add("First brew");
  if (won && guesses.length === 1) achievements.add("First sip");
  if (closeCall) achievements.add("So close!");
  if (completedGames >= 5) achievements.add("Café regular");
  if (current.totalPoints + score >= 500) achievements.add("Laneway legend");

  const progress: PlayerProgress = {
    ...current,
    totalPoints: current.totalPoints + score,
    completedGames,
    closeCalls: current.closeCalls + (closeCall ? 1 : 0),
    achievements: Array.from(achievements),
    scoredGames: [...current.scoredGames, gameKey],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}
