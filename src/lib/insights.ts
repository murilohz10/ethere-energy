/**
 * Central de Inteligência — análises simuladas, porém contextualizadas ao
 * portfólio real (contratos + alertas) E ao perfil da empresa.
 *
 * Cada insight segue a estrutura: o que aconteceu → por que importa → possível
 * impacto. Comercializadoras recebem leitura de carteira, contratos e margem;
 * fazendas recebem leitura de geração, receita e contratos de venda.
 */

import type { AlertRule, Contract } from "@/lib/store";
import {
  ESTIMATE_NOTE,
  expiringContracts,
  farmMetrics,
  isFarmProfile,
  traderMetrics,
  type CompanyProfile,
} from "@/lib/profile";

export type InsightLevel = "critical" | "attention" | "opportunity" | "info";
export type InsightCategory =
  | "Financeiro"
  | "Contratos"
  | "Mercado"
  | "Operacional"
  | "Clima"
  | "Geração"
  | "Receita"
  | "Carteira"
  | "Riscos";

export const traderCategories: InsightCategory[] = [
  "Mercado",
  "Carteira",
  "Contratos",
  "Financeiro",
  "Riscos",
  "Operacional",
];

export const farmCategories: InsightCategory[] = [
  "Mercado",
  "Geração",
  "Receita",
  "Contratos",
  "Clima",
  "Operacional",
];

export function categoriesFor(profile?: CompanyProfile): InsightCategory[] {
  return isFarmProfile(profile) ? farmCategories : traderCategories;
}

/** Compatibilidade: lista completa de categorias. */
export const insightCategories: InsightCategory[] = [
  ...new Set([...traderCategories, ...farmCategories]),
];

export type SmartInsight = {
  id: string;
  level: InsightLevel;
  category: InsightCategory;
  icon: string;
  /** O que aconteceu. */
  title: string;
  body: string;
  /** Por que importa. */
  why?: string;
  actionLabel: string;
  /** Possível impacto / recomendação. */
  action: string;
  impact?: string;
  date: string; // ISO
};

export const levelMeta: Record<
  InsightLevel,
  { label: string; dot: string; chip: string; ring: string; bar: string }
> = {
  critical: {
    label: "Crítico",
    dot: "bg-red-500",
    chip: "bg-red-500/12 text-red-500 border-red-500/25",
    ring: "border-red-500/30",
    bar: "bg-red-500",
  },
  attention: {
    label: "Atenção",
    dot: "bg-amber-500",
    chip: "bg-amber-500/12 text-amber-500 border-amber-500/25",
    ring: "border-amber-500/30",
    bar: "bg-amber-500",
  },
  opportunity: {
    label: "Oportunidade",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
    ring: "border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  info: {
    label: "Informativo",
    dot: "bg-brand",
    chip: "bg-brand/12 text-brand border-brand/25",
    ring: "border-brand-soft",
    bar: "bg-brand",
  },
};

export const levelOrder: InsightLevel[] = ["critical", "attention", "opportunity", "info"];

export type InsightsSnapshot = {
  generatedAt: string;
  profile: CompanyProfile;
  insights: SmartInsight[];
  stats: {
    total: number;
    critical: number;
    opportunities: number;
    /** Valor financeiro estimado em discussão no ciclo. */
    financialImpact: number;
    financialImpactLabel: string;
    risk: { label: string; score: number };
  };
  timeline: { id: string; when: string; label: string; category: InsightCategory }[];
  recommendations: { id: string; text: string; category: InsightCategory }[];
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const num = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(Math.floor(seed)) % arr.length];
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Rótulo relativo em português ("Hoje", "Ontem", "3 dias atrás"). */
export function relativeDay(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Ontem";
  return `${diff} dias atrás`;
}

