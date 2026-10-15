/**
 * Interpretação calculada dos dados exibidos (PLD, carteira, cenários).
 * Funções puras: recebem os dados que a tela já tem e devolvem números +
 * frases curtas. Nunca inventam dados — retornam `insufficient` quando a
 * série não sustenta a comparação.
 */
import type { Contract } from "@/lib/store";

export const HOURS_PER_MONTH = 730;

export type PldKey = "seco" | "s" | "ne" | "n";
export type PldPoint = { d: string; seco: number; s: number; ne: number; n: number };
export const PLD_LABEL: Record<PldKey, string> = { seco: "SE/CO", s: "S", ne: "NE", n: "N" };
const KEYS: PldKey[] = ["seco", "s", "ne", "n"];

/** Abaixo deste percentual a variação é tratada como estabilidade. */
export const STABLE_PCT = 1;
/** Critério de tendência: |variação| ≥ 3% e ≥ 70% dos dias do mesmo lado da média anterior. */
export const TREND_PCT = 3;
export const TREND_SHARE = 0.7;

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = avg(xs);
  return Math.sqrt(avg(xs.map((x) => (x - m) ** 2)));
};
const fmt = (v: number, d = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
export const brlMwh = (v: number) => `R$ ${fmt(v)}/MWh`;
export const pct = (v: number) => `${v >= 0 ? "+" : ""}${fmt(v, 1)}%`;

export type Movement = "alta" | "queda" | "estavel";
export type Pattern = "tendencia" | "pontual" | "estavel" | "indefinido";

export type PldInterpretation =
  | { ok: false; reason: string }
  | {
      ok: true;
      window: number;
      key: PldKey;
      period: { from: string; to: string; prevFrom: string; prevTo: string };
      current: { avg: number; min: number; max: number; minDay: string; maxDay: string; last: number };
      previous: { avg: number };
      deltaAbs: number;
      deltaPct: number;
      movement: Movement;
      pattern: Pattern;
      volatility: { current: number; previous: number } | null;
      /** Dia com a maior variação diária dentro da janela. */
      biggestMove: { day: string; deltaAbs: number } | null;
      biggestRise: { day: string; deltaAbs: number } | null;
      biggestFall: { day: string; deltaAbs: number } | null;
      submarkets: { key: PldKey; label: string; avg: number; deltaPct: number }[];
      spread: { high: PldKey; low: PldKey; diff: number };
      reference30: { avg: number; diffPct: number } | null;
      summary: string;
      observations: { title: string; text: string; metric: string }[];
    };

/**
 * Compara a janela atual (últimos `window` pontos) com a janela anterior
 * de mesmo tamanho. Dados diários: não há leitura horária disponível.
 */
export function interpretPld(rows: PldPoint[], window: number, key: PldKey = "seco"): PldInterpretation {
  if (window < 1) return { ok: false, reason: "Janela inválida." };
  if (rows.length < window * 2) {
    return {
      ok: false,
      reason: `São necessários ${window * 2} dias de dados para comparar com o período anterior; há ${rows.length}.`,
    };
  }
  const cur = rows.slice(-window);
  const prev = rows.slice(-window * 2, -window);
  const cv = cur.map((r) => r[key]);
  const pv = prev.map((r) => r[key]);

  const cAvg = avg(cv);
  const pAvg = avg(pv);
  const deltaAbs = cAvg - pAvg;
  const deltaPct = pAvg ? (deltaAbs / pAvg) * 100 : 0;
  const movement: Movement = Math.abs(deltaPct) < STABLE_PCT ? "estavel" : deltaPct > 0 ? "alta" : "queda";

  let pattern: Pattern = "indefinido";
  if (movement === "estavel") pattern = "estavel";
  else if (window >= 7) {
    const sameSide = cv.filter((v) => (deltaPct > 0 ? v > pAvg : v < pAvg)).length / cv.length;
    pattern = Math.abs(deltaPct) >= TREND_PCT && sameSide >= TREND_SHARE ? "tendencia" : "pontual";
  }

  const minV = Math.min(...cv);
  const maxV = Math.max(...cv);
  const minDay = cur[cv.indexOf(minV)].d;
  const maxDay = cur[cv.indexOf(maxV)].d;

  const diffs = (xs: number[]) => xs.slice(1).map((v, i) => v - xs[i]);
  const volatility = window >= 7 ? { current: std(diffs(cv)), previous: std(diffs(pv)) } : null;

  let biggestMove: { day: string; deltaAbs: number } | null = null;
  let biggestRise: { day: string; deltaAbs: number } | null = null;
  let biggestFall: { day: string; deltaAbs: number } | null = null;
  if (window >= 7) {
    const withPrev = [pv[pv.length - 1], ...cv];
    const d = diffs(withPrev);
    let idx = 0, up = 0, dn = 0;
    d.forEach((x, i) => {
      if (Math.abs(x) > Math.abs(d[idx])) idx = i;
      if (x > d[up]) up = i;
      if (x < d[dn]) dn = i;
    });
    biggestMove = { day: cur[idx].d, deltaAbs: d[idx] };
    if (d[up] > 0) biggestRise = { day: cur[up].d, deltaAbs: d[up] };
    if (d[dn] < 0) biggestFall = { day: cur[dn].d, deltaAbs: d[dn] };
  }

  const submarkets = KEYS.map((k) => {
    const a = avg(cur.map((r) => r[k]));
    const b = avg(prev.map((r) => r[k]));
    return { key: k, label: PLD_LABEL[k], avg: a, deltaPct: b ? ((a - b) / b) * 100 : 0 };
  });
  const sorted = [...submarkets].sort((a, b) => b.avg - a.avg);
  const spread = { high: sorted[0].key, low: sorted[sorted.length - 1].key, diff: sorted[0].avg - sorted[sorted.length - 1].avg };

  let reference30: { avg: number; diffPct: number } | null = null;
  if (window < 30 && rows.length >= 30) {
    const r = avg(rows.slice(-30).map((x) => x[key]));
    reference30 = { avg: r, diffPct: r ? ((cAvg - r) / r) * 100 : 0 };
  }

  const label = PLD_LABEL[key];
  const unit = window === 1 ? "ao dia anterior" : window === 7 ? "à semana anterior" : `ao período anterior de ${window} dias`;
  const moveWord = movement === "estavel" ? "ficou estável" : movement === "alta" ? "subiu" : "caiu";
  const parts: string[] = [];
  parts.push(
    movement === "estavel"
      ? `O PLD ${label} ficou estável em relação ${unit} (${pct(deltaPct)}), com média de ${brlMwh(cAvg)}.`
      : `O PLD ${label} ${moveWord} ${fmt(Math.abs(deltaPct), 1)}% em relação ${unit}, de ${brlMwh(pAvg)} para ${brlMwh(cAvg)}.`,
  );
  if (pattern === "tendencia") parts.push(`O movimento foi persistente: a maior parte dos dias ficou ${deltaPct > 0 ? "acima" : "abaixo"} da média anterior.`);
  if (pattern === "pontual") parts.push("O movimento não se manteve na maior parte dos dias, o que indica variação pontual, não tendência.");
  if (biggestMove && Math.abs(biggestMove.deltaAbs) >= 0.5 && window >= 7) {
    parts.push(`O dia de maior variação foi ${biggestMove.day}, com ${biggestMove.deltaAbs > 0 ? "alta" : "queda"} de ${brlMwh(Math.abs(biggestMove.deltaAbs))}.`);
  }
  if (spread.diff >= 1) parts.push(`${PLD_LABEL[spread.high]} teve a maior média e ${PLD_LABEL[spread.low]} a menor, diferença de ${brlMwh(spread.diff)}.`);
  if (reference30 && Math.abs(reference30.diffPct) >= STABLE_PCT) {
    parts.push(`Frente à média dos últimos 30 dias, o preço está ${fmt(Math.abs(reference30.diffPct), 1)}% ${reference30.diffPct > 0 ? "acima" : "abaixo"}.`);
  }

  const observations: { title: string; text: string; metric: string }[] = [];
  if (window > 1) {
    observations.push({
      title: "Faixa do período",
      text: `Mínimo em ${minDay} e máximo em ${maxDay}. Amplitude de ${brlMwh(maxV - minV)}.`,
      metric: `${brlMwh(minV)} – ${brlMwh(maxV)}`,
    });
  }
  if (biggestRise || biggestFall) {
    observations.push({
      title: "Maior alta e maior queda diárias",
      text: [
        biggestRise ? `Maior alta em ${biggestRise.day} (+${brlMwh(biggestRise.deltaAbs)}).` : "Nenhum dia de alta.",
        biggestFall ? `Maior queda em ${biggestFall.day} (−${brlMwh(Math.abs(biggestFall.deltaAbs))}).` : "Nenhum dia de queda.",
      ].join(" "),
      metric: `${biggestRise ? "+" + fmt(biggestRise.deltaAbs) : "0"} / ${biggestFall ? "−" + fmt(Math.abs(biggestFall.deltaAbs)) : "0"} R$/MWh`,
    });
  }
  if (volatility && volatility.previous > 0) {
    const ratio = (volatility.current / volatility.previous - 1) * 100;
    observations.push({
      title: "Volatilidade",
      text: Math.abs(ratio) < 10
        ? "A oscilação diária ficou parecida com a do período anterior."
        : `A oscilação diária ficou ${ratio > 0 ? "maior" : "menor"} que no período anterior (${pct(ratio)}).`,
      metric: `desvio ${brlMwh(volatility.current)}`,
    });
  }
  if (window === 1) {
    const ups = submarkets.filter((s) => s.deltaPct >= STABLE_PCT).length;
    const downs = submarkets.filter((s) => s.deltaPct <= -STABLE_PCT).length;
    observations.push({
      title: "Submercados",
      text: ups === 4 ? "Todos os submercados subiram." : downs === 4 ? "Todos os submercados caíram." : `${ups} subiram, ${downs} caíram e ${4 - ups - downs} ficaram estáveis.`,
      metric: `spread ${brlMwh(spread.diff)}`,
    });
  }

  return {
    ok: true,
    window,
    key,
    period: { from: cur[0].d, to: cur[cur.length - 1].d, prevFrom: prev[0].d, prevTo: prev[prev.length - 1].d },
    current: { avg: cAvg, min: minV, max: maxV, minDay, maxDay, last: cv[cv.length - 1] },
    previous: { avg: pAvg },
    deltaAbs,
    deltaPct,
    movement,
    pattern,
    volatility,
    biggestMove,
    biggestRise,
    biggestFall,
    submarkets,
    spread,
    reference30,
    summary: parts.join(" "),
    observations: observations.slice(0, 4),
  };
}

/* ------------------------------ carteira -------------------------------- */

const dayMs = 86_400_000;
const daysTo = (iso: string, today: Date) => Math.ceil((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / dayMs);

export function missingFields(c: Contract): string[] {
  const m: string[] = [];
  if (!c.company?.trim()) m.push("contraparte");
  if (!c.price || c.price <= 0) m.push("preço");
  if (!c.volume || c.volume <= 0) m.push("volume");
  if (!c.endDate) m.push("data de término");
  return m;
}

export function portfolioAnalysis(contracts: Contract[], today = new Date()) {
  const active = contracts.filter((c) => c.status === "Ativo");
  const buckets = [
    { label: "≤ 30 dias", max: 30, count: 0 },
    { label: "31–90 dias", max: 90, count: 0 },
    { label: "91–365 dias", max: 365, count: 0 },
    { label: "> 1 ano", max: Infinity, count: 0 },
  ];
  for (const c of active) {
    const d = daysTo(c.endDate, today);
    if (d < 0) continue;
    const b = buckets.find((x) => d <= x.max);
    if (b) b.count++;
  }
  const byType = (t: Contract["type"]) => active.filter((c) => c.type === t);
  const weighted = (cs: Contract[]) => {
    const vol = cs.reduce((s, c) => s + c.volume, 0);
    return vol > 0 ? cs.reduce((s, c) => s + c.price * c.volume, 0) / vol : null;
  };
  const prices = active.map((c) => c.price).filter((p) => p > 0);
  const byCompany = new Map<string, number>();
  for (const c of active) byCompany.set(c.company || "Sem nome", (byCompany.get(c.company || "Sem nome") ?? 0) + c.volume);
  const totalVol = active.reduce((s, c) => s + c.volume, 0);
  const top = [...byCompany.entries()].sort((a, b) => b[1] - a[1])[0];
  const incomplete = active.filter((c) => missingFields(c).length > 0);

  return {
    active: active.length,
    buckets,
    sale: { count: byType("Venda").length, mwm: byType("Venda").reduce((s, c) => s + c.volume, 0), avgPrice: weighted(byType("Venda")) },
    purchase: { count: byType("Compra").length, mwm: byType("Compra").reduce((s, c) => s + c.volume, 0), avgPrice: weighted(byType("Compra")) },
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    concentration: top && totalVol > 0 ? { name: top[0], share: (top[1] / totalVol) * 100 } : null,
    incomplete,
  };
}

/**
 * Preço contratado × PLD médio do mesmo submercado. É só referência de
 * curto prazo: contrato bilateral e PLD não são o mesmo produto.
 */
export function contractVsMarket(c: Contract, pldAvgBySubmarket: Partial<Record<string, number>>) {
  const ref = pldAvgBySubmarket[c.submarket];
  if (ref == null || ref <= 0) return { ok: false as const, reason: "Sem PLD do submercado no período." };
  if (!c.price || c.price <= 0) return { ok: false as const, reason: "Contrato sem preço cadastrado." };
  const diff = c.price - ref;
  return { ok: true as const, price: c.price, ref, diff, diffPct: (diff / ref) * 100 };
}

/* ------------------------------ cenários -------------------------------- */

/**
 * Diferença mensal estimada entre o preço contratado e o PLD do cenário,
 * por contrato ativo. Venda: (preço − PLD) × volume × 730. Compra: (PLD − preço).
 * Positivo = contrato mais favorável que o mercado no cenário. Não é resultado realizado.
 */
export function scenarioVsMarket(contracts: Contract[], pldBase: number, shiftPct: number) {
  const pld = pldBase * (1 + shiftPct / 100);
  const rows = contracts
    .filter((c) => c.status === "Ativo" && c.volume > 0 && c.price > 0)
    .map((c) => {
      const perMwh = c.type === "Venda" ? c.price - pld : pld - c.price;
      return { id: c.id, code: c.code, name: c.name, type: c.type, value: perMwh * c.volume * HOURS_PER_MONTH };
    });
  const total = rows.reduce((s, r) => s + r.value, 0);
  return { pld, total, rows: [...rows].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)) };
}

