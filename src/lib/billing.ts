/**
 * Planos da Ethere (Core e Pro) + estrutura preparada para Stripe.
 * Nenhum pagamento é processado neste momento.
 *
 * Os dois planos têm a mesma cobertura de dados (CCEE, ONS, ANA). A diferença
 * está na profundidade da análise dos relatórios e nos limites de uso.
 * Os mesmos limites são aplicados no banco (triggers) — ver migration de planos.
 */

export type PlanId = "ethere-core" | "ethere-pro";

export type PlanLimits = {
  /** null = ilimitado */
  contracts: number | null;
  alerts: number | null;
  reportsPerMonth: number | null;
  notifiedUsers: number | null;
  /** Relatórios com análise geral, contexto de mercado e relação entre dados. */
  deepReports: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  interval: string;
  description: string;
  features: string[];
  limits: PlanLimits;
  stripePriceId: string | null;
};

export const PLANS: Record<PlanId, Plan> = {
  "ethere-core": {
    id: "ethere-core",
    name: "Ethere Core",
    price: 599.9,
    priceLabel: "R$ 599,90",
    interval: "mês",
    description: "Cobertura completa dos dados do setor com relatórios informativos.",
    features: [
      "Dados CCEE, ONS e ANA",
      "Até 100 contratos",
      "Até 5 alertas",
      "3 relatórios básicos/mês",
      "Notificações para até 2 usuários",
      "Ethere Intelligence: até 50 perguntas/mês",
    ],
    limits: { contracts: 100, alerts: 5, reportsPerMonth: 3, notifiedUsers: 2, deepReports: false },
    stripePriceId: null,
  },
  "ethere-pro": {
    id: "ethere-pro",
    name: "Ethere Pro",
    price: 1199.9,
    priceLabel: "R$ 1.199,90",
    interval: "mês",
    description: "Mesma cobertura de dados, sem limites de uso e com análises aprofundadas.",
    features: [
      "Dados CCEE, ONS e ANA",
      "Contratos ilimitados",
      "Alertas ilimitados",
      "Relatórios ilimitados",
      "Análises aprofundadas",
      "Notificações para todos os usuários",
      "Ethere Intelligence ilimitado",
    ],
    limits: { contracts: null, alerts: null, reportsPerMonth: null, notifiedUsers: null, deepReports: true },
    stripePriceId: null,
  },
};

export const PLAN_LIST: Plan[] = [PLANS["ethere-core"], PLANS["ethere-pro"]];
export const DEFAULT_PLAN_ID: PlanId = "ethere-core";

export function getPlan(id?: string | null): Plan {
  return id && id in PLANS ? PLANS[id as PlanId] : PLANS[DEFAULT_PLAN_ID];
}

/** Compatibilidade: plano padrão de novas contas. */
export const ETHERE_PLAN = PLANS[DEFAULT_PLAN_ID];

export const withinLimit = (limit: number | null, current: number) => limit === null || current < limit;

/** "YYYY-MM" do mês corrente (o contador de relatórios reinicia a cada mês). */
export const monthKey = (d: Date | string = new Date()) =>
  (typeof d === "string" ? d : d.toISOString()).slice(0, 7);

export const limitMessages = {
  contracts: (n: number) => `Você atingiu o limite de ${n} contratos do plano Ethere Core.`,
  alerts: (n: number) => `Você atingiu o limite de ${n} alertas do plano Ethere Core.`,
  reports: (n: number) => `Você atingiu o limite de ${n} relatórios deste mês.`,
  notified: (n: number) => `O plano Ethere Core permite notificações para até ${n} usuários.`,
  upgrade: "Faça upgrade para o Ethere Pro para remover esse limite.",
};

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type Subscription = {
  planId: string;
  status: SubscriptionStatus;
  renewsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export const defaultSubscription: Subscription = {
  planId: DEFAULT_PLAN_ID,
  status: "trialing",
  renewsAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

export function formatPlanPrice(plan: { priceLabel: string; interval: string }) {
  return `${plan.priceLabel} / ${plan.interval}`;
}

export function subscriptionStatusLabel(status: SubscriptionStatus) {
  return status === "trialing"
    ? "Em trial"
    : status === "active"
      ? "Ativa"
      : status === "past_due"
        ? "Pagamento pendente"
        : "Cancelada";
}

/** Placeholder da futura chamada de checkout (Stripe). */
export async function startCheckout(): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "Pagamentos serão habilitados em breve." };
}
