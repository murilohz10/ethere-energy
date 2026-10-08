/**
 * Camada de dados de mercado (PLD, reservatórios e carga).
 *
 * O PLD vem de `market_series`, carregado a partir dos dados abertos da CCEE
 * (ver `scripts/import-pld.ts`). `marketProvider` ainda gera uma série
 * determinística (mock) para reservatórios e carga, que não têm fonte oficial
 * integrada.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CCEE_SOURCE } from "./ccee";
import { toAppError } from "./errors";
import { submarkets, type Submarket } from "./types";

export type MarketSeriesKey = "pld" | "reservoir" | "load";

export type MarketPoint = {
  series: MarketSeriesKey;
  submarket: Submarket;
  referenceDate: string;
  value: number;
};

/* --------------------------------- provider -------------------------------- */

const dayIndex = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);

const baseline: Record<Submarket, number> = { "SE/CO": 172, S: 158, NE: 146, N: 134 };

/** Valor determinístico por data/submercado — estável entre sessões. */
function deterministicValue(series: MarketSeriesKey, submarket: Submarket, iso: string): number {
  const i = dayIndex(iso);
  const offset = submarkets.indexOf(submarket);
  if (series === "reservoir") {
    return +(52 + Math.sin((i + offset * 9) / 21) * 11 + Math.cos(i / 47) * 4).toFixed(2);
  }
  if (series === "load") {
    return +(64000 + Math.sin((i + offset * 5) / 9) * 3200 + offset * -4200).toFixed(0);
  }
  return +(
    baseline[submarket] +
    Math.sin((i + offset * 7) / 6) * 34 +
    Math.cos((i + offset) / 17) * 12 +
    (i % 11) * 1.4
  ).toFixed(2);
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export const marketProvider = {
  /** Leitura da fonte externa para os últimos `days` dias. */
  async fetchWindow(days = 180): Promise<MarketPoint[]> {
    const points: MarketPoint[] = [];
    for (let d = days - 1; d >= 0; d -= 1) {
      const referenceDate = isoDaysAgo(d);
      for (const submarket of submarkets) {
        points.push({ series: "pld", submarket, referenceDate, value: deterministicValue("pld", submarket, referenceDate) });
        points.push({ series: "reservoir", submarket, referenceDate, value: deterministicValue("reservoir", submarket, referenceDate) });
      }
    }
    return points;
  },
};

/* -------------------------------- repository ------------------------------- */

export type PldRow = { d: string; date: string; seco: number; s: number; ne: number; n: number };

const columnBySubmarket: Record<Submarket, keyof Omit<PldRow, "d" | "date">> = {
  "SE/CO": "seco",
  S: "s",
  NE: "ne",
  N: "n",
};

export const marketRepository = {
  /** Últimos `days` dias publicados pela CCEE (não necessariamente até hoje). */
  async listSeries(series: MarketSeriesKey, days = 180): Promise<MarketPoint[]> {
    const { data, error } = await supabase
      .from("market_series")
      .select("series, submarket, reference_date, value")
      .eq("source", CCEE_SOURCE)
      .eq("series", series)
      .order("reference_date", { ascending: false })
      .limit(days * submarkets.length);
    if (error) throw toAppError(error);
    return (data ?? []).map((row) => ({
      series: row.series as MarketSeriesKey,
      submarket: row.submarket as Submarket,
      referenceDate: row.reference_date,
      value: Number(row.value),
    }));
  },

  /** Processamento: pontos do banco → linhas prontas para os gráficos. */
  async pldRows(days = 180): Promise<PldRow[]> {
    const points = await marketRepository.listSeries("pld", days);
    const byDate = new Map<string, PldRow>();
    for (const p of points) {
      const current =
        byDate.get(p.referenceDate) ??
        ({ d: "", date: p.referenceDate, seco: 0, s: 0, ne: 0, n: 0 } as PldRow);
      current[columnBySubmarket[p.submarket]] = p.value;
      byDate.set(p.referenceDate, current);
    }
    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({ ...row, d: `${row.date.slice(8)}/${row.date.slice(5, 7)}` }));
  },
};

/** PLD médio diário da CCEE, do mais antigo ao mais recente. */
export function usePldRows(days = 180) {
  return useQuery({
    queryKey: ["market", "pld", days],
    queryFn: () => marketRepository.pldRows(days),
    staleTime: 15 * 60 * 1000,
  });
}

/** Última leitura e variação por submercado. */
export function pldSummary(rows: PldRow[]) {
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2] ?? last;
  if (!last) return [];
  return submarkets.map((submarket) => {
    const key = columnBySubmarket[submarket];
    const value = last[key];
    const previous = prev[key] || value || 1;
    const delta = ((value - previous) / previous) * 100;
    return { submarket, value, delta, up: delta >= 0 };
  });
}
