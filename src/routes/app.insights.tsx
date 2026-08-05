import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ethere/app-shell";
import { useAlerts, useContracts } from "@/lib/store";
import {
  generateInsights, insightCategories, levelMeta, formatInsightDate, relativeDay,
  type InsightCategory, type InsightLevel, type SmartInsight,
} from "@/lib/insights";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Brain, RefreshCw, AlertTriangle, TrendingUp, DollarSign, FileText, CloudSun,
  Activity, LineChart, ShieldAlert, Sparkles, Lightbulb, Clock, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Central de Inteligência · Ethere" },
      { name: "description", content: "Insights inteligentes, prioridades e recomendações estratégicas para sua operação de energia." },
    ],
  }),
  component: InsightsPage,
});

const iconMap: Record<string, typeof Brain> = {
  alert: ShieldAlert,
  trend: TrendingUp,
  money: DollarSign,
  doc: FileText,
  weather: CloudSun,
  market: LineChart,
  activity: Activity,
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function InsightsPage() {
  const { contracts } = useContracts();
  const { alerts } = useAlerts();
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Todos" | InsightCategory>("Todos");

  const snapshot = useMemo(() => generateInsights(contracts, alerts, nonce), [contracts, alerts, nonce]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, [nonce]);

  const visible = snapshot.insights.filter((i) => filter === "Todos" || i.category === filter);

  const refresh = () => {
    setNonce((n) => n + 1);
    toast.success("Insights atualizados", { description: "A análise foi reprocessada com os dados mais recentes." });
  };

  return (
    <>
      <PageHeader
        title="Central de Inteligência"
        description="Análise contínua do seu portfólio, com prioridades e recomendações acionáveis."
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-brand-soft bg-brand-softer px-2.5 py-1 text-[11px] font-medium text-brand-dark sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              Última análise · {formatInsightDate(snapshot.generatedAt)}
            </span>
            <Button onClick={refresh} disabled={loading} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Atualizar insights
            </Button>
          </div>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total de insights" value={String(snapshot.stats.total)} icon={Brain} accent loading={loading} />
        <Stat label="Insights críticos" value={String(snapshot.stats.critical)} icon={AlertTriangle} tone="critical" loading={loading} />
        <Stat label="Oportunidades" value={String(snapshot.stats.opportunities)} icon={TrendingUp} tone="opportunity" loading={loading} />
        <Stat label="Economia potencial" value={brl(snapshot.stats.potentialSavings)} icon={DollarSign} loading={loading} />
        <Stat label="Risco atual" value={`${snapshot.stats.risk.label} · ${snapshot.stats.risk.score}`} icon={ShieldAlert} tone="attention" loading={loading} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["Todos", ...insightCategories] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98]",
                  filter === c
                    ? "border-brand-soft bg-brand-softer text-brand-dark"
                    : "border-border bg-card text-muted-foreground hover:border-brand-soft hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-5/6" />
                  <Skeleton className="mt-5 h-10 w-full" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-semibold">Nenhum insight nesta categoria</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Atualize a análise ou selecione outra categoria.
              </p>
            </div>
          ) : (
            <div key={nonce} className="grid animate-fade-in gap-4 md:grid-cols-2">
              {visible.map((i) => <InsightCard key={i.id} insight={i} />)}
            </div>
          )}

          <section className="mt-6 overflow-hidden rounded-2xl border border-brand-soft bg-card p-6 shadow-soft">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Recomendações estratégicas</h2>
                <p className="text-xs text-muted-foreground">Prioridades sugeridas pela análise desta semana.</p>
              </div>
            </div>
            <ul key={`rec-${nonce}`} className="mt-5 animate-fade-in space-y-2">
              {snapshot.recommendations.map((r, idx) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-soft"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-softer text-[11px] font-semibold text-brand-dark">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-foreground/90">{r.text}</span>
                  <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                    {r.category}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-brand" /> Últimas análises
          </div>
          <ol key={`tl-${nonce}`} className="mt-5 animate-fade-in space-y-5">
            {snapshot.timeline.map((t, idx) => (
              <li key={t.id} className="relative pl-6">
                {idx < snapshot.timeline.length - 1 && (
                  <span className="absolute left-[5px] top-4 h-full w-px bg-border" />
                )}
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand bg-card" />
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {relativeDay(t.when)}
                </div>
                <div className="mt-0.5 text-sm leading-snug text-foreground/90">{t.label}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{t.category}</div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}

function InsightCard({ insight }: { insight: SmartInsight }) {
  const meta = levelMeta[insight.level];
  const Icon = iconMap[insight.icon] ?? Brain;
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card/80 p-5 shadow-soft backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elegant",
        meta.ring,
      )}
    >
      <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5", meta.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-softer text-brand transition-transform duration-200 group-hover:scale-105">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", meta.chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {insight.category}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-semibold leading-snug">{insight.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{insight.body}</p>

      <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">{insight.actionLabel}</div>
        <p className="mt-1 text-xs leading-relaxed text-foreground/90">{insight.action}</p>
      </div>

      {insight.impact && (
        <p className="mt-3 text-[11px] font-medium text-muted-foreground">{insight.impact}</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>Análise · {formatInsightDate(insight.date)}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </article>
  );
}

function Stat({ label, value, icon: Icon, tone, accent, loading }: {
  label: string; value: string; icon: typeof Brain;
  tone?: InsightLevel; accent?: boolean; loading?: boolean;
}) {
  const toneClass = tone ? levelMeta[tone].chip : "bg-brand-softer text-brand border-transparent";
  return (
    <div className={cn(
      "rounded-2xl border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elegant",
      accent ? "border-brand-soft" : "border-border",
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg border", toneClass)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-7 w-24" />
      ) : (
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      )}
    </div>
  );
}
