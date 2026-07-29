import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Brush,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, RefreshCw, Download, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl, downloadFile, toCsv, type Submarket } from "@/lib/store";

export const Route = createFileRoute("/app/monitoramento")({
  head: () => ({ meta: [{ title: "Monitoramento · Ethere" }] }),
  component: Monitor,
});

const seriesKeys = [
  { key: "seco", label: "SE/CO", color: "#2563EB" },
  { key: "s", label: "S", color: "#1E3A8A" },
  { key: "ne", label: "NE", color: "#60A5FA" },
  { key: "n", label: "N", color: "#93C5FD" },
] as const;

type Row = { d: string; seco: number; s: number; ne: number; n: number };

const buildData = (days: number, seed: number): Row[] =>
  Array.from({ length: days }).map((_, i) => ({
    d: `D${i + 1}`,
    seco: +(150 + Math.sin((i + seed) / 4) * 40 + i * 1.1).toFixed(2),
    s: +(140 + Math.cos((i + seed) / 3) * 30 + i * 0.9).toFixed(2),
    ne: +(130 + Math.sin((i + seed) / 5) * 25 + i * 0.8).toFixed(2),
    n: +(120 + Math.cos((i + seed) / 6) * 20 + i * 0.7).toFixed(2),
  }));

const periods = [
  { v: "7", l: "Últimos 7 dias" },
  { v: "30", l: "Últimos 30 dias" },
  { v: "60", l: "Últimos 60 dias" },
  { v: "180", l: "Últimos 180 dias" },
];

function Monitor() {
  const [period, setPeriod] = useState("60");
  const [submarket, setSubmarket] = useState<"todos" | Submarket>("todos");
  const [seed, setSeed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const data = useMemo(() => buildData(Number(period), seed), [period, seed]);

  const visible = seriesKeys.filter((s) => {
    if (submarket !== "todos" && s.label !== submarket) return false;
    return !hidden.includes(s.key);
  });

  const viewData = useMemo(() => {
    const size = Math.max(5, Math.round(data.length / zoom));
    return data.slice(data.length - size);
  }, [data, zoom]);

  const refresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setSeed((s) => s + 3);
    setLoading(false);
    toast.success("Dados atualizados", { description: "Curvas sincronizadas com a última leitura." });
  };

  const exportData = () => {
    downloadFile(`pld-${period}-dias.csv`, toCsv(viewData as unknown as Record<string, string | number>[]), "text/csv;charset=utf-8");
    toast.success("Série exportada em CSV");
  };

  const last = data[data.length - 1];
  const prev = data[data.length - 2] ?? last;

  const kpis = seriesKeys.map((s) => {
    const v = last[s.key];
    const delta = ((v - prev[s.key]) / prev[s.key]) * 100;
    return { ...s, value: v, delta, up: delta >= 0 };
  }).filter((k) => submarket === "todos" || k.label === submarket);

  return (
    <>
      <PageHeader
        title="Monitoramento"
        description="Histórico do PLD e comparação por submercado."
        actions={
          <>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-auto min-w-[160px] rounded-md bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{periods.map((p) => <SelectItem key={p.v} value={p.v} className="text-xs">{p.l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={submarket} onValueChange={(v) => setSubmarket(v as typeof submarket)}>
              <SelectTrigger className="h-9 w-auto min-w-[170px] rounded-md bg-card text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-xs">Todos submercados</SelectItem>
                {seriesKeys.map((s) => <SelectItem key={s.key} value={s.label} className="text-xs">{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} /> Atualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                  <Download className="mr-1 h-4 w-4" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportData}>Exportar CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { window.print(); toast.success("Gráfico enviado para impressão/PDF"); }}>
                  Exportar gráfico (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: kpis.length || 4 }).map((_, i) => (
              <div key={i} className="h-[116px] animate-pulse rounded-2xl border border-border bg-card shadow-soft" />
            ))
          : kpis.map((k) => (
              <div key={k.key} className={cn(
                "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-elegant",
                k.label === "SE/CO" ? "border-brand-soft" : "border-border",
              )}>
                {k.label === "SE/CO" && <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />}
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Submercado {k.label}</div>
                  {k.label === "SE/CO" && <span className="rounded-full bg-brand-softer px-2 py-0.5 text-[10px] font-semibold text-brand-dark">Principal</span>}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{brl(k.value)}</div>
                <div className={cn("mt-1 inline-flex items-center gap-0.5 text-xs font-semibold", k.up ? "text-brand" : "text-red-500")}>
                  {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.delta.toFixed(1).replace(".", ",")}%
                </div>
              </div>
            ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Histórico do PLD por submercado</div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-softer px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
              {periods.find((p) => p.v === period)?.l}
            </span>
            <button onClick={() => setZoom((z) => Math.min(6, z + 1))} aria-label="Aproximar" className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:border-brand-soft hover:text-brand-dark">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(1, z - 1))} aria-label="Afastar" className="rounded-md border border-border p-1.5 text-muted-foreground transition hover:border-brand-soft hover:text-brand-dark">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {seriesKeys.map((s) => {
            const off = hidden.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => setHidden((h) => (off ? h.filter((k) => k !== s.key) : [...h, s.key]))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition",
                  off ? "border-border text-muted-foreground opacity-60" : "border-brand-soft text-brand-dark",
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 h-96">
          {loading ? (
            <div className="h-full animate-pulse rounded-xl bg-muted/40" />
          ) : (
            <ResponsiveContainer>
              <LineChart data={viewData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number, name: string) => [brl(v), name]}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, boxShadow: "var(--shadow-elegant)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {visible.map((s) => (
                  <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={s.key === "seco" ? 2.5 : 2} dot={false} name={s.label} />
                ))}
                <Brush dataKey="d" height={22} travellerWidth={8} stroke="#2563EB" fill="transparent" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
