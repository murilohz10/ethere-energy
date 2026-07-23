import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";

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
            <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">Exportar</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "SE/CO", v: "R$ 219,42", d: "+4,8%" },
          { l: "S", v: "R$ 201,10", d: "+2,1%" },
          { l: "NE", v: "R$ 188,30", d: "-1,2%" },
          { l: "N", v: "R$ 175,88", d: "+0,4%" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">Submercado {k.l}</div>
            <div className="mt-2 text-xl font-semibold tracking-tight">{k.v}</div>
            <div className="text-xs text-[#2563EB]">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-medium">Histórico do PLD por submercado</div>
        <div className="mt-4 h-96">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="seco" stroke="#2563EB" strokeWidth={2} dot={false} name="SE/CO" />
              <Line type="monotone" dataKey="s" stroke="var(--foreground)" strokeWidth={1.5} dot={false} name="S" />
              <Line type="monotone" dataKey="ne" stroke="var(--muted-foreground)" strokeWidth={1.5} dot={false} name="NE" />
              <Line type="monotone" dataKey="n" stroke="var(--warning)" strokeWidth={1.5} dot={false} name="N" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function Filter({ label }: { label: string }) {
  return (
    <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
      {label}
    </button>
  );
}
