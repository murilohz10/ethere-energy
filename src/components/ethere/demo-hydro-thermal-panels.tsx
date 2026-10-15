/** Demonstração hídrica e térmica do Monitoramento — usada só enquanto não há dados reais carregados. */
import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { InsightSummary } from "@/components/ethere/operational-panels";
import {
  DEMO_LABEL, SUBSYSTEMS, SUBSYSTEM_NAMES, demoData, ddmm, firstLast, periodCompare, lastN, scheduledVsVerified,
  missingDays, RULES, sumSeries, type Subsystem, type Change,
} from "@/lib/demo-hydro-thermal";

const tooltip = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 } as const;
const f = (v: number, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const s = (v: number, d = 1) => `${v >= 0 ? "+" : ""}${f(v, d)}`;
const verb = (c: Change) => (c.trend === "estável" ? "ficou estável" : c.trend === "alta" ? "subiu" : "caiu");
const periods = [{ v: 7, l: "7 dias" }, { v: 3, l: "Últimos 3 dias" }] as const;

export function DemoBadge() {
  return <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{DEMO_LABEL} · sintéticos, não ONS/ANA</span>;
}

function Pills<T extends string | number>({ value, options, onChange }: { value: T; options: readonly { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition",
          value === o.v ? "bg-brand-softer text-brand-dark" : "text-muted-foreground hover:text-foreground")}>{o.l}</button>
      ))}
    </div>
  );
}