/* ------------------------- contrato individual -------------------------- */

const SIMILAR_PCT = 5;

/** Grupos comparáveis da carteira: mesmo tipo e mesmo submercado, contratos ativos com preço. */
export function comparableGroups(contracts: Contract[]) {
  const map = new Map<string, Contract[]>();
  for (const c of contracts) {
    if (c.status !== "Ativo" || c.price <= 0 || c.volume <= 0) continue;
    const k = `${c.type} · ${c.submarket}`;
    map.set(k, [...(map.get(k) ?? []), c]);
  }
  return [...map.entries()].map(([key, cs]) => {
    const vol = cs.reduce((s, c) => s + c.volume, 0);
    const avgP = cs.reduce((s, c) => s + c.price * c.volume, 0) / vol;
    const prices = cs.map((c) => c.price);
    return {
      key, count: cs.length, mwm: vol, avgPrice: avgP,
      min: Math.min(...prices), max: Math.max(...prices),
      similar: cs.filter((c) => Math.abs((c.price - avgP) / avgP) * 100 <= SIMILAR_PCT).length,
    };
  }).sort((a, b) => b.mwm - a.mwm);
}

export function contractAnalysis(c: Contract, contracts: Contract[], today = new Date()) {
  const start = new Date(`${c.startDate}T00:00:00`);
  const end = new Date(`${c.endDate}T00:00:00`);
  const termMonths = Math.max(0, Math.round((end.getTime() - start.getTime()) / (dayMs * 30.44)));
  const remainingDays = daysTo(c.endDate, today);
  const active = contracts.filter((x) => x.status === "Ativo");
  const totalVol = active.reduce((s, x) => s + x.volume, 0);
  const peers = active.filter((x) => x.id !== c.id && x.type === c.type && x.submarket === c.submarket && x.price > 0 && x.volume > 0);
  const peerVol = peers.reduce((s, x) => s + x.volume, 0);
  const peerAvg = peerVol > 0 ? peers.reduce((s, x) => s + x.price * x.volume, 0) / peerVol : null;
  const missing = missingFields(c);
  const lines: string[] = [];
  lines.push(`${c.type} de ${fmt(c.volume, 2)} MWm a ${brlMwh(c.price)} no submercado ${c.submarket}, equivalente a cerca de ${Math.round(c.volume * HOURS_PER_MONTH).toLocaleString("pt-BR")} MWh/mês.`);
  lines.push(remainingDays < 0
    ? `Prazo de ${termMonths} meses, encerrado há ${Math.abs(remainingDays)} dias.`
    : `Prazo de ${termMonths} meses; faltam ${remainingDays} dias para o término.`);
  if (c.status === "Ativo" && totalVol > 0) lines.push(`Representa ${fmt((c.volume / totalVol) * 100, 1)}% do volume ativo da carteira.`);
  if (peerAvg != null) {
    const d = ((c.price - peerAvg) / peerAvg) * 100;
    lines.push(Math.abs(d) <= SIMILAR_PCT
      ? `Preço semelhante aos ${peers.length} outro(s) contrato(s) de ${c.type.toLowerCase()} em ${c.submarket} (média ${brlMwh(peerAvg)}, diferença ${pct(d)}).`
      : `Preço ${fmt(Math.abs(d), 1)}% ${d > 0 ? "acima" : "abaixo"} da média dos ${peers.length} outro(s) contrato(s) de ${c.type.toLowerCase()} em ${c.submarket} (${brlMwh(peerAvg)}). Diferenças de prazo e condições podem explicar parte disso.`);
  } else {
    lines.push(`Não há outro contrato ativo de ${c.type.toLowerCase()} em ${c.submarket} para comparar o preço.`);
  }
  return { termMonths, remainingDays, peers: peers.length, peerAvg, missing, lines, conditions: c.notes?.trim() || null };
}

