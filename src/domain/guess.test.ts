import { loadAllGuesses, saveGuesses } from "./guess";

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
