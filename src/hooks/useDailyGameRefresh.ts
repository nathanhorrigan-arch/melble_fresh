import { useEffect } from "react";
import { getDayString, millisecondsUntilNextGame } from "./useTodays";

/**
 * Reloads an open Daily Challenge when Melbourne moves to the next day.
 * The visibility/focus checks cover devices that suspend background timers.
 */
export function useDailyGameRefresh(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const loadedGameDay = getDayString();
    const refreshForNewGame = () => {
      if (getDayString() !== loadedGameDay) {
        window.location.reload();
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshForNewGame();
      }
    };

    const midnightTimer = window.setTimeout(
      refreshForNewGame,
      millisecondsUntilNextGame()
    );

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshForNewGame);
    window.addEventListener("pageshow", refreshForNewGame);

    return () => {
      window.clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshForNewGame);
      window.removeEventListener("pageshow", refreshForNewGame);
    };
  }, [enabled]);
}
