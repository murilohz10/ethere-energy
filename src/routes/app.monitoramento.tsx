import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/monitoramento")({
  head: () => ({ meta: [{ title: "Monitoramento · Ethere" }] }),
  component: Monitor,
});

const data = Array.from({ length: 60 }).map((_, i) => ({
  d: `D${i + 1}`,
  seco: 150 + Math.sin(i / 4) * 40 + i * 1.1,
  s: 140 + Math.cos(i / 3) * 30 + i * 0.9,
  ne: 130 + Math.sin(i / 5) * 25 + i * 0.8,
  n: 120 + Math.cos(i / 6) * 20 + i * 0.7,
}));

function Monitor() {
  return (
    <>
      <PageHeader
        title="Monitoramento"
        description="Histórico do PLD e comparação por submercado."
        actions={
          <>
            <Filter label="Últimos 60 dias" />
            <Filter label="Todos submercados" />
            <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>Exportar</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "SE/CO", v: "R$ 219,42", d: "+4,8%", up: true, accent: true },
          { l: "S", v: "R$ 201,10", d: "+2,1%", up: true },
          { l: "NE", v: "R$ 188,30", d: "-1,2%", up: false },
          { l: "N", v: "R$ 175,88", d: "+0,4%", up: true },
        ].map((k) => (
          <div key={k.l} className={cn(
            "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-elegant",
            k.accent ? "border-brand-soft" : "border-border",
          )}>
            {k.accent && <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />}
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Submercado {k.l}</div>
              {k.accent && <span className="rounded-full bg-brand-softer px-2 py-0.5 text-[10px] font-semibold text-brand-dark">Principal</span>}
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
            <div className={cn(
              "mt-1 inline-flex items-center gap-0.5 text-xs font-semibold",
              k.up ? "text-brand" : "text-red-600",
            )}>
              {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {k.d}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Histórico do PLD por submercado</div>
          <span className="rounded-md bg-brand-softer px-2 py-0.5 text-[10px] font-semibold text-brand-dark">60 dias</span>
        </div>
        <div className="mt-4 h-96">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-elegant)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="seco" stroke="#2563EB" strokeWidth={2.5} dot={false} name="SE/CO" />
              <Line type="monotone" dataKey="s" stroke="#1E3A8A" strokeWidth={2} dot={false} name="S" />
              <Line type="monotone" dataKey="ne" stroke="#60A5FA" strokeWidth={2} dot={false} name="NE" />
              <Line type="monotone" dataKey="n" stroke="#93C5FD" strokeWidth={2} dot={false} name="N" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function Filter({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brand-soft hover:bg-brand-softer hover:text-brand-dark">
      {label}
    </button>
  );
}
