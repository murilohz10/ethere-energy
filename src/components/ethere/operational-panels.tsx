/** Seção hídrica do Monitoramento. Só exibem dados carregados — nunca simulam. */
import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import {
  interpretIndicator, seriesForGroup, coMovement, interpretPld,
  type IndicatorSpec, type PldPoint, type Movement,
} from "@/lib/interpretation";
import { DemoHydroSection } from "@/components/ethere/demo-hydro-panels";
import { OPERATIONAL_SERIES, useOperationalSeries, type OperationalPoint } from "@/lib/api/market";

const windows = [
  { v: 7, l: "Semanal" },
  { v: 30, l: "Mensal" },
] as const;

const tooltip = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 } as const;
const fmt = (v: number, d = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Padrão visual dos resumos interpretativos: título, conclusão, 1–2 números, comparação e detalhes. */
export function InsightSummary({
  title, conclusion, metrics, comparison, children, aside,
}: {
  title: string;
  conclusion: string;
  metrics?: { label: string; value: string }[];
  comparison?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
        {aside}
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/90">{conclusion}</p>
      {metrics && metrics.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-[11px] text-muted-foreground">{m.label}</dt>
              <dd className="text-base font-semibold tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {comparison && <p className="mt-2 text-[11px] text-muted-foreground">{comparison}</p>}
      {children && (
        <>
          <button onClick={() => setOpen((o) => !o)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-dark hover:underline">
            {open ? "Ocultar detalhes" : "Ver detalhes"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
          </button>
          {open && <div className="mt-3">{children}</div>}
        </>
      )}
    </div>
  );
}

function EmptyData({ title, text, needs }: { title: string; text: string; needs: string[] }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">{text}</p>
          <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
            {needs.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: readonly { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium transition",
          value === o.v ? "bg-brand-softer text-brand-dark" : "text-muted-foreground hover:text-foreground",
        )}>{o.l}</button>
      ))}
    </div>
  );
}

const pldMovement = (rows: PldPoint[], win: number): Movement | null => {
  const r = interpretPld(rows, win);
  return r.ok ? r.movement : null;
};

function sourceLine(points: OperationalPoint[]) {
  const last = points[points.length - 1];
  const sources = [...new Set(points.map((p) => p.source))].join(", ");
  return last ? `Fonte: ${sources} · última observação ${ddmm(last.date)}` : "";
}

/* --------------------------------- hídrico --------------------------------- */

const EAR: IndicatorSpec = { label: "A energia armazenada", unit: "% EARmax", isPercent: true };

export function HydroSection({ pldRows, pldSimulated }: { pldRows: PldPoint[]; pldSimulated: boolean }) {
  const q = useOperationalSeries(OPERATIONAL_SERIES.reservoir);
  const points = q.data ?? [];
  const [win, setWin] = useState<number>(7);
  const groups = useMemo(() => ["Todos", ...new Set(points.map((p) => p.group))], [points]);
  const [group, setGroup] = useState("Todos");
  const r = useMemo(() => interpretIndicator(points, win, group, EAR), [points, win, group]);
  const chart = useMemo(() => seriesForGroup(points, group, EAR).slice(-win * 2).map((p) => ({ d: ddmm(p.date), v: p.value })), [points, group, win]);
  const pm = pldMovement(pldRows, win);

  if (q.isPending) return <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />;
  if (q.isError) return <EmptyData title="Não foi possível ler os dados hídricos" text="Tente atualizar a página. Os demais indicadores continuam disponíveis." needs={[]} />;
  if (!points.length) return <DemoHydroSection />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-xs">
          {groups.map((g) => <option key={g} value={g}>{g === "Todos" ? "Todos os subsistemas" : g}</option>)}
        </select>
        <Segmented value={win} options={windows} onChange={setWin} />
      </div>
      {!r.ok ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4" />{r.reason}</p>
      ) : (
        <InsightSummary
          title="Leitura hídrica"
          conclusion={r.summary}
          aside={<span className="text-[11px] text-muted-foreground">{sourceLine(points)}</span>}
          metrics={[
            { label: "Média do período", value: `${fmt(r.current.avg)}%` },
            { label: "Variação", value: `${r.deltaAbs >= 0 ? "+" : ""}${fmt(r.deltaAbs)} p.p.` },
          ]}
          comparison={`Período ${r.period.from}–${r.period.to} comparado a ${r.period.prevFrom}–${r.period.prevTo}. Energia armazenada não é nível físico da água nem volume do reservatório.`}
        >
          <div className="space-y-3 text-xs text-muted-foreground">
            {pm && <p><span className="font-medium text-foreground">Observação: </span>{coMovement("a energia armazenada", r.movement, `o PLD SE/CO${pldSimulated ? " (série demonstrativa)" : ""}`, pm)}</p>}
            <p>Mínimo {fmt(r.current.min)}% em {r.current.minDay}; máximo {fmt(r.current.max)}% em {r.current.maxDay}.</p>
            {r.ranking.length > 1 && (
              <table className="w-full max-w-md text-left">
                <thead><tr className="text-[11px]"><th className="py-1 font-medium">Subsistema</th><th className="font-medium">Último</th><th className="font-medium">Variação</th></tr></thead>
                <tbody>{r.ranking.map((x) => (
                  <tr key={x.group} className="border-t border-border tabular-nums"><td className="py-1 text-foreground">{x.group}</td><td>{fmt(x.last)}%</td><td>{x.deltaAbs >= 0 ? "+" : ""}{fmt(x.deltaAbs)} p.p.</td></tr>
                ))}</tbody>
              </table>
            )}
            {r.missing.length > 0 && <p>Para aprofundar: {r.missing.join("; ")}.</p>}
          </div>
        </InsightSummary>
      )}
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={chart}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} unit="%" width={44} />
            <Tooltip formatter={(v: number) => [`${fmt(v)}% EARmax`, "Energia armazenada"]} contentStyle={tooltip} />
            <Line type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
