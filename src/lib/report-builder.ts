/**
 * Relatório configurável: o conteúdo segue exatamente as escolhas do usuário.
 * Só metadados essenciais (período, unidades, origem) entram sem seleção.
 */
import type { Contract, Report } from "./store";
import { brl } from "./store";
import { interpretPld, portfolioAnalysis, brlMwh, pct, PLD_LABEL, type PldKey, type PldPoint } from "./interpretation";
import { farmMetrics, traderMetrics, ESTIMATE_NOTE, type CompanyProfile } from "./profile";

export type ReportLevel = "executivo" | "analitico" | "detalhado";
export type ReportIndicator = "pld" | "carteira" | "vencimentos" | "precos" | "resultado" | "geracao";
export type ReportVisual = "graficoPld" | "tabelaPld" | "tabelaContratos";
export type ReportFormat = "pdf" | "csv";

export type ReportConfig = {
  purpose: string;
  indicators: ReportIndicator[];
  visuals: ReportVisual[];
  compare: boolean;
  submarkets: PldKey[];
  level: ReportLevel;
  interpretation: boolean;
  format: ReportFormat;
};

export const reportPurposes = ["Acompanhamento de mercado", "Revisão da carteira", "Prestação de contas à diretoria", "Geração e receita"];

export const indicatorLabels: Record<ReportIndicator, string> = {
  pld: "PLD por submercado",
  carteira: "Volumes da carteira",
  vencimentos: "Vencimentos",
  precos: "Preços contratados",
  resultado: "Margem / receita estimada",
  geracao: "Geração prevista × realizada",
};
export const visualLabels: Record<ReportVisual, string> = {
  graficoPld: "Gráfico do PLD no período",
  tabelaPld: "Tabela de médias do PLD",
  tabelaContratos: "Tabela de contratos",
};
export const levelLabels: Record<ReportLevel, { label: string; desc: string }> = {
  executivo: { label: "Executivo", desc: "Resumo e principais conclusões." },
  analitico: { label: "Analítico", desc: "Comparações, variações e interpretação dos movimentos." },
  detalhado: { label: "Detalhado", desc: "Métricas completas, dados selecionados, metodologia e limitações." },
};

export const defaultReportConfig = (isFarm: boolean): ReportConfig => ({
  purpose: isFarm ? "Geração e receita" : "Revisão da carteira",
  indicators: isFarm ? ["pld", "geracao", "resultado", "vencimentos"] : ["pld", "carteira", "vencimentos", "precos"],
  visuals: ["tabelaContratos"],
  compare: true,
  submarkets: ["seco", "s", "ne", "n"],
  level: "analitico",
  interpretation: true,
  format: "pdf",
});

export type BuiltSection = { title: string; items: string[]; kind?: "interpretation" | "method" };

export function periodDays(r: Pick<Report, "periodStart" | "periodEnd">) {
  const d = Math.round((new Date(`${r.periodEnd}T00:00:00`).getTime() - new Date(`${r.periodStart}T00:00:00`).getTime()) / 86_400_000) + 1;
  return Math.max(1, Math.min(90, d));
}

/** Pontos do PLD que caem no período; para série demonstrativa, os últimos N dias. */
export function pldInPeriod(r: Pick<Report, "periodStart" | "periodEnd">, rows: PldPoint[] & { date?: string }[], real: boolean) {
  if (real) {
    const rr = rows as (PldPoint & { date: string })[];
    return rr.filter((x) => x.date >= r.periodStart && x.date <= r.periodEnd);
  }
  return rows.slice(-periodDays(r));
}

