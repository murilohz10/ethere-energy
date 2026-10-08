import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import {
  Sparkles, TrendingUp, TrendingDown, FileText, AlertTriangle, DollarSign, Activity,
  ArrowUpRight, Gauge, Scale, Zap, CalendarClock,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAlerts, useContracts, brl, fmtDate } from "@/lib/store";
import { generateInsights, levelMeta } from "@/lib/insights";
import {
  useCompanyProfile, traderMetrics, farmMetrics, pldSeries, generationSeries,
  positionBySubmarket, contractedByContract, financialSeries, expirationBuckets,
  ESTIMATE_NOTE,
} from "@/lib/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Visão Geral · Ethere" },
      {
        name: "description",
        content:
          "Painel inicial da Ethere Energy, adaptado ao perfil da empresa: carteira e margem para comercializadoras, geração e receita para fazendas de energia.",
      },
      { property: "og:title", content: "Visão Geral · Ethere" },
      {
        property: "og:description",
        content: "Indicadores, gráficos e análises contextualizados ao perfil da sua operação de energia.",
      },
    ],
  }),
  component: Overview,
});

const chartTooltip = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
  boxShadow: "var(--shadow-elegant)",
} as const;

const num = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
const compactBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });

function Overview() {
  const { contracts } = useContracts();
  const { alerts } = useAlerts();
  const { kind, isFarm, copy } = useCompanyProfile();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [kind]);

  const topInsights = useMemo(
    () => generateInsights(contracts, alerts, 0, kind).insights.slice(0, 3),
    [contracts, alerts, kind],
  );

  const trader = useMemo(() => traderMetrics(contracts), [contracts]);
  const farm = useMemo(() => farmMetrics(contracts), [contracts]);
  const pld = isFarm ? farm.pld : trader.pld;
  const pldData = useMemo(() => pldSeries(30), []);
  const genData = useMemo(() => generationSeries(farm.capacityMwm, 30), [farm.capacityMwm]);
  const positionData = useMemo(() => positionBySubmarket(contracts), [contracts]);
  const contractedData = useMemo(() => contractedByContract(contracts), [contracts]);
  const financeData = useMemo(
    () => financialSeries(isFarm ? farm.projectedRevenue : trader.margin),
    [isFarm, farm.projectedRevenue, trader.margin],
  );
  const expData = useMemo(() => expirationBuckets(contracts), [contracts]);
  const expiring = isFarm ? farm.expiring90 : trader.expiring90;

  const kpis = isFarm
    ? [
        { to: "geracao-prevista", label: "Geração prevista", value: `${num(farm.forecastMwh, 0)} MWh`, delta: "ciclo atual", icon: Gauge, accent: true },
        { to: "geracao-realizada", label: "Geração realizada", value: `${num(farm.realizedMwh, 0)} MWh`, delta: `${farm.deviationPercent >= 0 ? "+" : ""}${num(farm.deviationPercent)}%`, icon: Activity, negative: farm.deviationPercent < 0 },
        { to: "receita", label: "Receita projetada", value: compactBrl(farm.projectedRevenue), delta: "estimativa", icon: DollarSign },
        { to: "pld", label: `PLD atual (SE/CO)`, value: brl(pld.value), delta: `${pld.delta >= 0 ? "+" : ""}${num(pld.delta)}%`, icon: TrendingUp, negative: pld.delta < 0 },
        { to: "energia-contratada", label: "Energia contratada", value: `${num(farm.contractedMwm)} MWm`, delta: `${brl(farm.avgContractPrice)}/MWh`, icon: Zap },
        { to: "desvio-geracao", label: "Desvio de geração", value: `${farm.deviationPercent >= 0 ? "+" : ""}${num(farm.deviationPercent)}%`, delta: "prevista × realizada", icon: Scale, negative: farm.deviationPercent < 0 },
      ]
    : [
        { to: "energia-contratada", label: "Energia contratada", value: `${num(trader.contractedMwm)} MWm`, delta: `${num(trader.saleMwm)} venda · ${num(trader.purchaseMwm)} compra`, icon: Zap, accent: true },
        { to: "margem", label: "Margem projetada", value: compactBrl(trader.margin), delta: `${num(trader.marginPercent)}% da receita`, icon: DollarSign, negative: trader.margin < 0 },
        { to: "pld", label: "PLD atual (SE/CO)", value: brl(pld.value), delta: `PLD ${brl(pld.value)} (${pld.delta >= 0 ? "+" : ""}${num(pld.delta)}%)`, icon: Activity, negative: pld.delta < 0 },
        { to: "contratos", label: "Contratos a vencer (90d)", value: String(trader.expiring90.length), delta: `${trader.expiring30.length} em 30 dias`, icon: CalendarClock },
      ];

  return (
    <>
      <PageHeader
        title={copy.overviewTitle}
        description={copy.overviewDescription}
        actions={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {copy.badge}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft bg-brand-softer px-2.5 py-1 text-[11px] font-medium text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Ao vivo
            </span>
          </div>
        }
      />

      <section className="mb-6 rounded-2xl border border-brand-soft bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Insights inteligentes</div>
              <div className="text-xs text-muted-foreground">Os 3 insights prioritários gerados para a sua operação.</div>
            </div>
          </div>
          <Link
            to="/app/insights"
            className="inline-flex items-center gap-1 rounded-lg border border-brand-soft bg-brand-softer px-3 py-1.5 text-xs font-semibold text-brand-dark transition-all duration-200 hover:-translate-y-0.5"
          >
            Ver todos os insights <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-4/5" />
                </div>
              ))
            : topInsights.map((i) => (
                <Link
                  key={i.id}
                  to="/app/insights"
                  className={cn(
                    "block rounded-xl border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-soft",
                    levelMeta[i.level].ring,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      levelMeta[i.level].chip,
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", levelMeta[i.level].dot)} />
                      {levelMeta[i.level].label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{i.category}</span>
                  </div>
                  <div className="mt-3 text-sm font-semibold leading-snug">{i.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.body}</p>
                  <p className="mt-2 text-[11px] font-medium text-brand">{i.action}</p>
                </Link>
              ))}
        </div>
      </section>

      <div className={cn("grid gap-4 md:grid-cols-2", isFarm ? "xl:grid-cols-3" : "xl:grid-cols-5")}>
        {loading
          ? Array.from({ length: kpis.length }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-2xl border border-border bg-card shadow-soft" />
            ))
          : kpis.map((k) => <Kpi key={k.to} {...k} />)}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ESTIMATE_NOTE}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {isFarm ? "Geração prevista × realizada" : "Evolução do PLD"}
                <span className="rounded-md bg-brand-softer px-1.5 py-0.5 text-[10px] font-medium text-brand-dark">30 dias</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {isFarm ? "MWh por dia · usinas da empresa" : "Submercado SE/CO · R$/MWh"}
              </div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              {isFarm ? (
                <>
                  <Legend color="#60A5FA" label="Prevista" />
                  <Legend color="#2563EB" label="Realizada" />
                </>
              ) : (
                <Legend color="#2563EB" label="PLD" />
              )}
            </div>
          </div>
          <div className="mt-4 h-72">
            {loading ? (
              <div className="h-full animate-pulse rounded-xl bg-muted/40" />
            ) : (
              <ResponsiveContainer>
                {isFarm ? (
                  <LineChart data={genData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={chartTooltip} />
                    <Line type="monotone" dataKey="prevista" stroke="#60A5FA" strokeWidth={2} dot={false} name="Prevista" />
                    <Line type="monotone" dataKey="realizada" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Realizada" />
                  </LineChart>
                ) : (
                  <AreaChart data={pldData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pldG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number) => brl(v)} contentStyle={chartTooltip} />
                    <Area type="monotone" dataKey="pld" stroke="#2563EB" strokeWidth={2.5} fill="url(#pldG)" name="PLD" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-brand-soft bg-card p-6 shadow-soft">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Leitura do dia</span>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-foreground/90">
            {isFarm ? (
              <>
                A geração realizada está {farm.deviationPercent >= 0 ? "acima" : "abaixo"} da prevista em{" "}
                <b className="text-brand-dark">{num(Math.abs(farm.deviationPercent))}%</b> e o PLD SE/CO está em{" "}
                <b className="text-brand-dark">{brl(pld.value)}</b>. A combinação altera a expectativa de receita do
                próximo ciclo, principalmente na parcela de energia não contratada.
              </>
            ) : (
              <>
                A carteira soma{" "}
                <b className="text-brand-dark">{num(trader.contractedMwm)} MWm</b> contratados e o PLD SE/CO está em{" "}
                <b className="text-brand-dark">{brl(pld.value)}</b>. A variação observada pode alterar a margem
                projetada dos próximos ciclos.
              </>
            )}
          </p>

          <ul className="relative mt-5 space-y-2.5 text-sm">
            {isFarm ? (
              <>
                <Item label="Energia contratada" value={`${num(farm.contractedMwm)} MWm`} tone="positive" />
                <Item label="Excedente estimado" value={`${num(farm.surplusMwh, 0)} MWh`} tone="warning" />
                <Item label="Receita contratada" value={compactBrl(farm.contractedRevenue)} tone="positive" />
              </>
            ) : (
              <>
                <Item label="Preço médio de venda" value={`${brl(trader.avgSalePrice)}/MWh`} tone="positive" />
                <Item label="Margem projetada" value={`${num(trader.marginPercent)}%`} tone={trader.marginPercent < 6 ? "warning" : "positive"} />
                <Item label="Vencimentos em 30d" value={String(trader.expiring30.length)} tone={trader.expiring30.length ? "warning" : "positive"} />
              </>
            )}
          </ul>
          <Link to="/app/monitoramento" className="relative mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            Ver monitoramento completo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              {isFarm ? "Energia contratada por contrato" : "Posição contratada por submercado"}
            </div>
            <span className="text-xs text-muted-foreground">MWm</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={isFarm ? contractedData : positionData}>
                <defs>
                  <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                  <linearGradient id="barG2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltip} />
                {isFarm ? (
                  <Bar dataKey="v" fill="url(#barG)" radius={[8, 8, 0, 0]} name="Contratado" />
                ) : (
                  <>
                    <Bar dataKey="venda" fill="url(#barG)" radius={[8, 8, 0, 0]} name="Venda" />
                    <Bar dataKey="compra" fill="url(#barG2)" radius={[8, 8, 0, 0]} name="Compra" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Contratos a vencer
          </div>
          {expiring.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Nenhum contrato vence nos próximos 90 dias.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {expiring.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-foreground/85">{c.code} · {c.company}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {num(c.volume)} MWm · {c.submarket}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {fmtDate(c.endDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/contratos" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            Ver contratos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              {isFarm ? "Receita projetada por mês" : "Resultado projetado por mês"}
            </div>
            <span className="text-xs text-muted-foreground">Estimativa gerencial · R$</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <AreaChart data={financeData}>
                <defs>
                  <linearGradient id="finG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => compactBrl(v)} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={chartTooltip} />
                <Area type="monotone" dataKey="v" stroke="#1E3A8A" strokeWidth={2.5} fill="url(#finG)" name={isFarm ? "Receita" : "Margem"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Vencimentos por faixa</div>
            <span className="text-xs text-muted-foreground">contratos</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={expData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="v" fill="url(#barG)" radius={[8, 8, 0, 0]} name="Contratos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ to, label, value, delta, icon: Icon, negative, accent }: {
  to: string; label: string; value: string; delta: string; icon: typeof TrendingUp; negative?: boolean; accent?: boolean;
}) {
  return (
    <Link
      to="/app/metricas/$metric"
      params={{ metric: to }}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant",
        accent ? "border-brand-soft" : "border-border",
      )}
    >
      {accent && <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg", accent ? "bg-brand-softer text-brand" : "bg-muted text-muted-foreground")}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      </div>
      <span className={cn(
        "mt-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        negative ? "bg-red-500/10 text-red-600" : "bg-brand/10 text-brand-dark",
      )}>
        {negative ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
        {delta}
      </span>
      <span className="mt-2 block text-[11px] font-medium text-muted-foreground transition group-hover:text-brand">
        Ver detalhes
      </span>
    </Link>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Item({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" | "warning" }) {
  const toneClass = tone === "positive" ? "bg-emerald-500/10 text-emerald-700"
    : tone === "negative" ? "bg-red-500/10 text-red-600"
    : "bg-amber-500/10 text-amber-700";
  return (
    <li className="flex items-center justify-between gap-2 border-b border-border/70 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", toneClass)}>{value}</span>
    </li>
  );
}
