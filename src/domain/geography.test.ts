import {
  computeProximityPercent,
  formatDistance,
  generateSquareCharacters,
  getDirectionEmoji,
} from "./geography";

describe("geography game feedback", () => {
  test("converts distance to a bounded proximity percentage", () => {
    expect(computeProximityPercent(0)).toBe(100);
    expect(computeProximityPercent(35_000)).toBe(50);
    expect(computeProximityPercent(70_001)).toBe(0);
  });

  test("renders proximity squares for both themes", () => {
    expect(generateSquareCharacters(50, "light")).toEqual([
      "🟩",
      "🟩",
      "🟨",
      "⬜",
      "⬜",
    ]);
    expect(generateSquareCharacters(0, "dark")).toEqual([
      "⬛",
      "⬛",
      "⬛",
      "⬛",
      "⬛",
    ]);
  });

  test("uses celebration for a correct guess and an arrow otherwise", () => {
    expect(
      getDirectionEmoji({ name: "Melbourne", distance: 0, direction: "N" })
    ).toBe("🎉");
    expect(
      getDirectionEmoji({ name: "Carlton", distance: 1_000, direction: "SW" })
    ).toBe("↙️");
  });

  test("formats distances in rounded kilometres", () => {
    expect(formatDistance(1_499)).toBe("1km");
    expect(formatDistance(1_500)).toBe("2km");
  });
});
