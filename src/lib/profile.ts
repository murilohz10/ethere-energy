/**
 * Experiências por perfil de cliente (Comercializadora × Fazenda de geração).
 *
 * Camada única e reutilizável: textos, métricas, séries e tipos de alerta são
 * derivados do perfil da empresa da sessão. Nenhuma tela duplica regra de
 * negócio — todas consomem estas funções.
 *
 * IMPORTANTE: todos os valores de exposição, margem, geração e receita são
 * ESTIMATIVAS GERENCIAIS calculadas com os dados disponíveis na plataforma.
 * Não representam contabilização ou liquidação oficial da CCEE.
 */

import { useMemo } from "react";
import { useSession, type Contract, type UserProfileKind } from "@/lib/store";

export type CompanyProfile = UserProfileKind;

export const HOURS_PER_MONTH = 730;

export const ESTIMATE_NOTE =
  "Estimativa gerencial com os dados cadastrados na plataforma — não representa liquidação oficial da CCEE.";

export const isFarmProfile = (p?: CompanyProfile | null) => p === "Fazenda de Energia";

/* --------------------------------- textos --------------------------------- */

export type ProfileCopy = {
  /** Rótulo curto do perfil. */
  badge: string;
  /** Contexto no topo da Visão Geral. */
  overviewTitle: string;
  overviewDescription: string;
  /** Pergunta central que o perfil responde. */
  question: string;
  /** Cadeia de decisão do produto. */
  chain: string[];
  insightsDescription: string;
  monitoringDescription: string;
  contractsDescription: string;
  alertsDescription: string;
  reportsDescription: string;
};

export const profileCopy: Record<CompanyProfile, ProfileCopy> = {
  Comercializadora: {
    badge: "Comercializadora",
    overviewTitle: "Inteligência da sua carteira",
    overviewDescription: "Posição comercial, margem projetada e impacto do mercado sobre os contratos.",
    question: "Como está minha posição comercial e qual é o impacto financeiro do mercado?",
    chain: ["Mercado", "Contratos", "Exposição", "Margem", "Decisão"],
    insightsDescription:
      "Leitura do PLD, da posição da carteira e dos contratos, com o impacto financeiro estimado.",
    monitoringDescription: "PLD por submercado, posição contratada e exposição estimada da carteira.",
    contractsDescription: "Carteira de compra e venda, com vencimentos e impacto na posição.",
    alertsDescription: "Regras de preço, exposição, margem e vencimentos da carteira.",
    reportsDescription: "Consolidados de carteira, contratos, exposição, margem e mercado.",
  },
  "Fazenda de Energia": {
    badge: "Fazenda de geração",
    overviewTitle: "Inteligência da sua geração",
    overviewDescription: "Geração prevista e realizada, receita estimada e impacto do mercado.",
    question: "Como está minha geração e qual é o impacto do mercado sobre minha receita?",
    chain: ["Mercado", "Geração", "Receita", "Contratos", "Decisão"],
    insightsDescription:
      "Leitura da geração, do PLD e dos contratos, com o impacto estimado sobre a receita.",
    monitoringDescription: "PLD, geração prevista × realizada e indicadores hidrológicos disponíveis.",
    contractsDescription: "Contratos de venda, energia contratada e receita contratada estimada.",
    alertsDescription: "Regras de geração, receita, preço e vencimentos dos contratos de venda.",
    reportsDescription: "Consolidados de geração, receita, contratos, desempenho operacional e mercado.",
  },
};

export function useCompanyProfile() {
  const { user } = useSession();
  const kind: CompanyProfile = user?.profile ?? "Comercializadora";
  return useMemo(
    () => ({ kind, isFarm: isFarmProfile(kind), copy: profileCopy[kind] }),
    [kind],
  );
}

/* ------------------------------ mercado (PLD) ----------------------------- */

const daySeed = () => Math.floor(Date.now() / 86_400_000);
const wave = (n: number) => Math.abs(Math.sin(n * 1.37));

export type PldSnapshot = { value: number; delta: number };

/** PLD determinístico por dia e submercado (dados simulados de mercado). */
export function pldSnapshot(submarket = "SE/CO", nonce = 0): PldSnapshot {
  const base = { "SE/CO": 214, S: 203, NE: 189, N: 176 }[submarket] ?? 214;
  const s = daySeed() + nonce + submarket.length;
  const value = +(base + wave(s) * 28 - 8).toFixed(2);
  const prev = +(base + wave(s - 1) * 28 - 8).toFixed(2);
  return { value, delta: +(((value - prev) / prev) * 100).toFixed(1) };
}

/* ------------------------- métricas por perfil ---------------------------- */

const daysTo = (iso: string) =>
  iso ? Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86_400_000) : Infinity;

const openContracts = (contracts: Contract[]) => contracts.filter((c) => c.status !== "Encerrado");