/** Série demonstrativa de PLD (mesma usada no Monitoramento quando não há leitura da CCEE). */
export function demoPldRows(days: number, seed = 0): PldPoint[] {
  return Array.from({ length: days }).map((_, i) => ({
    d: `D${i + 1}`,
    seco: +(150 + Math.sin((i + seed) / 4) * 40 + i * 1.1).toFixed(2),
    s: +(140 + Math.cos((i + seed) / 3) * 30 + i * 0.9).toFixed(2),
    ne: +(130 + Math.sin((i + seed) / 5) * 25 + i * 0.8).toFixed(2),
    n: +(120 + Math.cos((i + seed) / 6) * 20 + i * 0.7).toFixed(2),
  }));
}

/* ------------------- indicadores operativos hídricos ------------------- */

/** Ponto de uma série operativa: data ISO, grupo (subsistema/reservatório) e valor. */
export type IndicatorPoint = { date: string; group: string; value: number };

export type IndicatorSpec = {
  label: string;
  unit: string;
  /** Unidade percentual: variação é expressa em pontos percentuais, não em %. */
  isPercent?: boolean;
  decimals?: number;
};

const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export type IndicatorInterpretation =
  | { ok: false; reason: string }
  | {
      ok: true;
      group: string;
      period: { from: string; to: string; prevFrom: string; prevTo: string };
      current: { avg: number; last: number; min: number; max: number; minDay: string; maxDay: string };
      previous: { avg: number };
      deltaAbs: number;
      /** null quando a unidade é percentual (variação em p.p.). */
      deltaPct: number | null;
      movement: Movement;
      pattern: Pattern;
      ranking: { group: string; deltaAbs: number; last: number }[];
      summary: string;
      missing: string[];
    };

