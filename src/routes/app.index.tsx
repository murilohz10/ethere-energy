import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Sparkles, TrendingUp, TrendingDown, FileText, AlertTriangle, DollarSign, Activity, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { buildInsights, useAlerts, useContracts, useSession } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";


export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Visão Geral · Ethere" }] }),
  component: Overview,
});

const series = Array.from({ length: 30 }).map((_, i) => ({
  d: `${i + 1}`,
  pld: 150 + Math.sin(i / 3) * 30 + i * 1.4,
  receita: 400 + Math.cos(i / 4) * 80 + i * 3,
}));

const exposureData = [
  { m: "SE/CO", v: 62 },
  { m: "S", v: 24 },
  { m: "NE", v: 10 },
  { m: "N", v: 4 },
];

function Overview() {
  return (
    <>
      <PageHeader
        title="Visão Geral"
        description="Resumo operacional e sinais do mercado em tempo real."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft bg-brand-softer px-2.5 py-1 text-[11px] font-medium text-brand-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Ao vivo
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi to="pld" label="PLD Atual (SE/CO)" value="R$ 219,42" delta="+4,8%" icon={Activity} accent />
        <Kpi to="receita" label="Receita Estimada" value="R$ 12,4M" delta="+2,1%" icon={DollarSign} />
        <Kpi to="exposicao" label="Exposição ao Mercado" value="18,2 MWm" delta="-1,4%" icon={TrendingUp} negative />
        <Kpi to="contratos" label="Contratos Ativos" value="128" delta="+3 novos" icon={FileText} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                PLD × Receita
                <span className="rounded-md bg-brand-softer px-1.5 py-0.5 text-[10px] font-medium text-brand-dark">30 dias</span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">Submercado SE/CO</div>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <Legend color="#2563EB" label="PLD" />
              <Legend color="#1E3A8A" label="Receita" />
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pldG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, border: "1px solid var(--border)",
                    background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-elegant)",
                  }}
                />
                <Area type="monotone" dataKey="pld" stroke="#2563EB" strokeWidth={2.5} fill="url(#pldG)" />
                <Area type="monotone" dataKey="receita" stroke="#1E3A8A" strokeWidth={2} fill="url(#recG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-brand-soft bg-card p-6 shadow-soft">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-2xl" />
          <div className="relative flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Análise diária por IA</span>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-foreground/90">
            O PLD SE/CO apresenta tendência de <b className="text-brand-dark">alta moderada</b> nas próximas 48h por redução dos
            reservatórios e temperatura acima da média. Recomendamos <b className="text-brand-dark">revisar exposição em contratos
            flexíveis</b> e considerar hedge parcial em 5–8% do portfólio.
          </p>
          <ul className="relative mt-5 space-y-2.5 text-sm">
            <IaItem label="Fator hidrológico" value="Negativo" tone="negative" />
            <IaItem label="Fator térmico" value="Positivo" tone="positive" />
            <IaItem label="Risco 7d" value="Moderado" tone="warning" />
          </ul>
          <Link to="/app/monitoramento" className="relative mt-6 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            Ver análise completa <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Exposição por submercado</div>
            <span className="text-xs text-muted-foreground">MWm</span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={exposureData}>
                <defs>
                  <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-elegant)" }} />
                <Bar dataKey="v" fill="url(#barG)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas recentes
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { t: "PLD +5% em 24h", p: "Alta", tone: "bg-red-500/10 text-red-600" },
              { t: "Reservatório SE < 40%", p: "Média", tone: "bg-amber-500/10 text-amber-700" },
              { t: "Contrato Beta vence em 7d", p: "Baixa", tone: "bg-brand-softer text-brand-dark" },
              { t: "Nova regulação ANEEL", p: "Info", tone: "bg-muted text-muted-foreground" },
            ].map((a) => (
              <li key={a.t} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <span className="text-foreground/85">{a.t}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", a.tone)}>{a.p}</span>
              </li>
            ))}
          </ul>
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
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
          negative ? "bg-red-500/10 text-red-600" : "bg-brand/10 text-brand-dark",
        )}>
          {negative ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
          {delta}
        </span>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition group-hover:text-brand">
        Ver detalhes <ArrowUpRight className="h-3 w-3" />
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

function IaItem({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" | "warning" }) {
  const toneClass = tone === "positive" ? "bg-emerald-500/10 text-emerald-700"
    : tone === "negative" ? "bg-red-500/10 text-red-600"
    : "bg-amber-500/10 text-amber-700";
  return (
    <li className="flex items-center justify-between border-b border-border/70 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", toneClass)}>{value}</span>
    </li>
  );
}