export function expiringContracts(contracts: Contract[], withinDays = 90): Contract[] {
  return openContracts(contracts)
    .filter((c) => daysTo(c.endDate) >= 0 && daysTo(c.endDate) <= withinDays)
    .sort((a, b) => daysTo(a.endDate) - daysTo(b.endDate));
}

export type TraderMetrics = {
  saleMwm: number;
  purchaseMwm: number;
  contractedMwm: number;
  /** Diferença estimada entre venda e compra contratadas (MW médios). */
  netPositionMwm: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  avgSalePrice: number;
  pld: PldSnapshot;
  /** Impacto financeiro estimado do PLD sobre a posição em aberto (mês). */
  pldImpact: number;
  expiring30: Contract[];
  expiring90: Contract[];
};

export function traderMetrics(contracts: Contract[], nonce = 0): TraderMetrics {
  const active = contracts.filter((c) => c.status === "Ativo");
  const sale = active.filter((c) => c.type === "Venda");
  const purchase = active.filter((c) => c.type === "Compra");
  const saleMwm = sale.reduce((s, c) => s + c.volume, 0);
  const purchaseMwm = purchase.reduce((s, c) => s + c.volume, 0);
  const revenue = sale.reduce((s, c) => s + c.volume * c.price * HOURS_PER_MONTH, 0);
  const cost = purchase.reduce((s, c) => s + c.volume * c.price * HOURS_PER_MONTH, 0);
  const margin = revenue - cost;
  const netPositionMwm = +(saleMwm - purchaseMwm).toFixed(2);
  const pld = pldSnapshot("SE/CO", nonce);

  return {
    saleMwm,
    purchaseMwm,
    contractedMwm: +(saleMwm + purchaseMwm).toFixed(2),
    netPositionMwm,
    revenue,
    cost,
    margin,
    marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
    avgSalePrice: saleMwm > 0 ? sale.reduce((s, c) => s + c.price * c.volume, 0) / saleMwm : 0,
    pld,
    pldImpact: netPositionMwm * HOURS_PER_MONTH * pld.value,
    expiring30: expiringContracts(contracts, 30),
    expiring90: expiringContracts(contracts, 90),
  };
}

export type FarmMetrics = {
  /** Capacidade de referência estimada a partir da energia contratada (MWm). */
  capacityMwm: number;
  forecastMwh: number;
  realizedMwh: number;
  deviationPercent: number;
  contractedMwm: number;
  contractedMwh: number;
  contractedRevenue: number;
  /** Energia gerada além da contratada, valorada ao PLD (estimativa). */
  surplusMwh: number;
  projectedRevenue: number;
  avgContractPrice: number;
  pld: PldSnapshot;
  expiring30: Contract[];
  expiring90: Contract[];
};

export function farmMetrics(contracts: Contract[], nonce = 0): FarmMetrics {
  const active = contracts.filter((c) => c.status === "Ativo" && c.type === "Venda");
  const contractedMwm = active.reduce((s, c) => s + c.volume, 0);
  const contractedMwh = contractedMwm * HOURS_PER_MONTH;
  const avgContractPrice =
    contractedMwm > 0 ? active.reduce((s, c) => s + c.price * c.volume, 0) / contractedMwm : 0;

  const capacityMwm = +Math.max(contractedMwm * 1.2, 5).toFixed(2);
  const s = daySeed() + nonce;
  const forecastMwh = Math.round(capacityMwm * HOURS_PER_MONTH * (0.82 + wave(s) * 0.14));
  const realizedMwh = Math.round(forecastMwh * (0.9 + wave(s + 0.6) * 0.16));
  const surplusMwh = Math.max(0, realizedMwh - contractedMwh);
  const pld = pldSnapshot("SE/CO", nonce);
  const contractedRevenue = Math.min(realizedMwh, contractedMwh) * avgContractPrice;

  return {
    capacityMwm,
    forecastMwh,
    realizedMwh,
    deviationPercent: forecastMwh ? ((realizedMwh - forecastMwh) / forecastMwh) * 100 : 0,
    contractedMwm,
    contractedMwh,
    contractedRevenue,
    surplusMwh,
    projectedRevenue: contractedRevenue + surplusMwh * pld.value,
    avgContractPrice,
    pld,
    expiring30: expiringContracts(contracts, 30),
    expiring90: expiringContracts(contracts, 90),
  };
}

/* --------------------------------- séries --------------------------------- */

/** Geração prevista × realizada (MWh/dia) — perfil Fazenda. */
export function generationSeries(capacityMwm: number, days = 30, nonce = 0) {
  const daily = Math.max(1, capacityMwm) * 24;
  return Array.from({ length: days }).map((_, i) => {
    const prevista = +(daily * (0.78 + Math.sin((i + nonce) / 4) * 0.12 + 0.06)).toFixed(1);
    const realizada = +(prevista * (0.9 + wave(i + nonce + 0.4) * 0.18)).toFixed(1);
    return { d: `${i + 1}`, prevista, realizada };
  });
}