export function buildConfiguredReport(
  r: Report & { config: ReportConfig },
  contracts: Contract[],
  kind: CompanyProfile,
  pld: { rows: PldPoint[]; real: boolean },
): BuiltSection[] {
  const cfg = r.config;
  const isFarm = kind === "Fazenda de Energia";
  const has = (i: ReportIndicator) => cfg.indicators.includes(i);
  const lvl = cfg.level;
  const out: BuiltSection[] = [];
  const window = periodDays(r);
  const subs = cfg.submarkets.length ? cfg.submarkets : (["seco"] as PldKey[]);
  const highlights: string[] = [];
  const limits: string[] = [];

  out.push({
    title: "Escopo",
    items: [
      `Finalidade: ${cfg.purpose}. Nível: ${levelLabels[lvl].label}.`,
      `Período: ${r.periodStart.split("-").reverse().join("/")} a ${r.periodEnd.split("-").reverse().join("/")} (${window} dia(s)). Preços em R$/MWh, volumes em MWm.`,
      `PLD: ${pld.real ? "dados da CCEE (médias diárias)" : "série demonstrativa — não são dados oficiais"}.`,
    ],
  });

  if (has("pld")) {
    const inPeriod = pldInPeriod(r, pld.rows, pld.real);
    const items: string[] = [];
    if (!inPeriod.length) {
      items.push("Não há dados de PLD no período selecionado.");
      limits.push("Sem PLD no período: comparações de mercado não foram feitas.");
    } else {
      for (const k of subs) {
        const v = inPeriod.map((p) => p[k]);
        const m = v.reduce((a, b) => a + b, 0) / v.length;
        items.push(lvl === "executivo"
          ? `${PLD_LABEL[k]}: média ${brlMwh(m)}.`
          : `${PLD_LABEL[k]}: média ${brlMwh(m)}, mínimo ${brlMwh(Math.min(...v))}, máximo ${brlMwh(Math.max(...v))}.`);
      }
      if (cfg.compare) {
        const all = pld.real ? (pld.rows as (PldPoint & { date: string })[]).filter((x) => x.date <= r.periodEnd) : pld.rows;
        for (const k of subs) {
          const it = interpretPld(all, Math.min(window, Math.floor(all.length / 2) || 1), k);
          if (it.ok) {
            items.push(`${PLD_LABEL[k]} vs. período anterior de mesmo tamanho: ${pct(it.deltaPct)} (${it.deltaAbs >= 0 ? "+" : "−"}${brlMwh(Math.abs(it.deltaAbs))}).`);
            if (cfg.interpretation && k === subs[0]) highlights.push(it.summary);
          } else limits.push(`${PLD_LABEL[k]}: ${it.reason}`);
        }
      }
    }
    out.push({ title: "PLD", items });
  }

  const pa = portfolioAnalysis(contracts);
  if (has("carteira")) {
    out.push({ title: "Carteira", items: [
      `${pa.active} contrato(s) ativo(s): venda ${pa.sale.mwm.toFixed(1)} MWm (${pa.sale.count}) · compra ${pa.purchase.mwm.toFixed(1)} MWm (${pa.purchase.count}).`,
      ...(lvl !== "executivo" && pa.concentration ? [`Maior contraparte: ${pa.concentration.name}, ${pa.concentration.share.toFixed(0)}% do volume ativo.`] : []),
      ...(lvl === "detalhado" && pa.incomplete.length ? [`${pa.incomplete.length} contrato(s) com dados incompletos.`] : []),
    ] });
    if (cfg.interpretation && pa.concentration && pa.concentration.share >= 50 && pa.active > 1) highlights.push(`A carteira está concentrada: ${pa.concentration.name} responde por ${pa.concentration.share.toFixed(0)}% do volume ativo.`);
  }
  if (has("vencimentos")) {
    out.push({ title: "Vencimentos", items: pa.buckets.map((b) => `${b.label}: ${b.count} contrato(s).`) });
    const near = pa.buckets[0].count + pa.buckets[1].count;
    if (cfg.interpretation && near) highlights.push(`${near} contrato(s) vencem em até 90 dias e precisarão de decisão de renovação ou recontratação.`);
  }
  if (has("precos")) {
    out.push({ title: "Preços contratados", items: [
      `Média ponderada de venda: ${pa.sale.avgPrice != null ? brlMwh(pa.sale.avgPrice) : "sem contratos de venda"}.`,
      `Média ponderada de compra: ${pa.purchase.avgPrice != null ? brlMwh(pa.purchase.avgPrice) : "sem contratos de compra"}.`,
      ...(lvl !== "executivo" && pa.price ? [`Faixa de preços: ${brlMwh(pa.price.min)} a ${brlMwh(pa.price.max)}.`] : []),
    ] });
    if (cfg.interpretation && pa.sale.avgPrice != null && pa.purchase.avgPrice != null) {
      highlights.push(`Diferença entre preço médio de venda e de compra: ${brlMwh(pa.sale.avgPrice - pa.purchase.avgPrice)}.`);
    }
  }
  if (has("resultado")) {
    if (isFarm) {
      const f = farmMetrics(contracts);
      out.push({ title: "Receita estimada", items: [`Receita projetada no mês (estimativa): ${brl(f.projectedRevenue)}; contratada ${brl(f.contractedRevenue)}.`] });
    } else {
      const t = traderMetrics(contracts);
      out.push({ title: "Margem estimada", items: [`Margem projetada no mês (estimativa): ${brl(t.margin)} (${t.marginPercent.toFixed(1).replace(".", ",")}% da receita contratada).`] });
    }
    limits.push("Margem e receita são estimativas gerenciais (volume × preço × 730 h), não liquidação da CCEE.");
  }
  if (has("geracao")) {
    if (!isFarm) limits.push("Geração não se aplica ao perfil Comercializadora.");
    else {
      const f = farmMetrics(contracts);
      out.push({ title: "Geração", items: [`Prevista ${Math.round(f.forecastMwh).toLocaleString("pt-BR")} MWh · realizada ${Math.round(f.realizedMwh).toLocaleString("pt-BR")} MWh (${pct(f.deviationPercent)}).`] });
      limits.push("Geração é estimada a partir da energia contratada; ainda não há importação de medição real.");
    }
  }

  if (cfg.interpretation) {
    out.splice(1, 0, {
      title: "Interpretação",
      kind: "interpretation",
      items: highlights.length ? highlights : ["Os indicadores selecionados não mostram mudança relevante para destacar."],
    });
  }
  if (lvl === "detalhado") {
    out.push({
      title: "Metodologia e limitações",
      kind: "method",
      items: [
        "Variações abaixo de 1% são tratadas como estabilidade; movimento persistente exige ≥ 3% e 70% dos dias do mesmo lado da média anterior.",
        "Médias de preço da carteira são ponderadas pelo volume dos contratos ativos.",
        ...limits,
        ESTIMATE_NOTE,
      ],
    });
  } else if (limits.length && lvl === "analitico") {
    out.push({ title: "Limitações", kind: "method", items: limits });
  }
  return out;
}
