/**
 * Central de Inteligência — geração de insights simulados, porém contextualizados
 * com o portfólio real do usuário (contratos + alertas do store local).
 */

import type { AlertRule, Contract } from "@/lib/store";

export type InsightLevel = "critical" | "attention" | "opportunity" | "info";
export type InsightCategory =
  | "Financeiro"
  | "Contratos"
  | "Mercado"
  | "Operacional"
  | "Clima"
  | "Consumo"
  | "Riscos";

export const insightCategories: InsightCategory[] = [
  "Financeiro",
  "Contratos",
  "Mercado",
  "Operacional",
  "Clima",
  "Consumo",
  "Riscos",
];

export type SmartInsight = {
  id: string;
  level: InsightLevel;
  category: InsightCategory;
  icon: string;
  title: string;
  body: string;
  actionLabel: string;
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
  insights: SmartInsight[];
  stats: {
    total: number;
    critical: number;
    opportunities: number;
    potentialSavings: number;
    risk: { label: string; score: number };
  };
  timeline: { id: string; when: string; label: string; category: InsightCategory }[];
  recommendations: { id: string; text: string; category: InsightCategory }[];
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

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
 * Gera um snapshot completo. `nonce` permite variar prioridades, datas e valores
 * a cada clique em "Atualizar insights".
 */
export function generateInsights(
  contracts: Contract[],
  alerts: AlertRule[],
  nonce = 0,
): InsightsSnapshot {
  const r = (n: number) => Math.abs(Math.sin((nonce + 1) * (n + 1.7)));
  const activeAlerts = alerts.filter((a) => a.enabled).length;
  const now = Date.now();

  const expiring = contracts
    .filter((c) => c.status !== "Encerrado")
    .map((c) => ({
      c,
      days: Math.ceil((new Date(`${c.endDate}T00:00:00`).getTime() - now) / 86400000),
    }))
    .filter((x) => x.days > 0 && x.days <= 120)
    .sort((a, b) => a.days - b.days);

  const volume = contracts
    .filter((c) => c.status === "Ativo")
    .reduce((s, c) => s + c.volume, 0);

  const spotVolatility = 8 + r(1) * 16; // %
  const consumptionDelta = 4 + r(2) * 14; // %
  const costDelta = 2 + r(3) * 9; // %
  const savings = 3200 + Math.round(r(4) * 14000);
  const spotSavings = 6000 + Math.round(r(5) * 26000);

  const list: SmartInsight[] = [
    {
      id: "spot",
      level: spotVolatility > 18 ? "critical" : "attention",
      category: "Riscos",
      icon: "alert",
      title: "Volatilidade elevada do PLD",
      body: `Identificamos aumento de ${spotVolatility.toFixed(1)}% na volatilidade do preço no horário de maior demanda (18h–21h) no submercado SE/CO.`,
      actionLabel: "Sugestão",
      action: "Avaliar revisão contratual e hedge parcial de 5% a 8% do portfólio.",
      impact: `Risco financeiro estimado de ${brl(spotSavings)} no ciclo.`,
      date: hoursAgo(1 + r(6) * 5),
    },
    {
      id: "consumo",
      level: "opportunity",
      category: "Consumo",
      icon: "trend",
      title: "Consumo abaixo da média",
      body: `Seu consumo ficou ${consumptionDelta.toFixed(0)}% abaixo da média dos últimos meses, com melhor aderência à curva contratada.`,
      actionLabel: "Impacto financeiro estimado",
      action: `Economia aproximada de ${brl(savings)} no mês corrente.`,
      date: hoursAgo(4 + r(7) * 12),
    },
    {
      id: "custo",
      level: costDelta > 6 ? "attention" : "info",
      category: "Financeiro",
      icon: "money",
      title: `Custo médio da energia aumentou ${costDelta.toFixed(0)}%`,
      body: "A comparação com o mês anterior mostra pressão de preço nos contratos flexíveis e no curto prazo.",
      actionLabel: "Sugestão",
      action: "Reavaliar a estratégia de contratação e antecipar compras de longo prazo.",
      impact: `Portfólio ativo monitorado: ${volume.toFixed(1)} MWm.`,
      date: hoursAgo(20 + r(8) * 10),
    },
    {
      id: "clima",
      level: "info",
      category: "Clima",
      icon: "weather",
      title: "Previsão de temperaturas elevadas na próxima semana",
      body: `Modelos indicam anomalia de +${(1 + r(9) * 3).toFixed(1)}°C acima da média histórica nas regiões Sudeste e Centro-Oeste.`,
      actionLabel: "Impacto esperado",
      action: "Maior consumo energético e pressão adicional sobre o PLD.",
      date: hoursAgo(28 + r(10) * 20),
    },
    {
      id: "mercado",
      level: r(11) > 0.55 ? "attention" : "info",
      category: "Mercado",
      icon: "market",
      title: `PLD SE/CO com tendência de ${r(11) > 0.55 ? "alta" : "estabilidade"} nas próximas 48h`,
      body: `Reservatórios do subsistema Sudeste em ${(36 + r(12) * 14).toFixed(0)}% e despacho térmico acima da média semanal.`,
      actionLabel: "Recomendação",
      action: "Monitorar a curva forward e reavaliar posições de curto prazo.",
      date: hoursAgo(2 + r(13) * 8),
    },
    {
      id: "operacional",
      level: activeAlerts ? "info" : "attention",
      category: "Operacional",
      icon: "activity",
      title: activeAlerts
        ? `${activeAlerts} alertas ativos monitorando sua operação`
        : "Nenhum alerta ativo configurado",
      body: activeAlerts
        ? "As regras acompanham PLD, reservatórios e vencimentos contratuais em tempo real."
        : "Sem regras ativas, movimentos relevantes de preço podem passar sem notificação.",
      actionLabel: "Recomendação",
      action: activeAlerts
        ? "Revisar limiares dos alertas de preço para o horário de ponta."
        : "Criar ao menos um alerta de variação de PLD e um de vencimento contratual.",
      date: hoursAgo(6 + r(14) * 30),
    },
  ];

  if (expiring[0]) {
    list.push({
      id: `contrato-${expiring[0].c.id}`,
      level: expiring[0].days <= 30 ? "critical" : "attention",
      category: "Contratos",
      icon: "doc",
      title: `O contrato ${expiring[0].c.name} vence em ${expiring[0].days} dias`,
      body: `${expiring[0].c.code} · ${expiring[0].c.company} — ${expiring[0].c.volume.toFixed(1)} MWm em ${expiring[0].c.submarket}.`,
      actionLabel: "Recomendação",
      action: "Iniciar processo de renovação e cotar preços com fornecedores.",
      date: hoursAgo(10 + r(15) * 20),
    });
  } else {
    list.push({
      id: "contrato-generico",
      level: "attention",
      category: "Contratos",
      icon: "doc",
      title: "O contrato da Unidade Campinas vence em 28 dias",
      body: "Nenhuma renovação registrada para o ciclo seguinte na carteira atual.",
      actionLabel: "Recomendação",
      action: "Iniciar processo de renovação.",
      date: hoursAgo(12 + r(15) * 20),
    });
  }

  const insights = list.sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level),
  );

  const critical = insights.filter((i) => i.level === "critical").length;
  const opportunities = insights.filter((i) => i.level === "opportunity").length;
  const riskScore = Math.min(98, Math.round(32 + spotVolatility * 2 + critical * 9));
  const riskLabel = riskScore > 72 ? "Elevado" : riskScore > 48 ? "Moderado" : "Baixo";

  const timeline = [
    { id: "t1", when: hoursAgo(2), label: "Novo insight financeiro gerado", category: "Financeiro" as InsightCategory },
    { id: "t2", when: hoursAgo(9), label: "Reprocessamento da curva de PLD", category: "Mercado" as InsightCategory },
    { id: "t3", when: hoursAgo(27), label: "Atualização contratual detectada", category: "Contratos" as InsightCategory },
    { id: "t4", when: hoursAgo(52), label: "Novo alerta operacional disparado", category: "Operacional" as InsightCategory },
    { id: "t5", when: hoursAgo(74), label: "Modelo climático revisado", category: "Clima" as InsightCategory },
    { id: "t6", when: hoursAgo(120), label: "Auditoria de consumo concluída", category: "Consumo" as InsightCategory },
  ];

  const pool: { text: string; category: InsightCategory }[] = [
    { text: "Avaliar renovação do contrato da unidade SP.", category: "Contratos" },
    { text: "Revisar consumo no horário de ponta.", category: "Consumo" },
    { text: "Monitorar variação do PLD nos próximos dias.", category: "Mercado" },
    { text: "Reduzir dependência do mercado spot.", category: "Riscos" },
    { text: "Atualizar parâmetros de consumo das unidades.", category: "Operacional" },
    { text: `Antecipar compra de energia para capturar economia de ${brl(savings)}.`, category: "Financeiro" },
    { text: "Revisar limiares dos alertas de preço.", category: "Operacional" },
    { text: "Simular impacto climático sobre a demanda semanal.", category: "Clima" },
  ];

  const start = Math.abs(Math.floor(r(16) * pool.length));
  const recommendations = Array.from({ length: 5 }).map((_, i) => {
    const item = pick(pool, start + i);
    return { id: `rec-${i}`, text: item.text, category: item.category };
  });

  return {
    generatedAt: new Date().toISOString(),
    insights,
    stats: {
      total: insights.length,
      critical,
      opportunities,
      potentialSavings: savings + spotSavings,
      risk: { label: riskLabel, score: riskScore },
    },
    timeline,
    recommendations,
  };
}
