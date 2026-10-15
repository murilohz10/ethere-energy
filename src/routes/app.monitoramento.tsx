import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import { PldInterpretationPanel } from "@/components/ethere/interpretation-panels";
import { HydroSection, ThermalSection } from "@/components/ethere/operational-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoPldRows } from "@/lib/interpretation";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Brush,
  BarChart, Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, RefreshCw, Download, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { brl, downloadFile, toCsv, useContracts, type Submarket } from "@/lib/store";
import {
  useCompanyProfile, traderMetrics, farmMetrics, generationSeries, positionBySubmarket,
  ESTIMATE_NOTE,
} from "@/lib/profile";
import { usePldRows } from "@/lib/api/market";

export const Route = createFileRoute("/app/monitoramento")({
  head: () => ({
    meta: [
      { title: "Monitoramento · Ethere" },
      { name: "description", content: "Acompanhe o PLD por submercado, a posição contratada e a geração da sua operação de energia." },
      { property: "og:title", content: "Monitoramento · Ethere" },
      { property: "og:description", content: "PLD, posição contratada e geração prevista × realizada em um só lugar." },
    ],
  }),
  component: Monitor,
});

const seriesKeys = [
  { key: "seco", label: "SE/CO", color: "#2563EB" },
  { key: "s", label: "S", color: "#1E3A8A" },
  { key: "ne", label: "NE", color: "#60A5FA" },
  { key: "n", label: "N", color: "#93C5FD" },
] as const;

type Row = { d: string; seco: number; s: number; ne: number; n: number };

const chartTooltip = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
  boxShadow: "var(--shadow-elegant)",
} as const;

const buildData = (days: number, seed: number): Row[] => demoPldRows(days, seed);

const periods = [
  { v: "7", l: "Últimos 7 dias" },
  { v: "30", l: "Últimos 30 dias" },
  { v: "60", l: "Últimos 60 dias" },
  { v: "180", l: "Últimos 180 dias" },
];

const num = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });

