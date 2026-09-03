import { Direction } from "./geography";

export interface Guess {
  name: string;
  distance: number;
  direction: Direction;
}

const MAX_TRY_COUNT = 6;

export function getGuessPlaceholder(guesses: Guess[]): string {
  if (guesses.length === 0) return "Start your guess here...";

  const distance = guesses[guesses.length - 1].distance;
  const message =
    distance <= 1_000
      ? "Almost there—you could walk it!"
      : distance <= 3_000
      ? "Your coffee’s getting warmer!"
      : distance <= 5_000
      ? "You’re in the neighbourhood!"
      : distance <= 15_000
      ? "Getting warmer—follow the direction clue!"
      : "Wrong side of the coffee run!";
  const guessesLeft = MAX_TRY_COUNT - guesses.length;
  const guessLabel = guessesLeft === 1 ? "guess" : "guesses";

  return `${message} Click here to choose another suburb — ${guessesLeft} ${guessLabel} left.`;
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
    bestDistance <= 1000
      ? 75
      : bestDistance <= 3000
      ? 50
      : bestDistance <= 5000
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
