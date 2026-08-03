/**
 * Plano único da Ethere + estrutura preparada para integração futura com Stripe.
 * Nenhum pagamento é processado neste momento.
 */

export const ETHERE_PLAN = {
  id: "ethere-mensal",
  name: "Plano Ethere",
  price: 799.9,
  priceLabel: "R$ 799,90",
  interval: "mês",
  description:
    "Plataforma completa para monitoramento, gestão e inteligência do Mercado Livre de Energia.",
  features: [
    "Monitoramento energético",
    "Gestão de contratos",
    "Dashboards inteligentes",
    "Relatórios executivos",
    "Alertas inteligentes",
    "Indicadores financeiros",
    "Suporte prioritário",
  ],
  /** Preenchido quando o Stripe for integrado (price_...). */
  stripePriceId: null as string | null,
} as const;

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type Subscription = {
  planId: string;
  status: SubscriptionStatus;
  /** Data da próxima renovação (dd/mm), quando aplicável. */
  renewsAt: string | null;
  /** IDs do Stripe, quando a integração for ativada. */
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export const defaultSubscription: Subscription = {
  planId: ETHERE_PLAN.id,
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