function Controls<T extends string>({ sub, setSub, n, setN, subOptions }: { sub: T; setSub: (v: T) => void; n: number; setN: (v: number) => void; subOptions: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <select value={sub} onChange={(e) => setSub(e.target.value as T)} className="h-8 rounded-md border border-border bg-card px-2 text-xs">
        {subOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <div className="flex items-center gap-3"><DemoBadge /><Pills value={n} options={periods} onChange={setN} /></div>
    </div>
  );
}

const cmpText = (c: ReturnType<typeof periodCompare>, unit: string, d = 1) =>
  c ? `Média ${ddmm(c.curFrom)}–${ddmm(c.curTo)}: ${f(c.current, d)} ${unit}, frente a ${f(c.previous, d)} ${unit} em ${ddmm(c.prevFrom)}–${ddmm(c.prevTo)} (${s(c.deltaAbs, d)} ${unit}${c.deltaPct != null ? `; ${s(c.deltaPct)}%` : ""}).`
    : "Comparação com o período anterior indisponível: a série demonstrativa tem só 7 dias. Escolha \"Últimos 3 dias\" para comparar com os 3 anteriores.";

function SmallLine({ data, unit, d = 1, name }: { data: { d: string; v: number | null }[]; unit: string; d?: number; name: string }) {
  return (
    <div className="h-40">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={56} domain={["auto", "auto"]} />
          <Tooltip formatter={(v: number) => [`${f(v, d)} ${unit}`, name]} contentStyle={tooltip} />
          <Line type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------------- hidrologia --------------------------------- */

export function DemoHydroSection() {
  const [sub, setSub] = useState<Subsystem>("SE/CO");
  const [n, setN] = useState(7);
  const ear = useMemo(() => lastN(demoData.storedEnergyPct[sub], n), [sub, n]);
  const ena = useMemo(() => lastN(demoData.enaMwmed[sub], n), [sub, n]);
  const c = firstLast(ear, RULES.storage);
  const e = firstLast(ena, RULES.ena);
  const pc = n < 7 ? periodCompare(demoData.storedEnergyPct[sub], n) : null;
  const enaMiss = missingDays(ena);
  const reservoirs = demoData.reservoirs;
  const station = demoData.station;

  const conclusion = c
    ? `A energia armazenada do ${SUBSYSTEM_NAMES[sub]} ${verb(c)} de ${f(c.first)}% para ${f(c.last)}% da EARmax entre ${ddmm(c.from)} e ${ddmm(c.to)}: ${s(c.deltaAbs)} p.p.${c.deltaPct != null ? ` (${s(c.deltaPct)}% relativo)` : ""}.` +
      (e ? ` No mesmo intervalo, a energia natural afluente ${e.trend === "estável" ? "ficou estável" : e.trend === "alta" ? "aumentou" : "diminuiu"} ${s(e.deltaPct ?? 0)}% (${f(e.first, 0)} → ${f(e.last, 0)} MWmed).` : "") +
      " Os dados não indicam a causa do movimento."
    : "Série insuficiente para calcular a variação.";

  return (
    <div className="space-y-6">
      <Controls sub={sub} setSub={setSub} n={n} setN={setN} subOptions={SUBSYSTEMS.map((x) => ({ v: x, l: SUBSYSTEM_NAMES[x] }))} />
      <InsightSummary
        title="Leitura hídrica"
        conclusion={conclusion}
        metrics={c ? [
          { label: "Armazenamento (último)", value: `${f(c.last)}% EARmax` },
          { label: "Variação", value: `${s(c.deltaAbs)} p.p.` },
          ...(e ? [{ label: "ENA (último)", value: `${f(e.last, 0)} MWmed` }] : []),
        ] : []}
        comparison={cmpText(pc, "% EARmax")}
      >
        <div className="space-y-3 text-xs text-muted-foreground">
          <p>Critérios: armazenamento estável se a variação for menor que 0,5 p.p.; ENA estável se menor que 2%. Variação = último − primeiro registro do período.</p>
          <table className="w-full max-w-lg text-left">
            <thead><tr className="text-[11px]"><th className="py-1 font-medium">Subsistema</th><th className="font-medium">EAR último</th><th className="font-medium">Δ EAR</th><th className="font-medium">Δ ENA</th></tr></thead>
            <tbody>{SUBSYSTEMS.map((x) => {
              const a = firstLast(lastN(demoData.storedEnergyPct[x], n), RULES.storage);
              const b = firstLast(lastN(demoData.enaMwmed[x], n), RULES.ena);
              return <tr key={x} className="border-t border-border tabular-nums"><td className="py-1 text-foreground">{SUBSYSTEM_NAMES[x]}</td><td>{a ? `${f(a.last)}%` : "—"}</td><td>{a ? `${s(a.deltaAbs)} p.p.` : "—"}</td><td>{b?.deltaPct != null ? `${s(b.deltaPct)}%` : "—"}</td></tr>;
            })}</tbody>
          </table>
          {enaMiss.length > 0 && <p>ENA sem registro em {enaMiss.map(ddmm).join(", ")}; o dia foi ignorado no cálculo.</p>}
          <p>Energia armazenada (% EARmax), nível físico (m) e vazão (m³/s) são grandezas diferentes e aparecem em gráficos separados.</p>
        </div>
      </InsightSummary>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium">Energia armazenada · % EARmax</div>
          <SmallLine data={ear.map((p) => ({ d: ddmm(p.date), v: p.value }))} unit="% EARmax" name="Energia armazenada" />
        </div>
        <div>
          <div className="mb-1 text-xs font-medium">Energia natural afluente · MWmed</div>
          <SmallLine data={ena.map((p) => ({ d: ddmm(p.date), v: p.value }))} unit="MWmed" d={0} name="ENA" />
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reservatórios demonstrativos</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-[11px] text-muted-foreground"><tr><th className="py-1 font-medium">Reservatório (fictício)</th><th className="font-medium">Nível (m)</th><th className="font-medium">Δ nível</th><th className="font-medium">Armaz. útil</th><th className="font-medium">Δ útil</th><th className="font-medium">Leitura</th></tr></thead>
            <tbody>{reservoirs.map((r) => {
              const l = firstLast(lastN(r.levelM, n), RULES.level), u = firstLast(lastN(r.usefulPct, n), RULES.storage);
              return (
                <tr key={r.name} className="border-t border-border tabular-nums">
                  <td className="py-1.5">{r.name} <span className="text-muted-foreground">· {r.subsystem}</span></td>
                  <td>{l ? f(l.last, 2) : "—"}</td><td>{l ? `${s(l.deltaAbs, 2)} m` : "—"}</td>
                  <td>{u ? `${f(u.last)}%` : "—"}</td><td>{u ? `${s(u.deltaAbs)} p.p.` : "—"}</td>
                  <td className="text-muted-foreground">{u ? (u.trend === "estável" ? "Estável" : u.trend === "alta" ? "Em alta" : "Em queda") : "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estação hidrológica demonstrativa</h3>
        {station.map((st) => (
          <div key={st.name} className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-sm">
            <span className="text-xs text-muted-foreground">{st.name} · {st.river} (fictícios) · {ddmm(st.date)}</span>
            <span><span className="text-[11px] text-muted-foreground">Nível do rio </span><b className="tabular-nums">{f(st.levelM, 2)} m</b></span>
            <span><span className="text-[11px] text-muted-foreground">Vazão </span><b className="tabular-nums">{f(st.flowM3s, 0)} m³/s</b></span>
          </div>
        ))}
        {station.length < 2 && <p className="mt-2 text-[11px] text-muted-foreground">Há apenas uma observação: ainda não existe série suficiente para calcular tendência.</p>}
      </div>
    </div>
  );
}

/* --------------------------------- térmica --------------------------------- */

type ThermalSub = Subsystem | "Todos";

export function DemoThermalSection() {
  const [sub, setSub] = useState<ThermalSub>("Todos");
  const [n, setN] = useState(7);
  const { sched, ver } = useMemo(() => {
    const pick = (src: Record<Subsystem, typeof demoData.thermal.scheduled["S"]>) => sub === "Todos" ? sumSeries(SUBSYSTEMS.map((x) => src[x])) : src[sub];
    return { sched: lastN(pick(demoData.thermal.scheduled), n), ver: lastN(pick(demoData.thermal.verified), n) };
  }, [sub, n]);
  const fullVer = sub === "Todos" ? sumSeries(SUBSYSTEMS.map((x) => demoData.thermal.verified[x])) : demoData.thermal.verified[sub];
  const cmp = scheduledVsVerified(sched, ver);
  const cv = firstLast(ver, RULES.thermal);
  const cs = firstLast(sched, RULES.thermal);
  const pc = n < 7 ? periodCompare(fullVer, n) : null;
  const chart = ver.map((p, i) => ({ d: ddmm(p.date), verificada: p.value, programada: sched[i]?.value ?? null, diff: p.value != null && sched[i]?.value != null ? p.value - sched[i].value! : null }));
  const label = sub === "Todos" ? "do SIN (soma dos subsistemas)" : `do ${SUBSYSTEM_NAMES[sub]}`;

  const conclusion = cv && cmp
    ? `A geração térmica verificada ${label} ${cv.trend === "estável" ? "ficou estável" : cv.trend === "alta" ? "subiu" : "caiu"} ${s(cv.deltaPct ?? 0)}% entre ${ddmm(cv.from)} e ${ddmm(cv.to)} (${f(cv.first, 0)} → ${f(cv.last, 0)} MWmed)` +
      `${cs ? `; a programada variou ${s(cs.deltaPct ?? 0)}%` : ""}. Em média, a verificada ficou ${f(Math.abs(cmp.avgDiff), 0)} MWmed ${cmp.avgDiff >= 0 ? "acima" : "abaixo"} da programada${cmp.diffPct != null ? ` (${s(cmp.diffPct)}%)` : ""}, ` +
      `com ${cmp.daysAbove} dia(s) acima e ${cmp.daysBelow} abaixo. A maior diferença foi em ${ddmm(cmp.largest.date)} (${s(cmp.largest.diff, 0)} MWmed). Os dados não informam o motivo do despacho.`
    : "Série insuficiente para comparar.";

  return (
    <div className="space-y-6">
      <Controls sub={sub} setSub={setSub} n={n} setN={setN} subOptions={[{ v: "Todos" as ThermalSub, l: "Todos (soma)" }, ...SUBSYSTEMS.map((x) => ({ v: x as ThermalSub, l: SUBSYSTEM_NAMES[x] }))]} />
      <InsightSummary
        title="Leitura térmica"
        conclusion={conclusion}
        metrics={cmp ? [
          { label: "Média verificada", value: `${f(cmp.avgVerified, 0)} MWmed` },
          { label: "Média programada", value: `${f(cmp.avgScheduled, 0)} MWmed` },
          { label: "Verificada − programada", value: `${s(cmp.avgDiff, 0)} MWmed${cmp.diffPct != null ? ` (${s(cmp.diffPct)}%)` : ""}` },
        ] : []}
        comparison={cmpText(pc, "MWmed (verificada)", 0)}
      >
        <div className="space-y-3 text-xs text-muted-foreground">
          <p><b className="text-foreground">Programada</b> é o despacho previsto; <b className="text-foreground">verificada</b> é o que foi gerado. Diferença = verificada − programada, só nos dias com as duas séries. Estável se a variação for menor que 2%.</p>
          <div className="h-36">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Tooltip formatter={(v: number) => [`${s(v, 0)} MWmed`, "Verificada − programada"]} contentStyle={tooltip} />
                <Bar dataKey="diff" fill="var(--brand)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </InsightSummary>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={chart}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={56} domain={["auto", "auto"]} />
            <Tooltip formatter={(v: number, nm: string) => [`${f(v, 0)} MWmed`, nm]} contentStyle={tooltip} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="verificada" name="Verificada (MWmed)" stroke="var(--brand)" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="programada" name="Programada (MWmed)" stroke="var(--muted-foreground)" strokeDasharray="4 3" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