/** Evolução do PLD (R$/MWh) — comum aos dois perfis. */
export function pldSeries(days = 30, nonce = 0, submarket = "SE/CO") {
  const base = pldSnapshot(submarket, nonce).value;
  return Array.from({ length: days }).map((_, i) => ({
    d: `${i + 1}`,
    pld: +(base * (0.88 + Math.sin((i + nonce) / 4) * 0.07 + i * 0.002)).toFixed(2),
  }));
}

/** Posição contratada por submercado (MWm) — perfil Comercializadora. */
export function positionBySubmarket(contracts: Contract[]) {
  const rows: Record<string, { m: string; venda: number; compra: number }> = {};
  for (const c of contracts.filter((x) => x.status === "Ativo")) {
    rows[c.submarket] ??= { m: c.submarket, venda: 0, compra: 0 };
    if (c.type === "Venda") rows[c.submarket].venda += c.volume;
    else rows[c.submarket].compra += c.volume;
  }
  return ["SE/CO", "S", "NE", "N"]
    .map((m) => rows[m] ?? { m, venda: 0, compra: 0 })
    .map((r) => ({ ...r, venda: +r.venda.toFixed(1), compra: +r.compra.toFixed(1) }));
}

/** Energia contratada por contrato (MWm) — perfil Fazenda. */
export function contractedByContract(contracts: Contract[]) {
  return contracts
    .filter((c) => c.status === "Ativo" && c.type === "Venda")
    .slice(0, 6)
    .map((c) => ({ m: c.code, v: +c.volume.toFixed(1), receita: +(c.volume * c.price * HOURS_PER_MONTH).toFixed(0) }));
}

/** Evolução mensal da métrica financeira central do perfil. */
export function financialSeries(base: number, months = 12, nonce = 0) {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return Array.from({ length: months }).map((_, i) => ({
    d: labels[i % 12],
    v: +(base * (0.86 + wave(i + nonce) * 0.22)).toFixed(0),
  }));
}

/** Vencimentos agrupados por faixa — comum aos dois perfis. */
export function expirationBuckets(contracts: Contract[]) {
  const open = openContracts(contracts);
  const count = (min: number, max: number) =>
    open.filter((c) => daysTo(c.endDate) >= min && daysTo(c.endDate) <= max).length;
  return [
    { m: "≤ 30d", v: count(0, 30) },
    { m: "31–90d", v: count(31, 90) },
    { m: "91–180d", v: count(91, 180) },
    { m: "> 180d", v: open.filter((c) => daysTo(c.endDate) > 180).length },
  ];
}

/* -------------------------- alertas e relatórios -------------------------- */

export const alertTypesByProfile: Record<CompanyProfile, string[]> = {
  Comercializadora: ["PLD", "Exposição", "Margem", "Contrato", "Mercado", "Regulação"],
  "Fazenda de Energia": ["PLD", "Geração", "Receita", "Contrato", "Clima", "Regulação"],
};

export const alertTypeHints: Record<string, string> = {
  PLD: "Dispara quando o preço do submercado cruza o limite (R$/MWh).",
  Exposição: "Dispara quando a diferença estimada entre venda e compra excede o limite (MWm).",
  Margem: "Dispara quando a margem projetada varia além do limite (%).",
  Geração: "Dispara quando a geração realizada se desvia da prevista além do limite (%).",
  Receita: "Dispara quando a receita projetada varia além do limite (%).",
  Contrato: "Dispara quando um contrato está a X dias do vencimento.",
  Clima: "Dispara com mudanças relevantes nas condições climáticas/hidrológicas.",
  Mercado: "Dispara com movimentações relevantes de mercado.",
  Regulação: "Dispara com novas publicações regulatórias.",
};

export const reportSuggestionsByProfile: Record<CompanyProfile, { title: string; summary: string }[]> = {
  Comercializadora: [
    { title: "Carteira e posição contratada", summary: "Posição de compra e venda, exposição estimada e preço médio da carteira." },
    { title: "Margem projetada do período", summary: "Receita, custo e margem projetada por contrato, com impacto do PLD." },
    { title: "Contratos e vencimentos", summary: "Contratos ativos, pendentes e vencimentos dos próximos 90 dias." },
    { title: "PLD e mercado", summary: "Evolução do PLD por submercado e leitura das movimentações do período." },
  ],
  "Fazenda de Energia": [
    { title: "Geração prevista × realizada", summary: "Desvio de geração no período e desempenho operacional por dia." },
    { title: "Receita estimada do período", summary: "Receita contratada e excedente valorado ao PLD, como estimativa gerencial." },
    { title: "Contratos de venda", summary: "Energia contratada, preço médio e vencimentos dos contratos de venda." },
    { title: "PLD e mercado", summary: "Evolução do PLD e impacto potencial sobre a receita da geração." },
  ],
};
