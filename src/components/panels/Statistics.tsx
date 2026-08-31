import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase, supabaseUrl, supabaseAnonKey } from "../../lib/supabase";
import { Panel } from "./Panel";
import { formatDistance } from "../../domain/geography";

interface StatisticsProps {
  isOpen: boolean;
  close: () => void;
}

interface GameResult {
  id: number;
  game_key: string;
  mode: "daily" | "practice" | "challenge";
  score: number;
  guesses_count: number;
  closest_distance_m: number;
  solved: boolean;
  played_at: string;
}

interface GlobalStats {
  totalUsers: number;
  totalGames: number;
  totalSolved: number;
  globalWinRate: number;
  dailyGames: number;
  dailySolved: number;
  dailyWinRate: number;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalPoints: number;
  totalGames: number;
  solvedGames: number;
  winRate: number;
  dailyWinRate: number;
  maxStreak: number;
  currentStreak: number;
  avgGuesses: number;
  avgDistance: number;
}

type LeaderboardSort =
  | "points"
  | "winRate"
  | "streak"
  | "currentStreak"
  | "avgGuesses"
  | "avgDistance";

type Tab = "mine" | "global" | "leaderboard";

export function Statistics({ isOpen, close }: StatisticsProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("mine");
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSort, setLeaderboardSort] =
    useState<LeaderboardSort>("points");

  // Fetch personal game history
  useEffect(() => {
    if (!isOpen || !session?.user) return;

    setLoading(true);
    setError("");
    supabase
      .from("game_results")
      .select(
        "id, game_key, mode, score, guesses_count,\n        closest_distance_m, solved, played_at"
      )
      .eq("user_id", session.user.id)
      .order("played_at", { ascending: false })
      .then(({ data, error: historyError }) => {
        setLoading(false);
        if (historyError) {
          setError("Your statistics could not be loaded. Please try again.");
          return;
        }
        setResults((data || []) as GameResult[]);
      });
  }, [isOpen, session?.user]);

  // Fetch global stats
  useEffect(() => {
    if (!isOpen || activeTab !== "global") return;

    setGlobalLoading(true);
    fetchGlobalStats().then(
      (data) => {
        setGlobalStats(data);
        setGlobalLoading(false);
      },
      (error) => {
        console.error("Failed to fetch global stats:", error);
        setGlobalLoading(false);
        // Don't set error state here - we'll show a user-friendly message in the UI
      }
    );
  }, [isOpen, activeTab]);

  // Fetch leaderboard
  useEffect(() => {
    if (!isOpen || activeTab !== "leaderboard") return;

    setLeaderboardLoading(true);
    fetchLeaderboard(leaderboardSort).then(
      (data) => {
        setLeaderboard(data);
        setLeaderboardLoading(false);
      },
      (error) => {
        console.error("Failed to fetch leaderboard:", error);
        setLeaderboardLoading(false);
        // Don't set error state here - we'll show a user-friendly message in the UI
      }
    );
  }, [isOpen, activeTab, leaderboardSort]);

  const totalGames = results.length;
  const solvedGames = results.filter((r) => r.solved).length;
  const winRatio = totalGames > 0 ? solvedGames / totalGames : 0;
  const totalPoints = results.reduce(
    (total, r) => total + (r.mode === "daily" ? r.score : 0),
    0
  );
  const dailyGames = results.filter((r) => r.mode === "daily");
  const practiceGames = results.filter((r) => r.mode === "practice");
  const challengeGames = results.filter((r) => r.mode === "challenge");

  const avgGuesses =
    solvedGames > 0
      ? results
          .filter((r) => r.solved)
          .reduce((sum, r) => sum + r.guesses_count, 0) / solvedGames
      : 0;

  const avgDistance =
    totalGames > 0
      ? results.reduce((sum, r) => sum + r.closest_distance_m, 0) / totalGames
      : 0;

  const guessDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  results
    .filter((r) => r.solved)
    .forEach((r) => {
      if (r.guesses_count >= 1 && r.guesses_count <= 6) {
        guessDistribution[r.guesses_count]++;
      }
    });

  const maxDistribution = Math.max(...Object.values(guessDistribution)) || 1;

  const currentStreak = calculateCurrentStreak(results);
  const maxStreak = calculateMaxStreak(results);

  return (
    <Panel title="Statistics" isOpen={isOpen} close={close}>
      {authLoading ? (
        <p>Checking your account\u2026</p>
      ) : !session?.user ? (
        <div className="history-empty">
          <strong>Sign in to view statistics</strong>
          <p>
            Open the coffee-cup Player Card to create an account or sign in.
          </p>
        </div>
      ) : (
        <>
          <div className="statistics-tabs">
            <button
              className={activeTab === "mine" ? "active" : ""}
              onClick={() => setActiveTab("mine")}
            >
              My Stats
            </button>
            <button
              className={activeTab === "global" ? "active" : ""}
              onClick={() => setActiveTab("global")}
            >
              Global
            </button>
            <button
              className={activeTab === "leaderboard" ? "active" : ""}
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          {activeTab === "mine" && (
            <>
              {loading ? (
                <p>Calculating your statistics\u2026</p>
              ) : error ? (
                <p className="account-message">{error}</p>
              ) : totalGames === 0 ? (
                <div className="history-empty">
                  <strong>No completed games yet</strong>
                  <p>Finish a round and your statistics will appear here.</p>
                </div>
              ) : (
                <div className="statistics-content">
                  <div className="statistics-grid">
                    <StatCard label="Games Played" value={totalGames} />
                    <StatCard label="Solved" value={solvedGames} />
                    <StatCard
                      label="Win Rate"
                      value={`${Math.round(winRatio * 100)}%`}
                    />
                    <StatCard label="Total Points" value={totalPoints} />
                    <StatCard label="Current Streak" value={currentStreak} />
                    <StatCard label="Max Streak" value={maxStreak} />
                    <StatCard
                      label="Avg Guesses"
                      value={avgGuesses > 0 ? avgGuesses.toFixed(1) : "\u2014"}
                    />
                    <StatCard
                      label="Avg Distance"
                      value={formatDistance(Math.round(avgDistance))}
                    />
                  </div>

                  <div className="statistics-section">
                    <h3 className="statistics-section-title">By Mode</h3>
                    <div className="statistics-mode-grid">
                      <ModeStat
                        mode="Daily"
                        count={dailyGames.length}
                        solved={dailyGames.filter((r) => r.solved).length}
                        points={dailyGames.reduce((s, r) => s + r.score, 0)}
                      />
                      <ModeStat
                        mode="Practice"
                        count={practiceGames.length}
                        solved={practiceGames.filter((r) => r.solved).length}
                        points={0}
                      />
                      <ModeStat
                        mode="Challenge"
                        count={challengeGames.length}
                        solved={challengeGames.filter((r) => r.solved).length}
                        points={0}
                      />
                    </div>
                  </div>

                  <div className="statistics-section">
                    <h3 className="statistics-section-title">
                      Guess Distribution
                    </h3>
                    <ul className="guess-distribution">
                      {Object.entries(guessDistribution).map(
                        ([guess, count]) => (
                          <li key={guess} className="guess-distribution-row">
                            <span className="guess-number">{guess}</span>
                            <div className="guess-bar-container">
                              <div
                                className="guess-bar"
                                style={{
                                  width: `${Math.round(
                                    (count / maxDistribution) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="guess-count">{count}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "global" && (
            <>
              {globalLoading ? (
                <p>Loading global statistics\u2026</p>
              ) : globalStats ? (
                <div className="statistics-content">
                  <div className="statistics-grid">
                    <StatCard
                      label="Registered Players"
                      value={globalStats.totalUsers.toLocaleString()}
                    />
                    <StatCard
                      label="Total Games Played"
                      value={globalStats.totalGames.toLocaleString()}
                    />
                    <StatCard
                      label="Global Win Rate"
                      value={`${Math.round(globalStats.globalWinRate * 100)}%`}
                    />
                    <StatCard
                      label="Daily Games"
                      value={globalStats.dailyGames.toLocaleString()}
                    />
                    <StatCard
                      label="Daily Win Rate"
                      value={`${Math.round(globalStats.dailyWinRate * 100)}%`}
                    />
                    <StatCard
                      label="Total Solved"
                      value={globalStats.totalSolved.toLocaleString()}
                    />
                  </div>
                </div>
              ) : (
                <div className="history-empty">
                  <strong>Global statistics unavailable</strong>
                  <p>Deploy edge functions to view global stats.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "leaderboard" && (
            <>
              <div className="leaderboard-sort">
                <label htmlFor="leaderboard-sort">Sort by: </label>
                <select
                  id="leaderboard-sort"
                  value={leaderboardSort}
                  onChange={(e) =>
                    setLeaderboardSort(e.target.value as typeof leaderboardSort)
                  }
                >
                  <option value="points">Total Points</option>
                  <option value="winRate">Win Rate</option>
                  <option value="streak">Max Streak</option>
                  <option value="currentStreak">Current Streak</option>
                  <option value="avgGuesses">Avg Guesses (Low)</option>
                  <option value="avgDistance">Avg Distance (Low)</option>
                </select>
              </div>
              {leaderboardLoading ? (
                <p>Loading leaderboard\u2026</p>
              ) : leaderboard.length > 0 ? (
                <div className="leaderboard-table">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Points</th>
                        <th>Games</th>
                        <th>Win Rate</th>
                        <th>Max Streak</th>
                        <th>Current Streak</th>
                        <th>Avg Guesses</th>
                        <th>Avg Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry) => (
                        <tr key={entry.displayName}>
                          <td className="rank">{entry.rank}</td>
                          <td className="player-name">{entry.displayName}</td>
                          <td>{entry.totalPoints}</td>
                          <td>{entry.totalGames}</td>
                          <td>{Math.round(entry.winRate * 100)}%</td>
                          <td>{entry.maxStreak}</td>
                          <td>{entry.currentStreak}</td>
                          <td>
                            {entry.avgGuesses > 0
                              ? entry.avgGuesses.toFixed(1)
                              : "\u2014"}
                          </td>
                          <td>{formatDistance(entry.avgDistance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="history-empty">
                  <strong>Leaderboard unavailable</strong>
                  <p>Deploy edge functions to view leaderboard.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </Panel>
  );
}

async function fetchGlobalStats(): Promise<GlobalStats> {
  const url = `${supabaseUrl}/functions/v1/global-stats`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch global stats");
  return response.json();
}

async function fetchLeaderboard(
  sortBy: LeaderboardSort
): Promise<LeaderboardEntry[]> {
  const url = `${supabaseUrl}/functions/v1/leaderboard?sortBy=${sortBy}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  const data = await response.json();
  return data.leaderboard || [];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ModeStat({
  mode,
  count,
  solved,
  points,
}: {
  mode: string;
  count: number;
  solved: number;
  points: number;
}) {
  const rate = count > 0 ? Math.round((solved / count) * 100) : 0;
  return (
    <div className="mode-stat">
      <div className="mode-name">{mode}</div>
      <div className="mode-details">
        <span>{count} games</span>
        <span>{solved} solved</span>
        <span>{rate}% win rate</span>
        {points > 0 && <span>{points} pts</span>}
      </div>
    </div>
  );
}

function calculateCurrentStreak(results: GameResult[]): number {
  let streak = 0;
  const dailyResults = results
    .filter((r) => r.mode === "daily")
    .sort(
      (a, b) =>
        new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    );

  for (const result of dailyResults) {
    if (result.solved) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calculateMaxStreak(results: GameResult[]): number {
  let maxStreak = 0;
  let currentStreak = 0;
  const dailyResults = results
    .filter((r) => r.mode === "daily")
    .sort(
      (a, b) =>
        new Date(a.played_at).getTime() - new Date(b.played_at).getTime()
    );

  for (const result of dailyResults) {
    if (result.solved) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
}
