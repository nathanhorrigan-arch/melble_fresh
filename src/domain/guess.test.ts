import { loadAllGuesses, saveGuesses } from "./guess";

describe("guess persistence", () => {
  beforeEach(() => localStorage.clear());

  test("returns an empty history when no guesses have been stored", () => {
    expect(loadAllGuesses()).toEqual({});
  });

  test("adds a day's guesses without replacing existing history", () => {
    localStorage.setItem(
      "guesses",
      JSON.stringify({
        "2022-07-26": [{ name: "Carlton", distance: 1_000, direction: "S" }],
      })
    );

    saveGuesses("2022-07-27", [
      { name: "Melbourne", distance: 0, direction: "N" },
    ]);

    expect(loadAllGuesses()).toEqual({
      "2022-07-26": [{ name: "Carlton", distance: 1_000, direction: "S" }],
      "2022-07-27": [{ name: "Melbourne", distance: 0, direction: "N" }],
    });
  });
});
