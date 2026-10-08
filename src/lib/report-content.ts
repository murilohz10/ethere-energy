/**
 * Conteúdo dos relatórios por plano.
 *
 * Core (basic): resumo, comportamento dos dados e principais informações.
 * Pro: acrescenta análise geral, contexto de mercado, análise individual de
 * cada dado e relação entre os dados. Valores são estimativas gerenciais.
 */
import type { Contract, Report } from "./store";
import { brl } from "./store";
import { farmMetrics, pldSnapshot, traderMetrics, ESTIMATE_NOTE, type CompanyProfile } from "./profile";

export type ReportSection = { title: string; items: string[] };

const n1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function buildReportSections(report: Report, contracts: Contract[], kind: CompanyProfile): ReportSection[] {
  const isFarm = kind === "Fazenda de Energia";
  const pld = pldSnapshot("SE/CO");
  const active = contracts.filter((c) => c.status === "Ativo");
  const expiring = contracts.filter((c) => {
    const d = c.endDate ? (new Date(`${c.endDate}T00:00:00`).getTime() - Date.now()) / 86_400_000 : Infinity;
    return d >= 0 && d <= 90;
  });

  const summary: ReportSection = isFarm
    ? (() => {
        const m = farmMetrics(contracts);
        return {
          title: "Resumo dos dados",
          items: [
            `Geração prevista: ${n1(m.forecastMwh)} MWh · realizada: ${n1(m.realizedMwh)} MWh.`,
            `Energia contratada: ${n1(m.contractedMwm)} MWm em ${active.filter((c) => c.type === "Venda").length} contrato(s) de venda ativos.`,
            `Receita projetada (estimativa): ${brl(m.projectedRevenue)}.`,
            `PLD SE/CO: ${brl(pld.value)}/MWh.`,
          ],
        };
      })()
    : (() => {
        const m = traderMetrics(contracts);
        return {
          title: "Resumo dos dados",
          items: [
            `Energia contratada: ${n1(m.contractedMwm)} MWm (venda ${n1(m.saleMwm)} · compra ${n1(m.purchaseMwm)}).`,
            `Margem projetada (estimativa): ${brl(m.margin)}.`,
            `Contratos ativos: ${active.length} · a vencer em 90 dias: ${expiring.length}.`,
            `PLD SE/CO: ${brl(pld.value)}/MWh.`,
          ],
        };
      })();

  const behavior: ReportSection = {
    title: "Comportamento dos dados",
    items: [
      `PLD SE/CO variou ${pld.delta >= 0 ? "+" : ""}${pld.delta}% em relação ao dia anterior.`,
      isFarm
        ? `Desvio de geração no período: ${n1(farmMetrics(contracts).deviationPercent)}%.`
        : `Posição líquida estimada: ${n1(traderMetrics(contracts).netPositionMwm)} MWm.`,
      `${expiring.length} contrato(s) com vencimento nos próximos 90 dias.`,
    ],
  };

  const main: ReportSection = {
    title: "Principais informações",
    items: active.slice(0, 5).map((c) => `${c.code} · ${c.company} · ${c.type} · ${c.volume} MWm a ${brl(c.price)}/MWh`),
  };

  const sections = [summary, behavior, main];
  if (report.tier !== "pro") return sections;

  const subs = ["SE/CO", "S", "NE", "N"].map((s) => ({ s, p: pldSnapshot(s) }));
  return [
    {
      title: "Análise geral",
      items: isFarm
        ? [
            `A receita da operação depende da geração realizada e do preço de liquidação do excedente; com PLD em ${brl(pld.value)}/MWh, cada MWh fora dos contratos tem peso direto no resultado.`,
            `A energia contratada cobre parte da geração prevista; o restante fica exposto à variação do PLD.`,
          ]
        : [
            `A carteira combina posições de compra e venda; a margem projetada reflete o spread entre preços contratados e o custo de suprimento.`,
            `A posição líquida indica quanto da carteira depende do PLD para ser equilibrada.`,
          ],
    },
    ...sections,
    {
      title: "Contexto de mercado",
      items: subs.map(({ s, p }) => `PLD ${s}: ${brl(p.value)}/MWh (${p.delta >= 0 ? "+" : ""}${p.delta}%).`),
    },
    {
      title: "Análise individual dos dados",
      items: active.slice(0, 5).map((c) => {
        const spread = c.price - pld.value;
        return `${c.code} (${c.type}): preço ${brl(c.price)} contra PLD ${brl(pld.value)} — diferença de ${brl(spread)}/MWh.`;
      }),
    },
    {
      title: "Relação entre os dados",
      items: isFarm
        ? [
            "Geração abaixo do previsto reduz o excedente valorado ao PLD e pode exigir recompra para honrar contratos.",
            "Vencimentos próximos ampliam a parcela da geração sujeita ao preço de mercado.",
          ]
        : [
            "Alta do PLD favorece posições compradas e pressiona a margem de posições vendidas sem lastro.",
            "Contratos a vencer alteram a posição líquida e devem ser considerados na recomposição da carteira.",
          ],
    },
    { title: "Nota", items: [ESTIMATE_NOTE] },
  ];
}
