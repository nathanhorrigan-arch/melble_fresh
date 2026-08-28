import { getGameScore, loadAllGuesses, saveGuesses } from "./guess";

describe("guess persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty history when nothing has been stored", () => {
    expect(loadAllGuesses()).toEqual({});
  });

  it("adds guesses without removing another day's history", () => {
    const firstGuess = {
      name: "Carlton",
      distance: 1_000,
      direction: "N" as const,
    };
    const secondGuess = {
      name: "Richmond",
      distance: 0,
      direction: "S" as const,
    };

    saveGuesses("2026-08-27", [firstGuess]);
    saveGuesses("2026-08-28", [secondGuess]);

    expect(loadAllGuesses()).toEqual({
      "2026-08-27": [firstGuess],
      "2026-08-28": [secondGuess],
    });
  });
});

describe("game scoring", () => {
  const guess = (distance: number) => ({
    name: "Test suburb",
    distance,
    direction: "N" as const,
  });

  it("awards 100 points for an exact answer", () => {
    expect(getGameScore([guess(0)])).toBe(100);
  });

  it("awards tiered points for an incorrect answer within one kilometre", () => {
    expect(getGameScore([guess(200)])).toBe(75);
    expect(getGameScore([guess(400)])).toBe(50);
    expect(getGameScore([guess(900)])).toBe(25);
    expect(getGameScore([guess(1_001)])).toBe(0);
  });

  it("deducts ten points for every clue", () => {
    expect(getGameScore([guess(400)], 2)).toBe(30);
    expect(getGameScore([guess(0)], 3)).toBe(70);
  });
});
