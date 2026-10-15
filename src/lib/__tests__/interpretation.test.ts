import { describe, expect, it } from "vitest";
import { interpretPld, scenarioVsMarket, portfolioAnalysis, contractVsMarket, type PldPoint } from "@/lib/interpretation";
import type { Contract } from "@/lib/store";

const flat = (n: number, v: number): PldPoint[] =>
  Array.from({ length: n }, (_, i) => ({ d: `D${i}`, seco: v, s: v, ne: v, n: v }));

describe("interpretPld", () => {
  it("refuses comparison without two full windows", () => {
    expect(interpretPld(flat(10, 100), 7).ok).toBe(false);
  });
  it("calls a change under 1% stable", () => {
    const r = interpretPld([...flat(7, 100), ...flat(7, 100.5)], 7);
    expect(r.ok && r.movement).toBe("estavel");
  });
  it("calls a persistent 10% rise a trend", () => {
    const r = interpretPld([...flat(7, 100), ...flat(7, 110)], 7);
    expect(r.ok && r.pattern).toBe("tendencia");
    expect(r.ok && Math.round(r.deltaPct)).toBe(10);
  });
  it("calls a single-day spike pontual, not trend", () => {
    const cur = flat(7, 100);
    cur[3] = { ...cur[3], seco: 200 };
    const r = interpretPld([...flat(7, 100), ...cur], 7);
    expect(r.ok && r.pattern).toBe("pontual");
  });
});

const c = (p: Partial<Contract>): Contract => ({
  id: "1", code: "C1", name: "n", company: "A", type: "Venda", submarket: "SE/CO",
  volume: 1, price: 200, startDate: "2026-01-01", endDate: "2027-01-01", status: "Ativo", notes: "", ...p,
});

describe("scenarios and portfolio", () => {
  it("sale contract: (price − PLD) × volume × 730", () => {
    expect(scenarioVsMarket([c({})], 150, 0).total).toBe(50 * 730);
  });
  it("PLD +20% reduces sale advantage and raises purchase advantage", () => {
    const r = scenarioVsMarket([c({}), c({ id: "2", type: "Compra", price: 100 })], 100, 20);
    expect(r.rows.find((x) => x.id === "1")!.value).toBe(80 * 730);
    expect(r.rows.find((x) => x.id === "2")!.value).toBe(20 * 730);
  });
  it("flags contracts without counterparty as incomplete", () => {
    expect(portfolioAnalysis([c({ company: "" })]).incomplete).toHaveLength(1);
  });
  it("accepts a complete contract without a registry link", () => {
    expect(portfolioAnalysis([c({})]).incomplete).toHaveLength(0);
  });
  it("contract vs market needs a reference", () => {
    expect(contractVsMarket(c({}), {}).ok).toBe(false);
  });
});
