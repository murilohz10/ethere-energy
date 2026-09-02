import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowLeft } from "lucide-react";
import { useContracts, brl } from "@/lib/store";

export const Route = createFileRoute("/app/metricas/$metric")({
  head: ({ params }) => ({ meta: [{ title: `${metrics[params.metric]?.title ?? "Métrica"} · Ethere` }] }),
  component: MetricDetail,
});

const metrics: Record<string, { title: string; desc: string; unit: string; base: number }> = {
  pld: { title: "PLD Atual (SE/CO)", desc: "Histórico e composição do preço de liquidação das diferenças.", unit: "R$/MWh", base: 219.42 },
  receita: { title: "Receita Estimada", desc: "Histórico de receita projetada com base no portfólio contratado.", unit: "R$ mil", base: 12400 },
  volume: { title: "Volume Contratado", desc: "Análise do volume contratado por submercado e prazo.", unit: "MWm", base: 18.2 },
  contratos: { title: "Contratos Ativos", desc: "Evolução da carteira de contratos ativos.", unit: "contratos", base: 128 },
};

function MetricDetail() {
  const { metric } = Route.useParams();
  const info = metrics[metric];
  const { contracts } = useContracts();
  if (!info) throw notFound();

  const data = Array.from({ length: 30 }).map((_, i) => ({
    d: `${i + 1}`,
    v: +(info.base * (0.9 + Math.sin(i / 4) * 0.06 + i * 0.003)).toFixed(2),
  }));

  return (
    <>
      <PageHeader
        title={info.title}
        description={info.desc}
        actions={
          <Link to="/app">
            <Button variant="outline" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { l: "Valor atual", v: metric === "pld" ? brl(info.base) : `${info.base.toLocaleString("pt-BR")} ${info.unit}` },
          { l: "Média 30 dias", v: `${(data.reduce((s, d) => s + d.v, 0) / data.length).toFixed(2)} ${info.unit}` },
          { l: "Máxima 30 dias", v: `${Math.max(...data.map((d) => d.v)).toFixed(2)} ${info.unit}` },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs font-medium text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="text-sm font-semibold">Histórico de 30 dias</div>
        <div className="mt-4 h-80">
          <ResponsiveContainer>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="metricG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
              <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2.5} fill="url(#metricG)" name={info.unit} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-6 py-4 text-sm font-semibold">Contratos relacionados</div>
        <table className="w-full text-sm">
          <tbody>
            {contracts.slice(0, 5).map((c) => (
              <tr key={c.id} className="border-t border-border first:border-0">
                <td className="px-6 py-3 font-semibold text-brand-dark">{c.code}</td>
                <td className="px-6 py-3">{c.company}</td>
                <td className="px-6 py-3 text-muted-foreground">{c.submarket}</td>
                <td className="px-6 py-3 tabular-nums">{brl(c.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