/** Agrega os pontos por data para o grupo escolhido ("Todos" soma ou faz média conforme a unidade). */
export function seriesForGroup(points: IndicatorPoint[], group: string, spec: IndicatorSpec) {
  const map = new Map<string, number[]>();
  for (const p of points) {
    if (group !== "Todos" && p.group !== group) continue;
    map.set(p.date, [...(map.get(p.date) ?? []), p.value]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vs]) => ({ date, value: spec.isPercent ? avg(vs) : vs.reduce((a, b) => a + b, 0) }));
}

export function interpretIndicator(
  points: IndicatorPoint[],
  window: number,
  group: string,
  spec: IndicatorSpec,
): IndicatorInterpretation {
  const d = spec.decimals ?? 1;
  if (!points.length) return { ok: false, reason: "Nenhum dado carregado na plataforma para este indicador." };
  const s = seriesForGroup(points, group, spec);
  if (s.length < window * 2) {
    return { ok: false, reason: `São necessários ${window * 2} dias com dados para comparar com o período anterior; há ${s.length}.` };
  }
  const cur = s.slice(-window);
  const prev = s.slice(-window * 2, -window);
  const cv = cur.map((p) => p.value);
  const cAvg = avg(cv);
  const pAvg = avg(prev.map((p) => p.value));
  const deltaAbs = cAvg - pAvg;
  const deltaPct = spec.isPercent || !pAvg ? null : (deltaAbs / pAvg) * 100;
  const rel = spec.isPercent ? deltaAbs : deltaPct ?? 0;
  const threshold = spec.isPercent ? 0.5 : STABLE_PCT;
  const movement: Movement = Math.abs(rel) < threshold ? "estavel" : rel > 0 ? "alta" : "queda";
  let pattern: Pattern = "indefinido";
  if (movement === "estavel") pattern = "estavel";
  else if (window >= 7) {
    const share = cv.filter((v) => (deltaAbs > 0 ? v > pAvg : v < pAvg)).length / cv.length;
    pattern = share >= TREND_SHARE ? "tendencia" : "pontual";
  }
  const minV = Math.min(...cv);
  const maxV = Math.max(...cv);

  const groups = [...new Set(points.map((p) => p.group))];
  const ranking = groups
    .map((g) => {
      const gs = seriesForGroup(points, g, spec);
      if (gs.length < window * 2) return null;
      const a = avg(gs.slice(-window).map((p) => p.value));
      const b = avg(gs.slice(-window * 2, -window).map((p) => p.value));
      return { group: g, deltaAbs: a - b, last: gs[gs.length - 1].value };
    })
    .filter((x): x is { group: string; deltaAbs: number; last: number } => x !== null)
    .sort((a, b) => Math.abs(b.deltaAbs) - Math.abs(a.deltaAbs));

  const u = (v: number) => `${fmt(v, d)} ${spec.unit}`;
  const change = spec.isPercent ? `${deltaAbs >= 0 ? "+" : ""}${fmt(deltaAbs, d)} p.p.` : pct(deltaPct ?? 0);
  const parts = [
    movement === "estavel"
      ? `${spec.label} ficou estável frente aos ${window} dias anteriores (${change}), média de ${u(cAvg)}.`
      : `${spec.label} ${movement === "alta" ? "subiu" : "caiu"} ${change} frente aos ${window} dias anteriores, de ${u(pAvg)} para ${u(cAvg)} em média.`,
  ];
  if (pattern === "tendencia") parts.push("A mudança se manteve na maior parte dos dias.");
  if (pattern === "pontual") parts.push("A mudança não se manteve na maior parte dos dias; parece pontual.");
  if (group === "Todos" && ranking.length > 1) {
    parts.push(`Maior variação em ${ranking[0].group} (${ranking[0].deltaAbs >= 0 ? "+" : ""}${fmt(ranking[0].deltaAbs, d)} ${spec.isPercent ? "p.p." : spec.unit}).`);
  }
  const missing: string[] = [];
  if (window < 30 && s.length < 60) missing.push("histórico mais longo para avaliar sazonalidade");

  return {
    ok: true,
    group,
    period: { from: ddmm(cur[0].date), to: ddmm(cur[cur.length - 1].date), prevFrom: ddmm(prev[0].date), prevTo: ddmm(prev[prev.length - 1].date) },
    current: { avg: cAvg, last: cv[cv.length - 1], min: minV, max: maxV, minDay: ddmm(cur[cv.indexOf(minV)].date), maxDay: ddmm(cur[cv.indexOf(maxV)].date) },
    previous: { avg: pAvg },
    deltaAbs,
    deltaPct,
    movement,
    pattern,
    ranking,
    summary: parts.join(" "),
    missing,
  };
}

