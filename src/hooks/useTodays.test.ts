import { DateTime } from "luxon";
import {
  getDayString,
  millisecondsUntilNextGame,
  NEW_GAME_REFRESH_DELAY_MS,
} from "./useTodays";

describe("Melbourne daily game timing", () => {
  test("uses the Melbourne date for players in other time zones", () => {
    const lateUtcEvening = DateTime.fromISO("2026-09-04T16:00:00Z");

    expect(getDayString(undefined, lateUtcEvening)).toBe("2026-09-05");
  });

  test("schedules the refresh just after the next Melbourne midnight", () => {
    const melbourneTime = DateTime.fromISO(
      "2026-09-05T23:59:30",
      { zone: "Australia/Melbourne" }
    );

    expect(millisecondsUntilNextGame(melbourneTime)).toBe(
      30_000 + NEW_GAME_REFRESH_DELAY_MS
    );
  });

  test("continues to use local midnight through daylight-saving changes", () => {
    const beforeDstChange = DateTime.fromISO(
      "2026-10-03T23:00:00",
      { zone: "Australia/Melbourne" }
    );

    expect(millisecondsUntilNextGame(beforeDstChange)).toBe(
      60 * 60 * 1000 + NEW_GAME_REFRESH_DELAY_MS
    );
  });
});
