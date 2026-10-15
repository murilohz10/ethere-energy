/**
 * Conjunto SINTÉTICO de dados hídricos e térmicos usado apenas para demonstração.
 * Não representa condições reais do SIN, nem usinas/estações reais do ONS ou da ANA.
 * Todas as leituras são calculadas a partir destes valores (funções puras abaixo).
 */

export const DEMO_LABEL = "Dados demonstrativos";

export type Subsystem = "SE/CO" | "S" | "NE" | "N";
export const SUBSYSTEMS: Subsystem[] = ["SE/CO", "S", "NE", "N"];
export const SUBSYSTEM_NAMES: Record<Subsystem, string> = {
  "SE/CO": "Sudeste/Centro-Oeste", S: "Sul", NE: "Nordeste", N: "Norte",
};

export type DayValue = { date: string; value: number | null };

const DATES = ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14"];
const series = (vals: (number | null)[]): DayValue[] => DATES.map((date, i) => ({ date, value: vals[i] ?? null }));

export const demoData = {
  /** Energia armazenada, % da EARmax. */
  storedEnergyPct: {
    "SE/CO": series([58.4, 58.0, 57.7, 57.3, 56.8, 56.5, 56.1]),
    S: series([71.2, 71.5, 71.9, 72.1, 72.0, 72.4, 72.6]),
    NE: series([49.6, 49.4, 49.5, 49.3, 49.4, 49.2, 49.3]),
    N: series([63.0, 62.4, 61.9, 61.5, 60.8, 60.4, 59.9]),
  } as Record<Subsystem, DayValue[]>,
  /** Energia natural afluente, MWmed. */
  enaMwmed: {
    "SE/CO": series([21450, 21100, 20800, 20650, 20300, 20150, 19900]),
    S: series([9800, 10150, 10400, 10600, 10500, 10900, 11050]),
    NE: series([3200, 3180, 3210, 3190, 3200, 3170, 3190]),
    N: series([5400, 5250, 5100, 4980, 4850, null, 4700]),
  } as Record<Subsystem, DayValue[]>,
  /** Reservatórios demonstrativos (fictícios). */
  reservoirs: [
    {
      name: "Reservatório Demonstrativo A", subsystem: "SE/CO" as Subsystem,
      levelM: series([402.35, 402.21, 402.08, 401.96, 401.82, 401.71, 401.58]),
      usefulPct: series([61.2, 60.7, 60.2, 59.8, 59.3, 58.9, 58.4]),
    },
    {
      name: "Reservatório Demonstrativo B", subsystem: "S" as Subsystem,
      levelM: series([588.10, 588.18, 588.27, 588.31, 588.30, 588.39, 588.44]),
      usefulPct: series([74.0, 74.3, 74.7, 74.9, 74.8, 75.2, 75.4]),
    },
  ],
  /** Geração térmica, MWmed. */
  thermal: {
    scheduled: {
      "SE/CO": series([6200, 6250, 6300, 6400, 6450, 6500, 6550]),
      S: series([1500, 1480, 1450, 1450, 1420, 1400, 1400]),
      NE: series([1800, 1820, 1850, 1850, 1880, 1900, 1900]),
      N: series([900, 920, 940, 950, 960, 980, 1000]),
    } as Record<Subsystem, DayValue[]>,
    verified: {
      "SE/CO": series([6080, 6190, 6350, 6310, 6420, 6610, 6480]),
      S: series([1460, 1490, 1410, 1430, 1400, 1390, 1370]),
      NE: series([1790, 1800, 1870, 1820, 1860, 1930, 1910]),
      N: series([880, 900, 960, 930, 950, 1010, 990]),
    } as Record<Subsystem, DayValue[]>,
  },
  /** Estação hidrológica demonstrativa (fictícia) — um único registro. */
  station: [
    { name: "Estação Demonstrativa 01", river: "Rio Demonstrativo", date: "2026-10-14", levelM: 3.42, flowM3s: 1285 },
  ],
};

/* ------------------------------- cálculos ------------------------------- */

export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export function clean(s: DayValue[]) {
  return [...s].sort((a, b) => a.date.localeCompare(b.date)).filter((p): p is { date: string; value: number } => p.value != null && Number.isFinite(p.value));
}
export const missingDays = (s: DayValue[]) => s.filter((p) => p.value == null).map((p) => p.date);

export type Trend = "alta" | "queda" | "estável";
export type Change = { from: string; to: string; first: number; last: number; deltaAbs: number; deltaPct: number | null; trend: Trend };

/** Primeiro × último registro válidos. `stableAbs` (em unidades) ou `stablePct` define estabilidade. */
export function firstLast(s: DayValue[], rule: { stableAbs?: number; stablePct?: number }): Change | null {
  const c = clean(s);
  if (c.length < 2) return null;
  const first = c[0].value, last = c[c.length - 1].value;
  const deltaAbs = last - first;
  const deltaPct = first !== 0 ? (deltaAbs / Math.abs(first)) * 100 : null;
  const stable = rule.stableAbs != null ? Math.abs(deltaAbs) < rule.stableAbs : deltaPct != null && Math.abs(deltaPct) < (rule.stablePct ?? 0);
  return { from: c[0].date, to: c[c.length - 1].date, first, last, deltaAbs, deltaPct, trend: stable ? "estável" : deltaAbs > 0 ? "alta" : "queda" };
}

