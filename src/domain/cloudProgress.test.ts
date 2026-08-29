import { GameResult, progressFromResults } from "./cloudProgress";

describe("cloud progress", () => {
  it("rebuilds totals and achievements from synced results", () => {
    const results: GameResult[] = [
      {
        game_key: "2026-08-28",
        score: 100,
        guesses_count: 1,
        closest_distance_m: 0,
        solved: true,
      },
      {
        game_key: "practice-1",
        score: 50,
        guesses_count: 6,
        closest_distance_m: 2200,
        solved: false,
      },
    ];

    expect(progressFromResults(results, "Laneway Local")).toEqual({
      displayName: "Laneway Local",
      totalPoints: 150,
      completedGames: 2,
      closeCalls: 1,
      achievements: ["First brew", "First sip", "So close!"],
      scoredGames: ["2026-08-28", "practice-1"],
    });
  });

  it("unlocks regular and points achievements from cloud history", () => {
    const results: GameResult[] = Array.from({ length: 5 }, (_, index) => ({
      game_key: `practice-${index + 1}`,
      score: 100,
      guesses_count: 2,
      closest_distance_m: 0,
      solved: true,
    }));

    const progress = progressFromResults(results, "Café Regular");
    expect(progress.totalPoints).toBe(500);
    expect(progress.achievements).toEqual([
      "First brew",
      "Café regular",
      "Laneway legend",
    ]);
  });
});
