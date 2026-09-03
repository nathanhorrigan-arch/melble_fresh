import {
  getGameScore,
  getGuessPlaceholder,
  loadAllGuesses,
  saveGuesses,
} from "./guess";

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

  it("awards tiered points for an incorrect answer within five kilometres", () => {
    expect(getGameScore([guess(1_000)])).toBe(75);
    expect(getGameScore([guess(3_000)])).toBe(50);
    expect(getGameScore([guess(5_000)])).toBe(25);
    expect(getGameScore([guess(5_001)])).toBe(0);
  });

  it("deducts ten points for every clue", () => {
    expect(getGameScore([guess(0)], 2)).toBe(80);
    expect(getGameScore([guess(2_000)], 2)).toBe(30);
    expect(getGameScore([guess(0)], 3)).toBe(70);
  });
});

describe("distance-aware guess prompts", () => {
  const guess = (distance: number) => ({
    name: "Test suburb",
    distance,
    direction: "N" as const,
  });

  it("starts with a clear invitation to guess", () => {
    expect(getGuessPlaceholder([])).toBe("Start your guess here...");
  });

  it.each([
    [1_000, "Almost there—you could walk it!"],
    [3_000, "Your coffee’s getting warmer!"],
    [5_000, "You’re in the neighbourhood!"],
    [15_000, "Getting warmer—follow the direction clue!"],
    [15_001, "Wrong side of the coffee run!"],
  ])("uses the right feedback at %i metres", (distance, message) => {
    expect(getGuessPlaceholder([guess(distance)])).toBe(
      `${message} Click here to choose another suburb — 5 guesses left.`
    );
  });

  it("uses singular wording for the final remaining guess", () => {
    expect(
      getGuessPlaceholder([
        guess(20_000),
        guess(20_000),
        guess(20_000),
        guess(20_000),
        guess(2_000),
      ])
    ).toBe(
      "Your coffee’s getting warmer! Click here to choose another suburb — 1 guess left."
    );
  });
});
