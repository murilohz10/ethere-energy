import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowUpRight, Bell, FileText, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = [148, 152, 161, 176, 188, 204, 219, 197, 206, 214, 228, 221];
const HOURS = ["00h", "02h", "04h", "06h", "08h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"];

function useLiveSeries() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2600);
    return () => window.clearInterval(id);
  }, []);
  const data = BASE.map((v, i) => ({
    t: HOURS[i],
    v: Math.round(v + Math.sin((i + tick) / 1.7) * 7 + (i === BASE.length - 1 ? tick % 5 : 0)),
  }));
  return { data, last: data[data.length - 1].v, tick };
}

/** Live product mockup used in the hero — not a static image. */
export function HeroDashboard() {
  const { data, last, tick } = useLiveSeries();
  const delta = (2.4 + ((tick % 6) * 0.3)).toFixed(1);

  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl glass-panel hairline-top">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden>
          <div className="scan-line h-px w-1/3 bg-gradient-to-r from-transparent via-cyan/80 to-transparent" />
        </div>

        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <span className="ml-3 text-xs font-medium text-muted-foreground">ethere.app / visão geral</span>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-brand-dark">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
            ao vivo
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* financial cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="PLD SE/CO" value={`R$ ${last}`} delta={`+${delta}%`} up />
            <MiniStat label="Exposição" value="R$ 1,24M" delta="-0,8%" />
            <MiniStat label="Contratos" value="38" delta="+3" up />
            <MiniStat label="Margem" value="12,4%" delta="+1,1pp" up />
          </div>

          {/* chart */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                PLD horário — hoje
              </div>
              <div className="flex gap-1 text-[11px] text-muted-foreground">
                {["24h", "7d", "30d"].map((r, i) => (
                  <span
                    key={r}
                    className={cn(
                      "rounded-md px-2 py-0.5",
                      i === 0 ? "bg-primary/15 text-brand-dark" : "border border-transparent",
                    )}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="heroPld" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#heroPld)"
                    isAnimationActive
                    animationDuration={1200}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {/* AI analysis */}
            <div className="rounded-xl border border-primary/20 bg-brand-softer/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                <Sparkles className="h-4 w-4" />
                Análise por IA
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Alta de <span className="text-foreground">{delta}%</span> no PLD SE/CO puxada pela carga da tarde.
                Cenário favorável para venda de excedente no curto prazo.
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-cyan" />
              </div>
              <span className="mt-2 block text-[11px] text-muted-foreground">confiança do modelo · 67%</span>
            </div>

            {/* contracts + alerts */}
            <div className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-surface/70 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Contratos por submercado
                </div>
                <div className="h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { s: "SE", v: 18 },
                        { s: "S", v: 9 },
                        { s: "NE", v: 7 },
                        { s: "N", v: 4 },
                      ]}
                    >
                      <XAxis dataKey="s" hide />
                      <YAxis hide />
                      <Bar dataKey="v" radius={3} fill="var(--chart-2)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/5 p-3">
                <Bell className="mt-0.5 h-3.5 w-3.5 text-warning" />
                <div>
                  <p className="text-xs font-medium">Alerta disparado</p>
                  <p className="text-[11px] text-muted-foreground">PLD acima de R$ 210/MWh em SE/CO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating badge */}
      <div className="float-slow absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl glass-soft px-3 py-2 text-xs shadow-elegant sm:flex">
        <TrendingUp className="h-4 w-4 text-success" />
        <span className="text-muted-foreground">
          Economia projetada <span className="text-foreground">R$ 184k</span>
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-success" />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/70 p-3 transition hover:border-primary/30">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div key={value} className="count-up mt-1 text-base font-semibold tabular-nums">
        {value}
      </div>
      <span className={cn("text-[11px] tabular-nums", up ? "text-success" : "text-muted-foreground")}>{delta}</span>
    </div>
  );
}
