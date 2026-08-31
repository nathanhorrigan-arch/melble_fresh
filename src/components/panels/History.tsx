import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Panel } from "./Panel";
import { StatsContent } from "./Stats";

interface HistoryProps {
  isOpen: boolean;
  close: () => void;
  onViewStats?: () => void;
}

interface HistoryResult {
  id: number;
  game_key: string;
  mode: "daily" | "practice" | "challenge";
  score: number;
  guesses_count: number;
  closest_distance_m: number;
  solved: boolean;
  played_at: string;
}

export function History({ isOpen, close, onViewStats }: HistoryProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !session?.user) return;

    setLoading(true);
    setError("");
    supabase
      .from("game_results")
      .select(
        "id, game_key, mode, score, guesses_count, closest_distance_m, solved, played_at"
      )
      .eq("user_id", session.user.id)
      .order("played_at", { ascending: false })
      .then(({ data, error: historyError }) => {
        setLoading(false);
        if (historyError) {
          setError("Your game history could not be loaded. Please try again.");
          return;
        }
        setResults((data || []) as HistoryResult[]);
      });
  }, [isOpen, session?.user]);

  const totalPoints = results.reduce(
    (total, result) => total + (result.mode === "daily" ? result.score : 0),
    0
  );
  const solvedGames = results.filter((result) => result.solved).length;

  return (
    <Panel title="Game history" isOpen={isOpen} close={close}>
      {authLoading ? (
        <p>Checking your account…</p>
      ) : !session?.user ? (
        <div className="history-empty">
          <strong>Sign in to view your history</strong>
          <p>
            Open the coffee-cup Player Card to create an account or sign in.
          </p>
        </div>
      ) : loading ? (
        <p>Brewing your game history…</p>
      ) : error ? (
        <p className="account-message">{error}</p>
      ) : results.length === 0 ? (
        <div className="history-empty">
          <strong>No completed games yet</strong>
          <p>Finish a round and it will appear here automatically.</p>
        </div>
      ) : (
        <>
          <div className="history-summary">
            <HistoryStat label="Games" value={results.length} />
            <HistoryStat label="Solved" value={solvedGames} />
            <HistoryStat label="Points" value={totalPoints} />
            {onViewStats && (
              <button
                className="view-stats-button"
                type="button"
                onClick={onViewStats}
              >
                View Statistics \u2192
              </button>
            )}
          </div>
          <StatsContent />
          <h3 className="history-results-title">Completed games</h3>
          <div className="history-list">
            {results.map((result) => (
              <article className="history-row" key={result.id}>
                <div>
                  <strong>{formatGameName(result)}</strong>
                  <small>{formatDate(result.played_at)}</small>
                </div>
                <div>
                  <span>{result.solved ? "☕ SOLVED" : "CLOSEST"}</span>
                  <small>
                    {result.solved
                      ? `${result.guesses_count} guess${
                          result.guesses_count === 1 ? "" : "es"
                        }`
                      : formatDistance(result.closest_distance_m)}
                  </small>
                </div>
                <b>
                  {result.mode === "daily"
                    ? `+${result.score} PTS`
                    : "NO POINTS"}
                </b>
              </article>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function HistoryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function formatGameName(result: HistoryResult) {
  if (result.mode === "daily") return "Daily suburb";
  if (result.mode === "practice") return "Practice round";
  return "Friend challenge";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDistance(distance: number) {
  if (distance < 1000) return `${distance} m`;
  return `${Math.round(distance / 1000)} km`;
}
