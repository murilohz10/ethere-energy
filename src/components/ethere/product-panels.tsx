/**
 * Painéis reutilizáveis: atenção (Visão Geral), cenários (Central de
 * Inteligência) e estado das fontes de dados (Monitoramento).
 */
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAlerts, useContracts } from "@/lib/store";
import { ESTIMATE_NOTE, farmMetrics, traderMetrics, useCompanyProfile } from "@/lib/profile";
import { scenarioVsMarket } from "@/lib/interpretation";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/* ------------------------------ atenção ---------------------------------- */

export function AttentionPanel() {
  const { contracts } = useContracts();
  const { alerts } = useAlerts();
  const { isFarm } = useCompanyProfile();
  const m = isFarm ? farmMetrics(contracts) : traderMetrics(contracts);
  const highAlerts = alerts.filter((a) => a.enabled && a.priority === "Alta");

  const items = [
    ...m.expiring30.slice(0, 3).map((c) => ({ key: c.id, icon: CalendarClock, text: `Contrato ${c.code} vence em ${new Date(`${c.endDate}T00:00:00`).toLocaleDateString("pt-BR")}`, to: "/app/contratos" as const })),
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
          <CheckCircle2 className="h-4 w-4 text-success" /> Nenhum vencimento em 30 dias ou alerta de alta prioridade.
        </p>
      )}
    </section>
  );
}

/* ------------------------------ cenários --------------------------------- */

export function ScenarioPanel() {
  const { contracts } = useContracts();
  const { isFarm } = useCompanyProfile();
  const [pldShift, setPldShift] = useState(15);
  const [genShift, setGenShift] = useState(0);

  const t = useMemo(() => traderMetrics(contracts), [contracts]);
  const f = useMemo(() => farmMetrics(contracts), [contracts]);
  const pldBase = isFarm ? f.pld.value : t.pld.value;

  const farmRevenue = (shift: number) => {
    const realized = f.realizedMwh * (1 + genShift / 100);
    const pld = f.pld.value * (1 + shift / 100);
    const contracted = Math.min(realized, f.contractedMwh) * f.avgContractPrice;
    const surplusMwh = Math.max(0, realized - f.contractedMwh);
    return { total: contracted + surplusMwh * pld, contracted, surplus: surplusMwh * pld, surplusMwh, pld };
  };

  const scenarios = [
    { key: "down", label: `PLD −${pldShift}%`, shift: -pldShift },
    { key: "base", label: "Referência", shift: 0 },
    { key: "up", label: `PLD +${pldShift}%`, shift: pldShift },
  ].map((s) => {
    if (isFarm) { const r = farmRevenue(s.shift); return { ...s, pld: r.pld, value: r.total, farm: r as ReturnType<typeof farmRevenue> | undefined, rows: undefined as ReturnType<typeof scenarioVsMarket>["rows"] | undefined }; }
    const r = scenarioVsMarket(contracts, pldBase, s.shift);
    return { ...s, pld: r.pld, value: r.total, rows: r.rows as ReturnType<typeof scenarioVsMarket>["rows"] | undefined, farm: undefined as ReturnType<typeof farmRevenue> | undefined };
  });
  const base = scenarios[1];
  const up = scenarios[2];
  const top = !isFarm ? (up.rows ?? []).slice(0, 3) : [];
  const hasData = isFarm ? f.contractedMwm > 0 : (base.rows?.length ?? 0) > 0;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-1 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-brand" />
        <h2 className="text-base font-semibold">Cenários de PLD × carteira</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Simulação</span>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {isFarm
          ? "Variável alterada: PLD (e, opcionalmente, a geração). A parte contratada é valorada ao preço do contrato; o excedente de geração, ao PLD do cenário."
          : "Variável alterada: PLD. Para cada contrato ativo calculamos a diferença mensal entre o preço contratado e o PLD do cenário: venda (preço − PLD), compra (PLD − preço), × volume × 730 h."}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <Control label="Amplitude da variação do PLD" value={pldShift} onChange={setPldShift} min={5} max={40} signed={false} />
        {isFarm && <Control label="Variação da geração" value={genShift} onChange={setGenShift} />}
      </div>

      {!hasData ? (
        <p className="mt-5 text-sm text-muted-foreground">Cadastre contratos ativos com preço e volume para simular o impacto na carteira.</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {scenarios.map((s) => {
              const diff = s.value - base.value;
              return (
                <div key={s.key} className={cn("rounded-xl border p-4", s.key === "base" ? "border-brand-soft bg-brand-softer/40" : "border-border")}>
                  <p className="text-xs font-semibold">{s.label}</p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">PLD R$ {s.pld.toFixed(2).replace(".", ",")}/MWh</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">{brl(s.value)}</p>
                  <p className="text-[11px] text-muted-foreground">{isFarm ? "receita estimada no mês" : "diferença contrato × mercado no mês"}</p>
                  {s.key !== "base" && (
                    <p className={cn("mt-1 text-xs tabular-nums", diff < 0 ? "text-destructive" : "text-success")}>
                      {diff >= 0 ? "+" : ""}{brl(diff)} vs. referência
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">O que mais influencia o resultado</p>
            {isFarm ? (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                No cenário de alta, {brl(up.farm!.contracted)} vêm da energia contratada (não muda com o PLD) e {brl(up.farm!.surplus)} do excedente de {Math.round(up.farm!.surplusMwh).toLocaleString("pt-BR")} MWh valorado ao PLD.
                {up.farm!.surplusMwh === 0 ? " Sem excedente, o PLD não altera a receita estimada." : " Só o excedente é sensível ao PLD."}
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {top.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span><span className="font-medium">{r.code}</span> <span className="text-muted-foreground">· {r.type}</span></span>
                    <span className="tabular-nums">{brl(r.value)}</span>
                  </li>
                ))}
                <li className="pt-1 text-muted-foreground">Contratos de maior volume pesam mais. Com PLD em alta, vendas a preço fixo ficam menos vantajosas frente ao mercado e compras, mais.</li>
              </ul>
            )}
          </div>
        </>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Premissas: PLD de referência SE/CO da plataforma ({brl(pldBase)}/MWh), 730 h/mês, preços fixos dos contratos.
        Impacto estimado no cenário — não é lucro ou prejuízo realizado nem previsão. {ESTIMATE_NOTE}
      </p>
    </section>
  );
}

function Control({ label, value, onChange, min = -30, max = 30, signed = true }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; signed?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="tabular-nums text-muted-foreground">{signed ? (value > 0 ? "+" : "") : "±"}{value}%</span></div>
      <Slider min={min} max={max} step={5} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

export function Box({ label, value, hint, negative }: { label: string; value: string; hint?: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className={cn("text-xs tabular-nums", negative ? "text-destructive" : "text-success")}>{hint}</p>}
    </div>
  );
}
