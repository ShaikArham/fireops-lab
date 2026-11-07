import { describe, expect, it } from "vitest";
import { formatMinorUnits } from "@/lib/money";

describe("formatMinorUnits", () => {
  it("formats integer cents as euro currency", () => {
    expect(formatMinorUnits(12345, "EUR")).toContain("123.45");
  });

  it("rejects fractional minor units", () => {
    expect(() => formatMinorUnits(1.5, "EUR")).toThrow(TypeError);
  });
});
