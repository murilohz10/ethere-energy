/**
 * Cálculos financeiros centralizados (Services).
 *
 * Nenhuma tela recalcula receita, custo ou exposição por conta própria: todas
 * consomem estas funções, garantindo consistência entre dashboard, relatórios,
 * insights e alertas.
 */

import type { Contract } from "./types";

/** Horas médias em um mês (usado para converter MW médios em MWh). */
export const HOURS_PER_MONTH = 730;

export type PortfolioMetrics = {
  activeContracts: number;
  pendingContracts: number;
  closedContracts: number;
  volumeMwm: number;
  volumeMwh: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  averagePrice: number;
  exposure: number;
  expiringIn30: Contract[];
  expiringIn90: Contract[];
  overdue: Contract[];
};

const daysTo = (iso: string) =>
  iso ? Math.ceil((new Date(`${iso}T00:00:00`).getTime() - Date.now()) / 86400000) : Infinity;

export function contractRevenue(contract: Contract): number {
  return contract.type === "Venda" ? contract.volume * contract.price * HOURS_PER_MONTH : 0;
}

export function contractCost(contract: Contract): number {
  return contract.type === "Compra" ? contract.volume * contract.price * HOURS_PER_MONTH : 0;
}

export function portfolioMetrics(contracts: Contract[]): PortfolioMetrics {
  const active = contracts.filter((c) => c.status === "Ativo");
  const revenue = active.reduce((sum, c) => sum + contractRevenue(c), 0);
  const cost = active.reduce((sum, c) => sum + contractCost(c), 0);
  const volumeMwm = active.reduce((sum, c) => sum + c.volume, 0);
  const sold = active.filter((c) => c.type === "Venda").reduce((s, c) => s + c.volume, 0);
  const bought = active.filter((c) => c.type === "Compra").reduce((s, c) => s + c.volume, 0);
  const margin = revenue - cost;
  const open = contracts.filter((c) => c.status !== "Encerrado");

  return {
    activeContracts: active.length,
    pendingContracts: contracts.filter((c) => c.status === "Pendente").length,
    closedContracts: contracts.filter((c) => c.status === "Encerrado").length,
    volumeMwm,
    volumeMwh: volumeMwm * HOURS_PER_MONTH,
    revenue,
    cost,
    margin,
    marginPercent: revenue > 0 ? (margin / revenue) * 100 : 0,
    averagePrice: volumeMwm > 0 ? active.reduce((s, c) => s + c.price * c.volume, 0) / volumeMwm : 0,
    exposure: sold - bought,
    expiringIn30: open.filter((c) => daysTo(c.endDate) >= 0 && daysTo(c.endDate) <= 30),
    expiringIn90: open.filter((c) => daysTo(c.endDate) >= 0 && daysTo(c.endDate) <= 90),
    overdue: open.filter((c) => daysTo(c.endDate) < 0),
  };
}

export function daysToExpire(contract: Contract): number {
  return daysTo(contract.endDate);
}
