import { Direction } from "./geography";

export interface Guess {
  name: string;
  distance: number;
  direction: Direction;
}

export function getGameScore(guesses: Guess[], clueCount = 0): number {
  const cluePenalty = clueCount * 10;
  if (guesses.some((guess) => guess.distance === 0)) {
    return Math.max(25, 100 - cluePenalty);
  }

  const bestDistance = Math.min(
    ...guesses.map((guess) => guess.distance),
    Number.POSITIVE_INFINITY
  );
  const proximityScore =
    bestDistance <= 250
      ? 75
      : bestDistance <= 500
      ? 50
      : bestDistance <= 1000
      ? 25
      : 0;
  return Math.max(0, proximityScore - cluePenalty);
}

export function loadAllGuesses(): Record<string, Guess[]> {
  const storedGuesses = localStorage.getItem("guesses");
  return storedGuesses != null ? JSON.parse(storedGuesses) : {};
}

export function saveGuesses(dayString: string, guesses: Guess[]): void {
  const allGuesses = loadAllGuesses();
  localStorage.setItem(
    "guesses",
    JSON.stringify({
      ...allGuesses,
      [dayString]: guesses,
    })
  );
}
