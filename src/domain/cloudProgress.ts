import type { GameMode } from "../App";
import { supabase } from "../lib/supabase";
import { Guess, getGameScore, loadAllGuesses } from "./guess";
import { loadProgress, PlayerProgress, saveProgress } from "./progress";

export interface GameResult {
  game_key: string;
  mode: GameMode;
  score: number;
  guesses_count: number;
  closest_distance_m: number;
  solved: boolean;
}

function getStoredClueCount(gameKey: string): number {
  try {
    const clues = JSON.parse(localStorage.getItem(`clues-${gameKey}`) || "[]");
    return Array.isArray(clues) ? clues.length : 0;
  } catch {
    return 0;
  }
}

function modeFromGameKey(gameKey: string): GameMode {
  if (gameKey.startsWith("practice-")) return "practice";
  if (gameKey.startsWith("challenge-")) return "challenge";
  return "daily";
}

function toResultRow(
  userId: string,
  gameKey: string,
  mode: GameMode,
  guesses: Guess[],
  clueCount: number
) {
  return {
    user_id: userId,
    game_key: gameKey,
    mode,
    score: mode === "daily" ? getGameScore(guesses, clueCount) : 0,
    guesses_count: guesses.length,
    closest_distance_m: Math.min(...guesses.map((guess) => guess.distance)),
    solved: guesses.some((guess) => guess.distance === 0),
    clue_count: clueCount,
  };
}

export function progressFromResults(
  results: GameResult[],
  displayName: string
): PlayerProgress {
  const totalPoints = results.reduce(
    (total, result) => total + (result.mode === "daily" ? result.score : 0),
    0
  );
  const closeCalls = results.filter(
    (result) => !result.solved && result.closest_distance_m <= 5000
  ).length;
  const achievements = new Set<string>();

  if (results.length > 0) achievements.add("First brew");
  if (results.some((result) => result.solved && result.guesses_count === 1)) {
    achievements.add("First sip");
  }
  if (closeCalls > 0) achievements.add("So close!");
  if (results.length >= 5) achievements.add("Café regular");
  if (totalPoints >= 500) achievements.add("Laneway legend");

  return {
    displayName,
    totalPoints,
    completedGames: results.length,
    closeCalls,
    achievements: Array.from(achievements),
    scoredGames: results.map((result) => result.game_key),
  };
}

async function loadCloudProgress(
  userId: string,
  displayName: string
): Promise<PlayerProgress> {
  const { data, error } = await supabase
    .from("game_results")
    .select("game_key, mode, score, guesses_count, closest_distance_m, solved")
    .eq("user_id", userId)
    .order("played_at", { ascending: true });

  if (error) throw error;
  return saveProgress(progressFromResults(data || [], displayName));
}

export async function synchronizeLocalHistory(
  userId: string,
  displayName: string
): Promise<PlayerProgress> {
  const local = loadProgress();
  const allGuesses = loadAllGuesses();
  const rows = local.scoredGames.flatMap((gameKey) => {
    const guesses = allGuesses[gameKey];
    return guesses?.length
      ? [
          toResultRow(
            userId,
            gameKey,
            modeFromGameKey(gameKey),
            guesses,
            getStoredClueCount(gameKey)
          ),
        ]
      : [];
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("game_results")
      .upsert(rows, { onConflict: "user_id,game_key" });
    if (error) throw error;
  }

  return loadCloudProgress(userId, displayName);
}

export async function synchronizeCompletedGame(
  gameKey: string,
  mode: GameMode,
  guesses: Guess[],
  clueCount: number
): Promise<PlayerProgress | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { error } = await supabase
    .from("game_results")
    .upsert(toResultRow(data.user.id, gameKey, mode, guesses, clueCount), {
      onConflict: "user_id,game_key",
    });
  if (error) throw error;

  return loadCloudProgress(data.user.id, loadProgress().displayName);
}