function Monitor() {
  const [period, setPeriod] = useState("60");
  const [submarket, setSubmarket] = useState<"todos" | Submarket>("todos");
  const [seed, setSeed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const { contracts } = useContracts();
  const { isFarm, copy } = useCompanyProfile();
  const trader = useMemo(() => traderMetrics(contracts, seed), [contracts, seed]);
  const farm = useMemo(() => farmMetrics(contracts, seed), [contracts, seed]);

  const days = Number(period);
  const pld = usePldRows(180);
  const loading = refreshing || pld.isPending;
  // Sem leitura da CCEE (tabela vazia ou sem acesso), a tela mostra a série simulada.
  const real = pld.data?.length ? pld.data : null;
  const data = useMemo<Row[]>(
    () => (real ? real.slice(-days) : buildData(days, seed)),
    [real, days, seed],
  );
  const lastDate = real?.[real.length - 1]?.date;
  // Série completa para comparar com o período anterior (independe do zoom).
  const fullRows = useMemo<Row[]>(() => real ?? buildData(180, seed), [real, seed]);
  const generation = useMemo(
    () => generationSeries(farm.capacityMwm, days, seed),
    [farm.capacityMwm, days, seed],
  );
  const position = useMemo(() => positionBySubmarket(contracts), [contracts]);

  const visible = seriesKeys.filter((s) => {
    if (submarket !== "todos" && s.label !== submarket) return false;
    return !hidden.includes(s.key);
  });

  const viewData = useMemo(() => {
    const size = Math.max(5, Math.round(data.length / zoom));
    return data.slice(data.length - size);
  }, [data, zoom]);

  const refresh = async () => {
    setRefreshing(true);
    const result = await pld.refetch();
    setSeed((s) => s + 3);
    setRefreshing(false);
    if (result.data?.length) {
      toast.success("Dados atualizados", { description: "PLD sincronizado com a última leitura da CCEE." });
    } else {
      toast.error("PLD da CCEE indisponível", { description: "Exibindo a série simulada." });
    }
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

  const profileKpis = isFarm
    ? [
        { l: "Geração prevista (ciclo)", v: `${num(farm.forecastMwh, 0)} MWh` },
        { l: "Geração realizada (ciclo)", v: `${num(farm.realizedMwh, 0)} MWh` },
        { l: "Desvio de geração", v: `${farm.deviationPercent >= 0 ? "+" : ""}${num(farm.deviationPercent)}%`, negative: farm.deviationPercent < 0 },
        { l: "Impacto potencial na receita", v: brl(farm.surplusMwh * farm.pld.value) },
      ]
    : [
        { l: "Posição de venda", v: `${num(trader.saleMwm)} MWm` },
        { l: "Posição de compra", v: `${num(trader.purchaseMwm)} MWm` },
        { l: "Margem projetada (mês)", v: brl(trader.margin), negative: trader.margin < 0 },
        { l: "Contratos a vencer (90d)", v: String(trader.expiring90.length) },
      ];

  return (
    <>
      <PageHeader
        title="Monitoramento"
        description={copy.monitoringDescription}
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

      <Tabs defaultValue="precos">
      <TabsList className="mb-5 h-auto flex-wrap">
        <TabsTrigger value="precos">Preços (PLD)</TabsTrigger>
        <TabsTrigger value="hidrico">Hídrico</TabsTrigger>
        <TabsTrigger value="termico">Térmico</TabsTrigger>
      </TabsList>
      <TabsContent value="precos" className="mt-0">
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="m-4 h-14 animate-pulse rounded-lg bg-muted/40" />)
            : kpis.map((k) => (
                <div key={k.key} className="p-4">
                  <div className="text-[11px] font-medium text-muted-foreground">PLD {k.label}</div>
                  <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{brl(k.value)}</div>
                  <div className={cn("mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium", k.up ? "text-brand" : "text-destructive")}>
                    {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.delta.toFixed(1).replace(".", ",")}% vs. dia anterior
                  </div>
                </div>
              ))}
        </div>
        <div className="grid grid-cols-2 border-t border-border md:grid-cols-4 md:divide-x md:divide-border">
          {profileKpis.map((k) => (
            <div key={k.l} className="p-4">
              <div className="text-[11px] font-medium text-muted-foreground">{k.l}</div>
              <div className={cn("mt-1 text-base font-semibold tabular-nums", k.negative && "text-destructive")}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{ESTIMATE_NOTE}</p>

      {!loading && (
        <PldInterpretationPanel rows={fullRows} simulated={!real} submarket={submarket === "todos" ? "SE/CO" : submarket} />
      )}


      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">Histórico do PLD por submercado</div>
          <div className="flex items-center gap-2">
            {!loading && (
              <span className="rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {lastDate
                  ? `Fonte: CCEE · média diária até ${lastDate.slice(8)}/${lastDate.slice(5, 7)}`
                  : "Dados simulados"}
              </span>
            )}
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
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number, name: string) => [brl(v), name]} contentStyle={chartTooltip} />
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

      {isFarm ? (
        <div className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Geração prevista × realizada</div>
              <span className="text-xs text-muted-foreground">MWh/dia</span>
            </div>
            <div className="mt-4 h-72">
              {loading ? (
                <div className="h-full animate-pulse rounded-xl bg-muted/40" />
              ) : (
                <ResponsiveContainer>
                  <LineChart data={generation}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number, n: string) => [`${num(v)} MWh`, n]} contentStyle={chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="prevista" stroke="#60A5FA" strokeWidth={2} dot={false} name="Prevista" />
                    <Line type="monotone" dataKey="realizada" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Realizada" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Posição contratada por submercado</div>
            <span className="text-xs text-muted-foreground">MWm</span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={position}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number, n: string) => [`${num(v)} MWm`, n]} contentStyle={chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="venda" fill="#2563EB" radius={[8, 8, 0, 0]} name="Venda" />
                <Bar dataKey="compra" fill="#93C5FD" radius={[8, 8, 0, 0]} name="Compra" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Volume de venda e compra dos contratos ativos por submercado.
          </p>
        </div>
      )}
      </TabsContent>
      <TabsContent value="hidrico" className="mt-0 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <HydroSection pldRows={fullRows} pldSimulated={!real} />
      </TabsContent>
      <TabsContent value="termico" className="mt-0 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <ThermalSection pldRows={fullRows} pldSimulated={!real} />
      </TabsContent>
      </Tabs>
    </>
  );
}
