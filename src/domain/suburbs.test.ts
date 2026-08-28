import { sanitizeSuburbName } from "./suburbs";

describe("sanitizeSuburbName", () => {
  it.each([
    ["St Kilda", "stkilda"],
    ["Essendon-West", "essendonwest"],
    ["Macleod (Vic.)", "macleodvic."],
    ["Café Dépôt", "cafedepot"],
  ])("normalizes %s for matching", (name, expected) => {
    expect(sanitizeSuburbName(name)).toBe(expected);
  });
});
