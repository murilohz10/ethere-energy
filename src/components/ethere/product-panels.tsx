/**
 * Painéis reutilizáveis: atenção (Visão Geral), cenários (Central de
 * Inteligência) e estado das fontes de dados (Monitoramento).
 */
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Database, ListChecks, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAlerts, useContracts, useSession } from "@/lib/store";
import { ESTIMATE_NOTE, farmMetrics, traderMetrics, useCompanyProfile } from "@/lib/profile";
import { isOverdue, useTasks } from "@/lib/api/operations";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/* ------------------------------ atenção ---------------------------------- */

export function AttentionPanel() {
  const { user } = useSession();
  const { contracts } = useContracts();
  const { alerts } = useAlerts();
  const tasks = useTasks(user?.companyId);
  const { isFarm } = useCompanyProfile();
  const m = isFarm ? farmMetrics(contracts) : traderMetrics(contracts);
  const overdue = tasks.items.filter((t) => isOverdue(t));
  const highAlerts = alerts.filter((a) => a.enabled && a.priority === "Alta");

  const items = [
    ...m.expiring30.slice(0, 3).map((c) => ({ key: c.id, icon: CalendarClock, text: `Contrato ${c.code} vence em ${new Date(`${c.endDate}T00:00:00`).toLocaleDateString("pt-BR")}`, to: "/app/contratos" as const })),
    ...overdue.slice(0, 3).map((t) => ({ key: t.id, icon: ListChecks, text: `Tarefa atrasada: ${t.title}`, to: "/app/operacional" as const })),
    ...highAlerts.slice(0, 2).map((a) => ({ key: a.id, icon: AlertTriangle, text: `Alerta de alta prioridade ativo: ${a.name}`, to: "/app/alertas" as const })),
  ];

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Requer atenção</h2>
        <span className="text-xs text-muted-foreground">{items.length ? `${items.length} item(ns)` : "Tudo em dia"}</span>
      </div>
      {items.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {items.map(({ key, icon: Icon, text, to }) => (
            <li key={key}>
              <Link to={to} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted">
                <Icon className="h-4 w-4 shrink-0 text-warning" />
                <span className="truncate">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-success" /> Nenhum vencimento em 30 dias, tarefa atrasada ou alerta crítico.
        </p>
      )}
    </section>
  );
}

/* ------------------------------ cenários --------------------------------- */

export function ScenarioPanel() {
  const { contracts } = useContracts();
  const { isFarm } = useCompanyProfile();
  const [pldShift, setPldShift] = useState(0);
  const [genShift, setGenShift] = useState(0);

  const result = useMemo(() => {
    if (isFarm) {
      const f = farmMetrics(contracts);
      const realized = f.realizedMwh * (1 + genShift / 100);
      const pld = f.pld.value * (1 + pldShift / 100);
      const contracted = Math.min(realized, f.contractedMwh) * f.avgContractPrice;
      const surplus = Math.max(0, realized - f.contractedMwh) * pld;
      return { base: f.projectedRevenue, scenario: contracted + surplus, label: "Receita estimada do mês" };
    }
    const t = traderMetrics(contracts);
    const spread = (pld: number) => (t.avgSalePrice > 0 ? t.avgSalePrice - pld : 0);
    return { base: spread(t.pld.value), scenario: spread(t.pld.value * (1 + pldShift / 100)), label: "Preço médio de venda − PLD (R$/MWh)" };
  }, [contracts, isFarm, pldShift, genShift]);

  const diff = result.scenario - result.base;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-1 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-brand" />
        <h2 className="text-base font-semibold">Cenários</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Estimativa</span>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {isFarm
          ? "Ajuste o PLD e a geração para ver como a receita estimada reage. O excedente de geração é valorado ao PLD do cenário."
          : "Compare o preço médio dos seus contratos de venda com o PLD do cenário. A margem dos contratos com preço fixo não muda; a diferença indica a referência de mercado para novas negociações."}
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-5">
          <Control label="Variação do PLD" value={pldShift} onChange={setPldShift} />
          {isFarm && <Control label="Variação da geração" value={genShift} onChange={setGenShift} />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Box label={`${result.label} · base`} value={brl(result.base)} />
          <Box label="Cenário" value={brl(result.scenario)} hint={`${diff >= 0 ? "+" : ""}${brl(diff)}`} negative={diff < 0} />
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{ESTIMATE_NOTE} Cenários não são previsões.</p>
    </section>
  );
}

function Control({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="tabular-nums text-muted-foreground">{value > 0 ? "+" : ""}{value}%</span></div>
      <Slider min={-30} max={30} step={5} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

function Box({ label, value, hint, negative }: { label: string; value: string; hint?: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className={cn("text-xs tabular-nums", negative ? "text-destructive" : "text-success")}>{hint}</p>}
    </div>
  );
}

/* --------------------------- fontes de dados ----------------------------- */

const sources = [
  { name: "PLD (CCEE)", status: "demo", note: "Série demonstrativa enquanto a importação oficial não está ativa." },
  { name: "Reservatórios e carga (ONS)", status: "demo", note: "Série demonstrativa." },
  { name: "Hidrologia (ANA)", status: "pending", note: "Integração preparada; depende de configuração." },
  { name: "Meteorologia", status: "pending", note: "Integração preparada; depende de fornecedor." },
  { name: "BBCE", status: "pending", note: "Exige acesso licenciado aos dados de negociação." },
  { name: "N5X", status: "pending", note: "Exige acesso licenciado aos dados de negociação." },
  { name: "Contratos e cadastros", status: "live", note: "Dados da sua empresa salvos na plataforma." },
] as const;

const statusMeta = {
  live: { label: "Ativo", icon: CheckCircle2, cls: "text-success" },
  demo: { label: "Demonstração", icon: Database, cls: "text-brand" },
  pending: { label: "Integração pendente", icon: Clock, cls: "text-muted-foreground" },
};

export function DataSourcesPanel() {
  return (
    <details className="group mt-6 rounded-2xl border border-border bg-card px-6 py-4 shadow-soft">
      <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground">
        Transparência · origem e situação dos dados <span className="text-xs group-open:hidden">(mostrar)</span>
      </summary>
      <ul className="mt-3 divide-y divide-border">
        {sources.map((s) => {
          const meta = statusMeta[s.status];
          return (
            <li key={s.name} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.note}</p></div>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", meta.cls)}><meta.icon className="h-3.5 w-3.5" />{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
