/** Camada de interpretação calculada sobre os dados já exibidos nas páginas. */
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Info, Lightbulb, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contract } from "@/lib/store";
import {
  interpretPld, portfolioAnalysis, contractVsMarket, brlMwh, pct, missingFields, comparableGroups, contractAnalysis,
  PLD_LABEL, type PldKey, type PldPoint,
} from "@/lib/interpretation";

const windows = [
  { v: 1, l: "Diária" },
  { v: 7, l: "Semanal" },
  { v: 30, l: "Mensal" },
] as const;

const patternLabel = { tendencia: "Movimento persistente", pontual: "Variação pontual", estavel: "Estável", indefinido: "Um dia — sem critério de tendência" };

export function PldInterpretationPanel({ rows, simulated, submarket }: { rows: PldPoint[]; simulated: boolean; submarket: string }) {
  const [win, setWin] = useState<number>(7);
  const key = (Object.entries(PLD_LABEL).find(([, l]) => l === submarket)?.[0] ?? "seco") as PldKey;
  const r = useMemo(() => interpretPld(rows, win, key), [rows, win, key]);
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-semibold">Leitura do PLD · {PLD_LABEL[key]}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {simulated ? "Série demonstrativa" : "Dados observados · CCEE"}
          </span>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {windows.map((w) => (
            <button key={w.v} onClick={() => setWin(w.v)} className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition",
              win === w.v ? "bg-brand-softer text-brand-dark" : "text-muted-foreground hover:text-foreground",
            )}>{w.l}</button>
          ))}
        </div>
      </div>

      {!r.ok ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4" />{r.reason}</p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <p className="text-sm leading-relaxed text-foreground/90">{r.summary}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Período: {r.period.from} a {r.period.to} · referência: {r.period.prevFrom} a {r.period.prevTo} · médias diárias em R$/MWh{simulated ? " · série demonstrativa, não são dados da CCEE" : ""}.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/60 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Média atual × anterior</span>
                <Move m={r.movement} />
              </div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{brlMwh(r.current.avg)}</div>
              <div className="text-xs tabular-nums text-muted-foreground">
                antes {brlMwh(r.previous.avg)} · <span className={cn(r.deltaPct > 0 ? "text-brand" : r.deltaPct < 0 && "text-red-500")}>{pct(r.deltaPct)}</span>
              </div>
              <div className="mt-2 text-[11px] font-medium text-muted-foreground">{patternLabel[r.pattern]}</div>
            </div>
          </div>

          {r.observations.length > 0 && (
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {r.observations.map((o) => (
                <li key={o.title} className="border-l border-border pl-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">{o.title}</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">{o.metric}</div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.text}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <button onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-brand hover:underline">
              {open ? "Ocultar detalhes" : "Ver comparação por submercado e critérios"}
            </button>
            <Link to="/app/intelligence" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              Aprofundar no Ethere Intelligence <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {open && (
            <div className="mt-3 animate-fade-in">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1 text-left font-medium">Submercado</th><th className="text-right font-medium">Média</th><th className="text-right font-medium">vs. anterior</th></tr></thead>
                <tbody>
                  {r.submarkets.map((s) => (
                    <tr key={s.key} className="border-t border-border"><td className="py-1.5">{s.label}</td><td className="text-right tabular-nums">{brlMwh(s.avg)}</td><td className="text-right tabular-nums">{pct(s.deltaPct)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Critérios: variações abaixo de 1% são tratadas como estabilidade. "Movimento persistente" exige variação de ao menos 3% e 70% dos dias do período do mesmo lado da média anterior.
                A leitura descreve o comportamento observado; não indica causas nem previsões. O PLD disponível é diário, por isso não há leitura por horário.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Move({ m }: { m: "alta" | "queda" | "estavel" }) {
  const I = m === "alta" ? TrendingUp : m === "queda" ? TrendingDown : Minus;
  return <span className="inline-flex items-center gap-1 font-medium"><I className="h-3.5 w-3.5" />{m === "alta" ? "Alta" : m === "queda" ? "Queda" : "Estável"}</span>;
}

/* ------------------------------ carteira -------------------------------- */

export function PortfolioAnalysisPanel({ contracts, pldAvg, pldPeriod, simulated }: {
  contracts: Contract[];
  pldAvg: Partial<Record<string, number>>;
  pldPeriod: string;
  simulated: boolean;
}) {
  const a = useMemo(() => portfolioAnalysis(contracts), [contracts]);
  const [open, setOpen] = useState(false);
  if (!a.active) {
    return (
      <section className="mb-6 rounded-2xl border border-dashed border-border bg-card/60 p-5 text-sm text-muted-foreground">
        Cadastre contratos ativos para ver a análise da carteira (vencimentos, preços, concentração e comparação com o PLD).
      </section>
    );
  }
  const totalB = a.buckets.reduce((s, b) => s + b.count, 0) || 1;
  const near = a.buckets[0].count + a.buckets[1].count;
  const long = a.buckets[3].count;
  const sentences = [
    `${a.active} contrato(s) ativo(s): ${a.sale.count} de venda (${a.sale.mwm.toFixed(1)} MWm) e ${a.purchase.count} de compra (${a.purchase.mwm.toFixed(1)} MWm).`,
    near
      ? `${near} de ${a.active} (${Math.round((near / a.active) * 100)}%) vence(m) em até 90 dias; ${long} vão além de um ano.`
      : `Nenhum contrato ativo vence em 90 dias; ${long} de ${a.active} vão além de um ano.`,
  ];
  const attention: string[] = [];
  if (a.concentration && a.active > 1) {
    attention.push(a.concentration.share >= 50
      ? `Concentração relevante: ${a.concentration.name} responde por ${a.concentration.share.toFixed(0)}% do volume ativo. Mudanças nessa relação afetam a maior parte da carteira.`
      : `Volume distribuído: a maior contraparte (${a.concentration.name}) tem ${a.concentration.share.toFixed(0)}% do volume ativo.`);
  }
  if (a.sale.avgPrice != null && a.purchase.avgPrice != null) {
    attention.push(`Venda média a ${brlMwh(a.sale.avgPrice)} e compra média a ${brlMwh(a.purchase.avgPrice)}: diferença de ${brlMwh(a.sale.avgPrice - a.purchase.avgPrice)}, sem considerar prazos e submercados distintos.`);
  }
  if (near) attention.push(`${near} vencimento(s) em 90 dias concentram decisões de renovação ou recontratação no curto prazo.`);
  if (a.incomplete.length) attention.push(`${a.incomplete.length} contrato(s) com dados ausentes ficam fora de parte das comparações.`);
  const groups = comparableGroups(contracts);

  const comparisons = contracts
    .filter((c) => c.status === "Ativo")
    .map((c) => ({ c, r: contractVsMarket(c, pldAvg) }));

  return (
    <section className="mb-6 rounded-2xl border border-brand-soft bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Leitura da carteira</h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{sentences.join(" ")}</p>
      {attention.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {attention.map((t) => <li key={t} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />{t}</li>)}
        </ul>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Vencimentos</div>
          <div className="mt-2 space-y-1.5">
            {a.buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground">{b.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${(b.count / totalB) * 100}%` }} /></div>
                <span className="w-5 text-right tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Preços contratados</div>
          <div className="mt-2 space-y-1 text-xs">
            <Row l="Média ponderada · venda" v={a.sale.avgPrice != null ? brlMwh(a.sale.avgPrice) : "—"} />
            <Row l="Média ponderada · compra" v={a.purchase.avgPrice != null ? brlMwh(a.purchase.avgPrice) : "—"} />
            <Row l="Faixa" v={a.price ? `${brlMwh(a.price.min)} – ${brlMwh(a.price.max)}` : "—"} />
          </div>
        </div>
        <div className="rounded-xl border border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Qualidade dos dados</div>
          {a.incomplete.length ? (
            <ul className="mt-2 space-y-1 text-xs">
              {a.incomplete.slice(0, 3).map((c) => (
                <li key={c.id}><span className="font-medium">{c.code}</span> <span className="text-muted-foreground">sem {missingFields(c).join(", ")}</span></li>
              ))}
              {a.incomplete.length > 3 && <li className="text-muted-foreground">+{a.incomplete.length - 3} outro(s)</li>}
            </ul>
          ) : <p className="mt-2 text-xs text-muted-foreground">Todos os contratos ativos têm preço, volume, prazo e contraparte.</p>}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Comparação dentro da carteira · grupos de mesmo tipo e submercado</div>
          <table className="mt-2 w-full min-w-[480px] text-xs">
            <thead className="text-muted-foreground"><tr><th className="py-1 text-left font-medium">Grupo</th><th className="text-right font-medium">Contratos</th><th className="text-right font-medium">Volume</th><th className="text-right font-medium">Preço médio</th><th className="text-right font-medium">Faixa</th><th className="text-right font-medium">Preço semelhante (±5%)</th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.key} className="border-t border-border">
                  <td className="py-1.5">{g.key}</td><td className="text-right tabular-nums">{g.count}</td><td className="text-right tabular-nums">{g.mwm.toFixed(1)} MWm</td>
                  <td className="text-right tabular-nums">{brlMwh(g.avgPrice)}</td>
                  <td className="text-right tabular-nums">{g.count > 1 ? `${brlMwh(g.min)} – ${brlMwh(g.max)}` : "—"}</td>
                  <td className="text-right tabular-nums">{g.count > 1 ? `${g.similar} de ${g.count}` : "sem par"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted-foreground">Só contratos do mesmo tipo e submercado são comparados entre si. Prazos e condições diferentes podem justificar diferenças de preço.</p>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <button onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-brand hover:underline">
          {open ? "Ocultar comparação" : "Comparar preço contratado × PLD médio"}
        </button>
        {open && (
          <div className="mt-3 animate-fade-in overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="text-muted-foreground"><tr>
                <th className="py-1 text-left font-medium">Contrato</th><th className="text-left font-medium">Sub.</th>
                <th className="text-right font-medium">Preço</th><th className="text-right font-medium">PLD médio</th><th className="text-right font-medium">Diferença</th>
              </tr></thead>
              <tbody>
                {comparisons.map(({ c, r }) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-1.5">{c.code} <span className="text-muted-foreground">· {c.type}</span></td>
                    <td>{c.submarket}</td>
                    {r.ok ? (<>
                      <td className="text-right tabular-nums">{brlMwh(r.price)}</td>
                      <td className="text-right tabular-nums">{brlMwh(r.ref)}</td>
                      <td className="text-right tabular-nums" title={`Preço contratado ${r.diff >= 0 ? "acima" : "abaixo"} do PLD médio do período. Indica posição relativa ao mercado de curto prazo, não resultado.`}>{r.diff >= 0 ? "+" : "−"}{brlMwh(Math.abs(r.diff))} ({pct(r.diffPct)})</td>
                    </>) : <td colSpan={3} className="text-right text-muted-foreground">{r.reason}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              O que a diferença representa: quanto o preço contratado está acima (+) ou abaixo (−) da média do PLD no mesmo submercado. Não indica se o contrato é bom ou ruim.
              <br />Referência: média diária do PLD de {pldPeriod}{simulated ? " (série demonstrativa)" : " (CCEE)"}, no mesmo submercado do contrato.
              Limitação: o PLD é preço de curto prazo; contratos bilaterais têm prazo, sazonalização e flexibilidade próprios. A diferença é só um indicativo, não ganho ou perda realizada.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span className="tabular-nums">{v}</span></div>;
}

/* --------------------------- contrato individual ------------------------- */

export function ContractAnalysis({ contract, contracts, pldAvg, pldPeriod }: {
  contract: Contract; contracts: Contract[]; pldAvg: Partial<Record<string, number>>; pldPeriod: string;
}) {
  const a = contractAnalysis(contract, contracts);
  const m = contractVsMarket(contract, pldAvg);
  const fmtD = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");
  return (
    <div className="grid gap-4 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Tipo", contract.type],
          ["Preço", brlMwh(contract.price)],
          ["Volume", `${contract.volume} MWm`],
          ["Submercado", contract.submarket],
          ["Início", fmtD(contract.startDate)],
          ["Término", fmtD(contract.endDate)],
          ["Prazo", `${a.termMonths} meses`],
          ["Contraparte", contract.company || "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border p-2.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div>
            <div className="mt-0.5 truncate font-medium tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-brand-soft bg-brand-softer/40 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Leitura do contrato</div>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-foreground/90">{a.lines.map((l) => <li key={l}>{l}</li>)}</ul>
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Contrato × PLD médio</div>
        {m.ok ? (
          <p className="mt-2 text-xs leading-relaxed">
            Preço {brlMwh(m.price)} frente a PLD médio de {brlMwh(m.ref)} em {contract.submarket} ({pldPeriod}): {m.diff >= 0 ? "+" : "−"}{brlMwh(Math.abs(m.diff))} ({pct(m.diffPct)}).
            <span className="block pt-1 text-muted-foreground">PLD é preço de curto prazo e não é o mesmo produto de um contrato bilateral; a diferença é só uma referência, não ganho ou perda.</span>
          </p>
        ) : <p className="mt-2 text-xs text-muted-foreground">Comparação indisponível: {m.reason}</p>}
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">Condições registradas</div>
        <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{a.conditions ?? "Nenhuma condição registrada nas observações do contrato."}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand">O que falta para uma avaliação mais completa</div>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {a.missing.map((f) => <li key={f}>• {f}</li>)}
          {!a.conditions && <li>• condições contratuais (flexibilidade, sazonalização, reajuste) nas observações</li>}
          {a.missing.length === 0 && a.conditions && <li>Os campos principais estão preenchidos.</li>}
        </ul>
      </div>
    </div>
  );
}
