import { Guess } from "./guess";

const MAX_DISTANCE_IN_MELBOURNE = 70_000;

export type Direction =
  | "S"
  | "W"
  | "NNE"
  | "NE"
  | "ENE"
  | "E"
  | "ESE"
  | "SE"
  | "SSE"
  | "SSW"
  | "SW"
  | "WSW"
  | "WNW"
  | "NW"
  | "NNW"
  | "N";

const DIRECTION_ARROWS: Record<Direction, string> = {
  N: "⬆️",
  NNE: "↗️",
  NE: "↗️",
  ENE: "↗️",
  E: "➡️",
  ESE: "↘️",
  SE: "↘️",
  SSE: "↘️",
  S: "⬇️",
  SSW: "↙️",
  SW: "↙️",
  WSW: "↙️",
  W: "⬅️",
  WNW: "↖️",
  NW: "↖️",
  NNW: "↖️",
};

export function getDirectionEmoji(guess: Guess) {
  return guess.distance === 0 ? "☕" : DIRECTION_ARROWS[guess.direction];
}

export function computeProximityPercent(distance: number): number {
  const proximity = Math.max(MAX_DISTANCE_IN_MELBOURNE - distance, 0);
  return Math.floor((proximity / MAX_DISTANCE_IN_MELBOURNE) * 100);
}

export function generateSquareCharacters(
  proximity: number,
  theme: "light" | "dark"
): string[] {
  const characters = new Array<string>(5);
  const greenSquareCount = Math.floor(proximity / 20);
  const yellowSquareCount = proximity - greenSquareCount * 20 >= 10 ? 1 : 0;

  characters.fill("🟩", 0, greenSquareCount);
  characters.fill("🟨", greenSquareCount, greenSquareCount + yellowSquareCount);
  characters.fill(
    theme === "light" ? "⬜" : "⬛",
    greenSquareCount + yellowSquareCount
  );

  return characters;
}

export function formatDistance(distanceInMeters: number) {
  const distanceInKm = distanceInMeters / 1000;

  return `${Math.round(distanceInKm).toLocaleString()}km`;
}
