import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Bell, Plus, AlertTriangle, AlertCircle, Info, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/alertas")({
  head: () => ({ meta: [{ title: "Alertas · Ethere" }] }),
  component: Alerts,
});

const alerts = [
  { t: "PLD SE/CO acima de R$ 220", d: "Há 12 min · Regra: PLD > 220", p: "Alta" },
  { t: "Reservatório SE abaixo de 40%", d: "Há 1h · Regra: Reservatório", p: "Média" },
  { t: "Contrato C-1030 vence em 7 dias", d: "Hoje · Vencimentos", p: "Média" },
  { t: "Nova resolução ANEEL publicada", d: "Ontem · Regulação", p: "Info" },
  { t: "Tendência de queda no PLD S", d: "Ontem · IA", p: "Baixa" },
];

const style: Record<string, { border: string; bg: string; icon: typeof Bell; chip: string }> = {
  Alta: { border: "border-l-red-500", bg: "bg-red-500/10 text-red-600", icon: AlertTriangle, chip: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20" },
  Média: { border: "border-l-amber-500", bg: "bg-amber-500/10 text-amber-700", icon: AlertCircle, chip: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20" },
  Baixa: { border: "border-l-brand", bg: "bg-brand-softer text-brand-dark", icon: TrendingDown, chip: "bg-brand-softer text-brand-dark ring-1 ring-brand/20" },
  Info: { border: "border-l-slate-400", bg: "bg-muted text-muted-foreground", icon: Info, chip: "bg-muted text-muted-foreground ring-1 ring-border" },
};

function Alerts() {
  return (
    <>
      <PageHeader
        title="Alertas"
        description="Central de alertas e regras configuráveis."
        actions={
          <>
            <Button variant="outline" size="sm">Filtros</Button>
            <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              <Plus className="mr-1 h-4 w-4" /> Nova regra
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Ativos", v: 12, tone: "text-foreground", ring: "border-brand-soft" },
          { l: "Alta prioridade", v: 3, tone: "text-red-600", ring: "border-red-500/30" },
          { l: "Média prioridade", v: 5, tone: "text-amber-700", ring: "border-amber-500/30" },
          { l: "Baixa/Info", v: 4, tone: "text-brand-dark", ring: "border-brand-soft" },
        ].map((s) => (
          <div key={s.l} className={cn("rounded-2xl border bg-card p-5 shadow-soft", s.ring)}>
            <div className="text-xs font-medium text-muted-foreground">{s.l}</div>
            <div className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", s.tone)}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {alerts.map((a, i) => {
          const s = style[a.p];
          const Icon = s.icon;
          return (
            <div
              key={a.t}
              className={cn(
                "flex items-start gap-4 border-l-4 p-5 transition hover:bg-brand-softer/40",
                i > 0 && "border-t border-t-border",
                s.border,
              )}
            >
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", s.bg)}>
                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{a.t}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{a.d}</div>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", s.chip)}>
                {a.p}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
