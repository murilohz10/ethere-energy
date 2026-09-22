import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { useContracts, brl } from "@/lib/store";
import {
  useCompanyProfile, traderMetrics, farmMetrics, ESTIMATE_NOTE, HOURS_PER_MONTH,
} from "@/lib/profile";

export const Route = createFileRoute("/app/metricas/$metric")({
  head: ({ params }) => ({ meta: [{ title: `${titles[params.metric] ?? "Métrica"} · Ethere` }] }),
  component: MetricDetail,
  notFoundComponent: () => (
    <>
      <PageHeader title="Métrica não encontrada" description="O indicador solicitado não existe nesta experiência." />
      <Link to="/app">
        <Button variant="outline" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar à Visão Geral</Button>
      </Link>
    </>
  ),
});

const titles: Record<string, string> = {
  pld: "PLD atual (SE/CO)",
  margem: "Margem projetada",
  exposicao: "Exposição estimada",
  "energia-contratada": "Energia contratada",
  contratos: "Contratos a vencer",
  receita: "Receita projetada",
  "geracao-prevista": "Geração prevista",
  "geracao-realizada": "Geração realizada",
  "desvio-geracao": "Desvio de geração",
  volume: "Volume contratado",
};

type Definition = {
  title: string;
  desc: string;
  unit: string;
  base: number;
  currency?: boolean;
  /** Indicador é estimativa gerencial. */
  estimate?: boolean;
};

const num = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });

function MetricDetail() {
  const { metric } = Route.useParams();
  const { contracts } = useContracts();
  const { isFarm } = useCompanyProfile();

  const trader = useMemo(() => traderMetrics(contracts), [contracts]);
  const farm = useMemo(() => farmMetrics(contracts), [contracts]);

  const defs: Record<string, Definition> = {
    pld: {
      title: "PLD atual (SE/CO)",
      desc: isFarm
        ? "Histórico do preço de liquidação das diferenças e impacto potencial sobre a receita da geração."
        : "Histórico do preço de liquidação das diferenças e impacto sobre a posição da carteira.",
      unit: "R$/MWh",
      base: (isFarm ? farm.pld : trader.pld).value,
      currency: true,
    },
    contratos: {
      title: "Contratos a vencer",
      desc: "Contratos em aberto com vencimento nos próximos 90 dias.",
      unit: "contratos",
      base: Math.max(1, (isFarm ? farm.expiring90 : trader.expiring90).length),
    },
    "energia-contratada": {
      title: "Energia contratada",
      desc: isFarm
        ? "Energia vendida em contratos ativos e receita contratada associada."
        : "Volume contratado de compra e venda na carteira ativa.",
      unit: "MWm",
      base: Math.max(0.1, isFarm ? farm.contractedMwm : trader.contractedMwm),
    },
    volume: {
      title: "Volume contratado",
      desc: "Volume contratado por submercado e prazo.",
      unit: "MWm",
      base: Math.max(0.1, trader.contractedMwm),
    },
    ...(isFarm
      ? {
          receita: {
            title: "Receita projetada",
            desc: "Receita contratada somada ao excedente de geração valorado ao PLD.",
            unit: "R$",
            base: Math.max(1, farm.projectedRevenue),
            currency: true,
            estimate: true,
          },
          "geracao-prevista": {
            title: "Geração prevista",
            desc: "Previsão de geração do ciclo com base na capacidade de referência.",
            unit: "MWh",
            base: Math.max(1, farm.forecastMwh),
            estimate: true,
          },
          "geracao-realizada": {
            title: "Geração realizada",
            desc: "Geração medida no ciclo e comparação com a previsão.",
            unit: "MWh",
            base: Math.max(1, farm.realizedMwh),
            estimate: true,
          },
          "desvio-geracao": {
            title: "Desvio de geração",
            desc: "Diferença percentual entre geração prevista e realizada.",
            unit: "%",
            base: Math.max(0.1, Math.abs(farm.deviationPercent)),
            estimate: true,
          },
        }
      : {
          margem: {
            title: "Margem projetada",
            desc: "Receita de venda menos custo de compra dos contratos ativos.",
            unit: "R$",
            base: Math.max(1, Math.abs(trader.margin)),
            currency: true,
            estimate: true,
          },
          exposicao: {
            title: "Exposição estimada",
            desc: "Diferença entre energia vendida e comprada nos contratos ativos.",
            unit: "MWm",
            base: Math.max(0.1, Math.abs(trader.netPositionMwm)),
            estimate: true,
          },
          receita: {
            title: "Receita estimada",
            desc: "Receita projetada dos contratos de venda ativos.",
            unit: "R$",
            base: Math.max(1, trader.revenue),
            currency: true,
            estimate: true,
          },
        }),
  };

  const info = defs[metric];
  if (!info) throw notFound();

  const data = Array.from({ length: 30 }).map((_, i) => ({
    d: `${i + 1}`,
    v: +(info.base * (0.9 + Math.sin(i / 4) * 0.06 + i * 0.003)).toFixed(2),
  }));

  const fmt = (v: number) => (info.currency ? brl(v) : `${num(v)} ${info.unit}`);

  const related = isFarm ? contracts.filter((c) => c.type === "Venda") : contracts;

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
          { l: "Valor atual", v: fmt(info.base) },
          { l: "Média 30 dias", v: fmt(data.reduce((s, d) => s + d.v, 0) / data.length) },
          { l: "Máxima 30 dias", v: fmt(Math.max(...data.map((d) => d.v))) },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs font-medium text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
          </div>
        ))}
      </div>

      {info.estimate && <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ESTIMATE_NOTE}</p>}

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
              <Tooltip
                formatter={(v: number) => [fmt(v), info.title]}
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2.5} fill="url(#metricG)" name={info.unit} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border px-6 py-4 text-sm font-semibold">
          {isFarm ? "Contratos de venda relacionados" : "Contratos relacionados"}
        </div>
        {related.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-muted-foreground">
            Nenhum contrato cadastrado para relacionar a este indicador.
          </div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {related.slice(0, 5).map((c) => (
                <tr key={c.id} className="border-t border-border first:border-0">
                  <td className="px-6 py-3 font-semibold text-brand-dark">{c.code}</td>
                  <td className="px-6 py-3">{c.company}</td>
                  <td className="px-6 py-3 text-muted-foreground">{c.submarket}</td>
                  <td className="px-6 py-3 tabular-nums">{brl(c.price)}</td>
                  <td className="px-6 py-3 tabular-nums text-muted-foreground">
                    {num(c.volume)} MWm · {brl(c.volume * c.price * HOURS_PER_MONTH)}/mês
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