const avg = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/** Média dos últimos `n` dias × média dos `n` anteriores. Null se não houver dados suficientes. */
export function periodCompare(s: DayValue[], n: number) {
  const c = clean(s);
  if (c.length < n * 2) return null;
  const cur = c.slice(-n), prev = c.slice(-n * 2, -n);
  const a = avg(cur.map((p) => p.value))!, b = avg(prev.map((p) => p.value))!;
  return { current: a, previous: b, deltaAbs: a - b, deltaPct: b !== 0 ? ((a - b) / Math.abs(b)) * 100 : null, curFrom: cur[0].date, curTo: cur[n - 1].date, prevFrom: prev[0].date, prevTo: prev[n - 1].date };
}

export const lastN = (s: DayValue[], n: number) => [...s].sort((a, b) => a.date.localeCompare(b.date)).slice(-n);

/** Programada × verificada, apenas nos dias com as duas séries. */
export function scheduledVsVerified(sched: DayValue[], ver: DayValue[]) {
  const m = new Map(clean(sched).map((p) => [p.date, p.value]));
  const days = clean(ver).filter((p) => m.has(p.date)).map((p) => ({ date: p.date, scheduled: m.get(p.date)!, verified: p.value, diff: p.value - m.get(p.date)! }));
  if (!days.length) return null;
  const sumS = days.reduce((a, d) => a + d.scheduled, 0), sumV = days.reduce((a, d) => a + d.verified, 0);
  const sorted = [...days].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  return {
    days, avgScheduled: sumS / days.length, avgVerified: sumV / days.length,
    avgDiff: (sumV - sumS) / days.length, diffPct: sumS !== 0 ? ((sumV - sumS) / sumS) * 100 : null,
    daysAbove: days.filter((d) => d.diff > 0).length, daysBelow: days.filter((d) => d.diff < 0).length,
    largest: sorted[0],
  };
}

export function sumSeries(list: DayValue[][]): DayValue[] {
  return DATES.map((date) => {
    const vals = list.map((s) => s.find((p) => p.date === date)?.value);
    return { date, value: vals.some((v) => v == null) ? null : (vals as number[]).reduce((a, b) => a + b, 0) };
  });
}

export const RULES = {
  storage: { stableAbs: 0.5 }, // p.p.
  ena: { stablePct: 2 },
  thermal: { stablePct: 2 },
  level: { stableAbs: 0.05 }, // m
} as const;

const n1 = (v: number, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const sg = (v: number, d = 1) => `${v >= 0 ? "+" : ""}${n1(v, d)}`;

export function describeStorage(sub: Subsystem, n = 7) {
  const c = firstLast(lastN(demoData.storedEnergyPct[sub], n), RULES.storage);
  if (!c) return null;
  const verb = c.trend === "estável" ? "ficou estável" : c.trend === "alta" ? "subiu" : "caiu";
  return `${DEMO_LABEL}: a energia armazenada do ${SUBSYSTEM_NAMES[sub]} ${verb} de ${n1(c.first)}% para ${n1(c.last)}% da EARmax entre ${ddmm(c.from)} e ${ddmm(c.to)} (${sg(c.deltaAbs)} p.p.${c.deltaPct != null ? `; ${sg(c.deltaPct)}% relativo` : ""}).`;
}

/** Resumo calculado de todo o conjunto, usado pelo Ethere Intelligence. */
export function demoDigest() {
  const storage = SUBSYSTEMS.map((s) => ({ subsystem: s, unit: "% EARmax", ...firstLast(demoData.storedEnergyPct[s], RULES.storage), last3vsPrev3: periodCompare(demoData.storedEnergyPct[s], 3) }));
  const ena = SUBSYSTEMS.map((s) => ({ subsystem: s, unit: "MWmed", ...firstLast(demoData.enaMwmed[s], RULES.ena), missingDays: missingDays(demoData.enaMwmed[s]) }));
  const reservoirs = demoData.reservoirs.map((r) => ({
    name: r.name, subsystem: r.subsystem,
    levelMeters: firstLast(r.levelM, RULES.level), usefulStoragePct: firstLast(r.usefulPct, RULES.storage),
  }));
  const thermal = SUBSYSTEMS.map((s) => ({
    subsystem: s, unit: "MWmed",
    scheduled: firstLast(demoData.thermal.scheduled[s], RULES.thermal),
    verified: firstLast(demoData.thermal.verified[s], RULES.thermal),
    scheduledVsVerified: (() => { const r = scheduledVsVerified(demoData.thermal.scheduled[s], demoData.thermal.verified[s]); return r && { ...r, days: undefined }; })(),
  }));
  return {
    dataset: "Série demonstrativa sintética da Ethere — NÃO são dados do ONS nem da ANA; reservatórios e estação são fictícios.",
    period: `${ddmm(DATES[0])} a ${ddmm(DATES[DATES.length - 1])}/2026 (7 dias)`,
    rules: "Armazenamento estável se |Δ| < 0,5 p.p.; ENA e térmica estáveis se |Δ| < 2%; nível estável se |Δ| < 0,05 m. Δ = último − primeiro registro.",
    storage, ena, reservoirs, thermal,
    station: { records: demoData.station, note: "Apenas um registro: não há série suficiente para tendência." },
    missingForDeeperAnalysis: [
      "Dados reais do ONS (EAR, ENA, geração térmica) e da ANA (nível, vazão)",
      "Histórico mais longo para comparar com o mesmo período de anos anteriores",
      "Precipitação/meteorologia e motivo de despacho térmico (não estão nos dados)",
      "Mais observações da estação para calcular tendência",
    ],
  };
}