export function formatInsightDate(iso: string): string {
  const d = new Date(iso);
  return `${relativeDay(iso)} · ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

/**
 * Gera um snapshot completo para o perfil informado. `nonce` permite variar
 * prioridades, datas e valores a cada clique em "Atualizar insights".
 */
export function generateInsights(
  contracts: Contract[],
  alerts: AlertRule[],
  nonce = 0,
  profile: CompanyProfile = "Comercializadora",
): InsightsSnapshot {
  const r = (n: number) => Math.abs(Math.sin((nonce + 1) * (n + 1.7)));
  const activeAlerts = alerts.filter((a) => a.enabled).length;
  const expiring = expiringContracts(contracts, 120);
  const next = expiring[0];
  const daysToNext = next
    ? Math.ceil((new Date(`${next.endDate}T00:00:00`).getTime() - Date.now()) / 86400000)
    : 0;

  const farm = isFarmProfile(profile);
  const list: SmartInsight[] = [];
  let financialImpact = 0;
  let financialImpactLabel = "";
  let riskBase = 0;

  if (farm) {
    const m = farmMetrics(contracts, nonce);
    const deviation = m.deviationPercent;
    const revenueShift = m.projectedRevenue * (0.04 + r(2) * 0.09);
    financialImpact = revenueShift;
    financialImpactLabel = "Receita em variação estimada";
    riskBase = Math.abs(deviation) * 1.6;

    list.push(
      {
        id: "geracao",
        level: deviation < -8 ? "critical" : deviation < -3 ? "attention" : "opportunity",
        category: "Geração",
        icon: "activity",
        title:
          deviation < 0
            ? `Geração realizada ${num(Math.abs(deviation))}% abaixo da prevista`
            : `Geração realizada ${num(deviation)}% acima da prevista`,
        body: `No ciclo atual foram ${num(m.realizedMwh, 0)} MWh realizados contra ${num(m.forecastMwh, 0)} MWh previstos.`,
        why: "O desvio entre previsão e realização altera a energia disponível para cumprir os contratos de venda e o excedente exposto ao preço de curto prazo.",
        actionLabel: "Possível impacto",
        action:
          deviation < 0
            ? "Menor excedente para venda no curto prazo e pressão sobre a receita do período."
            : "Excedente adicional disponível para comercialização no curto prazo.",
        impact: ESTIMATE_NOTE,
        date: hoursAgo(1 + r(1) * 5),
      },
      {
        id: "receita",
        level: r(3) > 0.55 ? "attention" : "info",
        category: "Receita",
        icon: "money",
        title: `Receita projetada do ciclo em ${brl(m.projectedRevenue)}`,
        body: `${brl(m.contractedRevenue)} vêm da energia contratada e ${num(m.surplusMwh, 0)} MWh de excedente são valorados ao PLD de ${brl(m.pld.value)}/MWh.`,
        why: "Quanto maior a parcela exposta ao preço de curto prazo, mais a receita do período varia junto com o PLD.",
        actionLabel: "Possível impacto",
        action: `Variação estimada de ${brl(revenueShift)} na receita do período conforme o PLD se mover.`,
        impact: ESTIMATE_NOTE,
        date: hoursAgo(3 + r(4) * 8),
      },
      {
        id: "mercado",
        level: m.pld.delta > 3 ? "opportunity" : "info",
        category: "Mercado",
        icon: "market",
        title: `PLD SE/CO em ${brl(m.pld.value)} (${m.pld.delta >= 0 ? "+" : ""}${num(m.pld.delta)}%)`,
        body: "A curva de curto prazo se moveu no último fechamento e a expectativa para as próximas 48h segue a mesma direção.",
        why: "O PLD define o valor do excedente de geração que não está coberto por contrato.",
        actionLabel: "Possível impacto",
        action:
          m.pld.delta >= 0
            ? "Janela mais favorável para comercializar o excedente de geração."
            : "Excedente valorado abaixo do ciclo anterior; avaliar contratação de parte do volume.",
        date: hoursAgo(2 + r(5) * 6),
      },
      {
        id: "contratado",
        level: "info",
        category: "Contratos",
        icon: "doc",
        title: `${num(m.contractedMwm)} MWm de energia contratada em venda`,
        body: `Preço médio contratado de ${brl(m.avgContractPrice)}/MWh sobre ${num(m.contractedMwh, 0)} MWh no ciclo.`,
        why: "A energia contratada é a parcela previsível da receita: define quanto da geração já está protegida de variações de preço.",
        actionLabel: "Possível impacto",
        action: "Manter a relação entre geração prevista e energia contratada acompanhada a cada ciclo.",
        date: hoursAgo(8 + r(6) * 14),
      },
      {
        id: "clima",
        level: "info",
        category: "Clima",
        icon: "weather",
        title: "Condições climáticas alteram a previsão de geração",
        body: `Modelos indicam anomalia de +${num(1 + r(7) * 3)}°C e mudança no regime de chuvas nas regiões de operação.`,
        why: "Clima e hidrologia são os principais determinantes da geração prevista para os próximos ciclos.",
        actionLabel: "Possível impacto",
        action: "Revisar a previsão de geração do próximo ciclo antes de assumir novos compromissos de venda.",
        date: hoursAgo(20 + r(8) * 18),
      },
    );
  } else {
    const m = traderMetrics(contracts, nonce);
    financialImpact = Math.abs(m.margin);
    financialImpactLabel = "Margem projetada";
    riskBase = m.expiring90.length * 3.2;

    list.push(
      {
        id: "mercado",
        level: Math.abs(m.pld.delta) > 4 ? "attention" : "info",
        category: "Mercado",
        icon: "market",
        title: `PLD SE/CO em ${brl(m.pld.value)} (${m.pld.delta >= 0 ? "+" : ""}${num(m.pld.delta)}%)`,
        body: "O último fechamento moveu a curva de curto prazo no submercado de maior concentração da carteira.",
        why: "A variação do PLD observada no período pode alterar a margem projetada da carteira nos próximos ciclos.",
        actionLabel: "Possível impacto",
        action: `Margem projetada atual de ${brl(m.margin)} no ciclo.`,
        impact: ESTIMATE_NOTE,
        date: hoursAgo(1 + r(1) * 5),
      },
      {
        id: "margem",
        level: m.marginPercent < 6 ? "attention" : "opportunity",
        category: "Financeiro",
        icon: "money",
        title: `Margem projetada de ${num(m.marginPercent)}% no ciclo`,
        body: `Receita estimada de ${brl(m.revenue)} contra custo de ${brl(m.cost)}, resultando em ${brl(m.margin)}.`,
        why: "A margem projetada mostra quanto do resultado comercial resiste às variações de preço do período.",
        actionLabel: "Possível impacto",
        action:
          m.marginPercent < 6
            ? "Revisar preços de venda e antecipar compras para recompor a margem."
            : "Margem com folga para negociar novos volumes de venda no curto prazo.",
        impact: ESTIMATE_NOTE,
        date: hoursAgo(5 + r(3) * 10),
      },
      {
        id: "oportunidade",
        level: "opportunity",
        category: "Mercado",
        icon: "trend",
        title: `Preço médio de venda da carteira em ${brl(m.avgSalePrice)}/MWh`,
        body: `O preço médio contratado está ${num(Math.abs(m.avgSalePrice - m.pld.value))} R$/MWh ${m.avgSalePrice >= m.pld.value ? "acima" : "abaixo"} do PLD atual.`,
        why: "A relação entre preço contratado e preço de curto prazo indica onde há espaço comercial para novos negócios.",
        actionLabel: "Possível impacto",
        action: "Direcionar propostas comerciais para os submercados com maior diferença favorável.",
        date: hoursAgo(9 + r(4) * 12),
      },
      {
        id: "operacional",
        level: activeAlerts ? "info" : "attention",
        category: "Operacional",
        icon: "activity",
        title: activeAlerts
          ? `${activeAlerts} alertas ativos monitorando a carteira`
          : "Nenhum alerta ativo configurado",
        body: activeAlerts
          ? "As regras acompanham preço, margem e vencimentos contratuais."
          : "Sem regras ativas, movimentos relevantes de preço podem passar sem notificação.",
        why: "Alertas reduzem o tempo entre a movimentação do mercado e a decisão comercial.",
        actionLabel: "Possível impacto",
        action: activeAlerts
          ? "Revisar limiares de preço e margem para o ciclo atual."
          : "Criar ao menos um alerta de PLD e um de vencimento contratual.",
        date: hoursAgo(14 + r(5) * 20),
      },
    );
  }

  if (next) {
    list.push({
      id: `contrato-${next.id}`,
      level: daysToNext <= 30 ? "critical" : "attention",
      category: "Contratos",
      icon: "doc",
      title: `O contrato ${next.code} vence em ${daysToNext} dias`,
      body: `${next.name} · ${next.company} — ${num(next.volume)} MWm em ${next.submarket}.`,
      why: farm
        ? "O vencimento reduz a parcela de receita já contratada para os próximos ciclos de geração."
        : "O vencimento altera a energia contratada e a margem dos próximos ciclos.",
      actionLabel: "Possível impacto",
      action: "Iniciar a renovação e cotar preços antes do encerramento do contrato.",
      date: hoursAgo(6 + r(9) * 16),
    });
  } else {
    list.push({
      id: "contrato-vazio",
      level: "attention",
      category: "Contratos",
      icon: "doc",
      title: "Nenhum vencimento nos próximos 120 dias",
      body: "A carteira atual não possui contratos em janela de renovação.",
      why: farm
        ? "Sem renovações próximas, a receita contratada permanece estável no horizonte analisado."
        : "Sem renovações próximas, a posição contratada permanece estável no horizonte analisado.",
      actionLabel: "Possível impacto",
      action: "Aproveitar a janela para prospectar novos contratos de médio prazo.",
      date: hoursAgo(11 + r(9) * 18),
    });
  }

  const insights = list.sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level),
  );

  const critical = insights.filter((i) => i.level === "critical").length;
  const opportunities = insights.filter((i) => i.level === "opportunity").length;
  const riskScore = Math.min(98, Math.round(34 + riskBase + critical * 9));
  const riskLabel = riskScore > 72 ? "Elevado" : riskScore > 48 ? "Moderado" : "Baixo";

  const timelineLabels = farm
    ? [
        "Nova leitura de geração processada",
        "Reprocessamento da curva de PLD",
        "Atualização contratual detectada",
        "Revisão da previsão de geração",
        "Modelo climático revisado",
        "Consolidação de receita concluída",
      ]
    : [
        "Nova leitura de posição da carteira",
        "Reprocessamento da curva de PLD",
        "Atualização contratual detectada",
        "Recálculo da margem projetada",
        "Novo alerta operacional disparado",
        "Consolidação da carteira concluída",
      ];
  const timelineCats: InsightCategory[] = farm
    ? ["Geração", "Mercado", "Contratos", "Geração", "Clima", "Receita"]
    : ["Carteira", "Mercado", "Contratos", "Financeiro", "Operacional", "Riscos"];

  const timeline = timelineLabels.map((label, i) => ({
    id: `t${i}`,
    when: hoursAgo([2, 9, 27, 40, 74, 120][i]),
    label,
    category: timelineCats[i],
  }));

  const pool: { text: string; category: InsightCategory }[] = farm
    ? [
        { text: "Revisar a previsão de geração do próximo ciclo.", category: "Geração" },
        { text: "Avaliar comercialização do excedente de geração.", category: "Receita" },
        { text: "Acompanhar o PLD antes de fechar novos contratos de venda.", category: "Mercado" },
        { text: "Iniciar renovação dos contratos com vencimento próximo.", category: "Contratos" },
        { text: "Atualizar parâmetros de disponibilidade das usinas.", category: "Operacional" },
        { text: "Monitorar condições hidrológicas e climáticas da região.", category: "Clima" },
        { text: "Revisar limiares dos alertas de desvio de geração.", category: "Operacional" },
      ]
    : [
        { text: "Revisar preços de venda dos contratos flexíveis.", category: "Financeiro" },
        { text: "Monitorar a variação do PLD nos próximos dias.", category: "Mercado" },
        { text: "Iniciar renovação dos contratos com vencimento próximo.", category: "Contratos" },
        { text: "Priorizar propostas nos submercados com maior margem.", category: "Financeiro" },
        { text: "Revisar limiares dos alertas de preço e margem.", category: "Operacional" },
        { text: "Reavaliar o resultado projetado por contraparte.", category: "Riscos" },
      ];

  const start = Math.abs(Math.floor(r(16) * pool.length));
  const recommendations = Array.from({ length: 5 }).map((_, i) => {
    const item = pick(pool, start + i);
    return { id: `rec-${i}`, text: item.text, category: item.category };
  });

  return {
    generatedAt: new Date().toISOString(),
    profile,
    insights,
    stats: {
      total: insights.length,
      critical,
      opportunities,
      financialImpact,
      financialImpactLabel,
      risk: { label: riskLabel, score: riskScore },
    },
    timeline,
    recommendations,
  };
}
