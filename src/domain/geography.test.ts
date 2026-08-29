import {
  computeProximityPercent,
  formatDistance,
  generateSquareCharacters,
  getDirectionEmoji,
} from "./geography";

describe("geography", () => {
  test.each([
    [0, 100],
    [7_000, 90],
    [35_000, 50],
    [70_000, 0],
    [100_000, 0],
  ])(
    "converts a distance of %i metres to %i%% proximity",
    (distance, expected) => {
      expect(computeProximityPercent(distance)).toBe(expected);
    }
  );

  it("builds a five-square light-theme result", () => {
    expect(generateSquareCharacters(50, "light")).toEqual([
      "🟩",
      "🟩",
      "🟨",
      "⬜",
      "⬜",
    ]);
  });

  it("uses dark empty squares in the dark theme", () => {
    expect(generateSquareCharacters(0, "dark")).toEqual([
      "⬛",
      "⬛",
      "⬛",
      "⬛",
      "⬛",
    ]);
  });

  it("formats metres as rounded kilometres", () => {
    expect(formatDistance(1_499)).toBe("1km");
    expect(formatDistance(1_500)).toBe("2km");
  });

  it("shows a celebration for an exact guess and an arrow otherwise", () => {
    expect(
      getDirectionEmoji({ name: "Melbourne", distance: 0, direction: "N" })
    ).toBe("☕");
    expect(
      getDirectionEmoji({ name: "Carlton", distance: 2_000, direction: "SE" })
    ).toBe("↘️");
  });
});