/** Frase de co-movimento observado — nunca atribui causa. */
export function coMovement(aLabel: string, a: Movement, bLabel: string, b: Movement): string {
  const w = (m: Movement) => (m === "alta" ? "subiu" : m === "queda" ? "caiu" : "ficou estável");
  const same = a === b;
  return `No mesmo período, ${aLabel} ${w(a)} e ${bLabel} ${w(b)}. ${
    same ? "Movimentos no mesmo sentido" : "Movimentos em sentidos diferentes"
  } são uma observação; os dados não demonstram relação de causa.`;
}

/** Realizado × programado só nas datas presentes nas duas séries. */
export function realizedVsScheduled(realized: { date: string; value: number }[], scheduled: { date: string; value: number }[]) {
  const sMap = new Map(scheduled.map((p) => [p.date, p.value]));
  const pairs = realized.filter((p) => sMap.has(p.date)).map((p) => ({ date: p.date, realized: p.value, scheduled: sMap.get(p.date)! }));
  if (!pairs.length) return null;
  const r = pairs.reduce((s, p) => s + p.realized, 0);
  const sc = pairs.reduce((s, p) => s + p.scheduled, 0);
  return { days: pairs.length, realized: r, scheduled: sc, diff: r - sc, diffPct: sc ? ((r - sc) / sc) * 100 : null, pairs };
}
