import { describe, it, expect } from "vitest";
import { demoData, firstLast, scheduledVsVerified, periodCompare, RULES, type DayValue } from "@/lib/demo-hydro-thermal";

describe("demonstração hídrica e térmica", () => {
  it("SE/CO cai entre o primeiro e o último registro, em p.p.", () => {
    const c = firstLast(demoData.storedEnergyPct["SE/CO"], RULES.storage)!;
    expect(c.trend).toBe("queda");
    expect(c.deltaAbs).toBeCloseTo(56.1 - 58.4, 5);
  });
  it("variação menor que 0,5 p.p. é estável", () => {
    const s: DayValue[] = [{ date: "2026-01-01", value: 50 }, { date: "2026-01-02", value: 50.4 }];
    expect(firstLast(s, RULES.storage)!.trend).toBe("estável");
  });
  it("ignora dias nulos e evita divisão por zero", () => {
    const s: DayValue[] = [{ date: "2026-01-01", value: 0 }, { date: "2026-01-02", value: null }, { date: "2026-01-03", value: 5 }];
    const c = firstLast(s, RULES.ena)!;
    expect(c.deltaPct).toBeNull();
    expect(c.last).toBe(5);
  });
  it("diferença verificada − programada", () => {
    const r = scheduledVsVerified([{ date: "a", value: 100 }, { date: "b", value: 100 }], [{ date: "a", value: 110 }, { date: "b", value: 90 }])!;
    expect(r.avgDiff).toBe(0);
    expect(r.daysAbove).toBe(1);
  });
  it("sem dados suficientes não compara com período anterior", () => {
    expect(periodCompare(demoData.storedEnergyPct.S, 7)).toBeNull();
    expect(periodCompare(demoData.storedEnergyPct.S, 3)).not.toBeNull();
  });
});
