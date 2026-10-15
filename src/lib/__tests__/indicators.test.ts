import { describe, expect, it } from "vitest";
import { interpretIndicator, realizedVsScheduled, coMovement, type IndicatorPoint } from "@/lib/interpretation";

const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
const series = (vals: number[], group = "SE/CO"): IndicatorPoint[] => vals.map((value, i) => ({ date: day(i), group, value }));
const ear = { label: "EAR", unit: "%", isPercent: true };

describe("interpretIndicator", () => {
  it("returns no data instead of inventing values", () => {
    expect(interpretIndicator([], 7, "Todos", ear).ok).toBe(false);
  });
  it("needs two full windows", () => {
    expect(interpretIndicator(series(Array(10).fill(50)), 7, "Todos", ear).ok).toBe(false);
  });
  it("reports percent indicators in percentage points", () => {
    const r = interpretIndicator(series([...Array(7).fill(50), ...Array(7).fill(53)]), 7, "Todos", ear);
    expect(r.ok && r.deltaPct).toBe(null);
    expect(r.ok && r.deltaAbs).toBeCloseTo(3);
    expect(r.ok && r.movement).toBe("alta");
  });
  it("treats under 0.5 p.p. as stable", () => {
    const r = interpretIndicator(series([...Array(7).fill(50), ...Array(7).fill(50.4)]), 7, "Todos", ear);
    expect(r.ok && r.movement).toBe("estavel");
  });
});

describe("realizedVsScheduled", () => {
  it("compares only dates present in both series", () => {
    const r = realizedVsScheduled([{ date: "a", value: 110 }, { date: "b", value: 50 }], [{ date: "a", value: 100 }]);
    expect(r?.days).toBe(1);
    expect(r?.diff).toBe(10);
  });
  it("returns null without overlapping dates", () => {
    expect(realizedVsScheduled([{ date: "a", value: 1 }], [])).toBe(null);
  });
});

it("coMovement never claims causation", () => {
  expect(coMovement("a", "alta", "b", "queda")).toMatch(/não demonstram relação de causa/);
});
