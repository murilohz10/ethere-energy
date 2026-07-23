import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Sparkles, TrendingUp, FileText, AlertTriangle, DollarSign } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

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
      <PageHeader title="Visão Geral" description="Resumo operacional e sinais do mercado." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="PLD Atual (SE/CO)" value="R$ 219,42" delta="+4,8%" icon={TrendingUp} />
        <Kpi label="Receita Estimada" value="R$ 12,4M" delta="+2,1%" icon={DollarSign} />
        <Kpi label="Exposição ao Mercado" value="18,2 MWm" delta="-1,4%" icon={TrendingUp} negative />
        <Kpi label="Contratos Ativos" value="128" delta="+3 novos" icon={FileText} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">PLD × Receita — 30 dias</div>
              <div className="text-xs text-muted-foreground">Submercado SE/CO</div>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Legend color="#2563EB" label="PLD" />
              <Legend color="var(--foreground)" label="Receita" />
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pldG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--card)", fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="pld" stroke="#2563EB" strokeWidth={2} fill="url(#pldG)" />
                <Area type="monotone" dataKey="receita" stroke="var(--foreground)" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <span className="text-sm font-medium">Análise diária por IA</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            O PLD SE/CO apresenta tendência de <b>alta moderada</b> nas próximas 48h por redução dos
            reservatórios e temperatura acima da média. Recomendamos <b>revisar exposição em contratos
            flexíveis</b> e considerar hedge parcial em 5–8% do portfólio.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            <IaItem label="Fator hidrológico" value="Negativo" />
            <IaItem label="Fator térmico" value="Positivo" />
            <IaItem label="Risco 7d" value="Moderado" />
          </ul>
          <button className="mt-6 inline-flex text-xs font-medium text-[#2563EB] hover:underline">
            Ver análise completa →
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="text-sm font-medium">Exposição por submercado</div>
          <div className="mt-4 h-56">
            <ResponsiveContainer>
              <BarChart data={exposureData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="v" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" /> Alertas recentes
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { t: "PLD +5% em 24h", p: "Alta", c: "text-destructive" },
              { t: "Reservatório SE < 40%", p: "Média", c: "text-warning" },
              { t: "Contrato Beta vence em 7d", p: "Baixa", c: "text-muted-foreground" },
              { t: "Nova regulação ANEEL", p: "Info", c: "text-muted-foreground" },
            ].map((a) => (
              <li key={a.t} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <span>{a.t}</span>
                <span className={"text-[11px] uppercase tracking-wide " + a.c}>{a.p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, delta, icon: Icon, negative }: {
  label: string; value: string; delta: string; icon: typeof TrendingUp; negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs">{label}</span>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        <span className={"text-xs font-medium " + (negative ? "text-destructive" : "text-[#2563EB]")}>{delta}</span>
      </div>
    </div>
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

function IaItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
