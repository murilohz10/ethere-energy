import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
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

const style: Record<string, string> = {
  Alta: "border-l-destructive",
  Média: "border-l-warning",
  Baixa: "border-l-[#2563EB]",
  Info: "border-l-muted-foreground",
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
            <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
              <Plus className="mr-1 h-4 w-4" /> Nova regra
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "Ativos", v: 12 },
          { l: "Alta prioridade", v: 3 },
          { l: "Média prioridade", v: 5 },
          { l: "Baixa/Info", v: 4 },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs text-muted-foreground">{s.l}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        {alerts.map((a, i) => (
          <div
            key={a.t}
            className={cn(
              "flex items-start gap-4 border-l-2 p-5",
              i > 0 && "border-t border-t-border",
              style[a.p],
            )}
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-surface">
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{a.t}</div>
              <div className="text-xs text-muted-foreground">{a.d}</div>
            </div>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {a.p}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
