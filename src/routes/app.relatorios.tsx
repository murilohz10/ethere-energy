import { createFileRoute } from "@tanstack/react-router";
import { useCompanyProfile, reportSuggestionsByProfile } from "@/lib/profile";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, FileSpreadsheet, Trash2, Eye, Loader2 } from "lucide-react";
import { buildReportSections } from "@/lib/report-content";
import {
  buildConfiguredReport, defaultReportConfig, indicatorLabels, visualLabels, levelLabels, reportPurposes, pldInPeriod,
  type ReportConfig, type ReportIndicator, type ReportVisual, type ReportLevel,
} from "@/lib/report-builder";
import { demoPldRows, PLD_LABEL, type PldKey } from "@/lib/interpretation";
import { usePldRows } from "@/lib/api/market";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { showPlanLimit } from "@/lib/plan-limit";
import { limitMessages } from "@/lib/billing";
import { useContracts, useReports, usePlan, brl, fmtDate, downloadFile, toCsv, type Report } from "@/lib/store";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [
    { title: "Relatórios · Ethere" },
    { name: "description", content: "Configure, revise e exporte relatórios sobre sua carteira e o mercado de energia." },
    { property: "og:title", content: "Relatórios · Ethere" },
    { property: "og:description", content: "Configure, revise e exporte relatórios sobre sua carteira e o mercado de energia." },
        { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
] }),
  component: Reports,
});

const tipoTone: Record<string, string> = {
  Semanal: "bg-brand-softer text-brand-dark",
  Mensal: "bg-indigo-500/10 text-indigo-700",
  Trimestral: "bg-sky-500/10 text-sky-700",
  Personalizado: "bg-muted text-muted-foreground",
};

const types: Report["type"][] = ["Semanal", "Mensal", "Trimestral", "Personalizado"];

function Reports() {
  const { reports, add, remove } = useReports();
  const { contracts } = useContracts();
  const { kind, isFarm, copy } = useCompanyProfile();
  const planInfo = usePlan();
  const reportLimit = planInfo.plan.limits.reportsPerMonth;
  const suggestions = reportSuggestionsByProfile[kind];
  const [summary, setSummary] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewing, setViewing] = useState<Report | null>(null);
  const [toDelete, setToDelete] = useState<Report | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "Semanal" as Report["type"],
    periodStart: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<ReportConfig>(() => defaultReportConfig(isFarm));
  const [step, setStep] = useState<"config" | "review">("config");
  const pldQuery = usePldRows(180);
  const pldReal = !!pldQuery.data?.length;
  const pld = useMemo(() => ({ rows: pldReal ? pldQuery.data! : demoPldRows(180), real: pldReal }), [pldReal, pldQuery.data]);
  const sectionsFor = (r: Report) =>
    r.config ? buildConfiguredReport({ ...r, config: r.config }, contracts, kind, pld) : buildReportSections(r, contracts, kind);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const openBuilder = (title = "", sum = "") => {
    if (!planInfo.canAddReport) return showPlanLimit(limitMessages.reports(reportLimit ?? 3));
    setErrors({}); setForm((f) => ({ ...f, title })); setSummary(sum); setConfig(defaultReportConfig(isFarm)); setStep("config"); setOpen(true);
  };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Informe o título do relatório.";
    if (!form.periodStart || !form.periodEnd) e.period = "Selecione o período.";
    else if (form.periodEnd < form.periodStart) e.period = "Período final deve ser após o inicial.";
    if (!config.indicators.length) e.indicators = "Selecione ao menos um indicador.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const filtered = useMemo(
    () => (filter === "Todos" ? reports : reports.filter((r) => r.type === filter)),
    [reports, filter],
  );

  const generate = async () => {
    if (!validate()) return toast.error("Verifique os campos obrigatórios.");

    if (!planInfo.canAddReport) return showPlanLimit(limitMessages.reports(reportLimit ?? 3));
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    const ok = add({
      title: form.title,
      type: form.type,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      config,
      summary: summary || (isFarm
        ? "Consolidado de geração, receita estimada, contratos de venda e PLD do período."
        : "Consolidado de carteira, margem projetada, contratos e PLD do período."),
    });
    setGenerating(false);
    if (!ok) return showPlanLimit(limitMessages.reports(reportLimit ?? 3));
    setOpen(false);
    setForm({ ...form, title: "" });
    toast.success("Relatório gerado", { description: form.title });
    const created = reportsAfterAdd();
    if (created) { if (config.format === "csv") exportExcel(created); else setViewing(created); }
  };

  const reportsAfterAdd = () => {
    try { return (JSON.parse(localStorage.getItem("ethere.reports.v2") ?? "{}").items?.[0] ?? null) as Report | null; } catch { return null; }
  };

  const reportRows = (r: Report) =>
    contracts.map((c) => ({
      Relatorio: r.title, Contrato: c.code, Empresa: c.company, Submercado: c.submarket,
      Volume: c.volume, Preco: c.price, Status: c.status,
    }));

  const exportExcel = (r: Report) => {
    const rows: Record<string, string | number>[] = r.config
      ? sectionsFor(r).flatMap((sec) => sec.items.map((i) => ({ Relatorio: r.title, Secao: sec.title, Conteudo: i })))
      : reportRows(r);
    if (r.config?.visuals.includes("tabelaContratos")) rows.push(...reportRows(r).map((x) => ({ Secao: "Contratos", ...x })));
    downloadFile(`${r.title.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(rows), "text/csv;charset=utf-8");
    toast.success("Exportado para Excel", { description: "Arquivo CSV compatível com Excel." });
  };

  const pldAverages = (r: Report) => {
    const rows = pldInPeriod(r, pld.rows, pld.real);
    return (r.config?.submarkets ?? []).map((k) => {
      const v = rows.map((p) => p[k]);
      return { k, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, min: v.length ? Math.min(...v) : null, max: v.length ? Math.max(...v) : null };
    });
  };
  const pldTableHtml = (r: Report) => `<h2 style="font-size:14px;margin:20px 0 6px">PLD no período (R$/MWh)</h2><table><thead><tr><th>Submercado</th><th>Média</th><th>Mínimo</th><th>Máximo</th></tr></thead><tbody>${pldAverages(r).map((x) => `<tr><td>${PLD_LABEL[x.k]}</td><td>${x.avg?.toFixed(2) ?? "—"}</td><td>${x.min?.toFixed(2) ?? "—"}</td><td>${x.max?.toFixed(2) ?? "—"}</td></tr>`).join("")}</tbody></table>`;

  const exportPdf = (r: Report) => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return toast.error("Habilite pop-ups para exportar o PDF.");
    const rows = contracts
      .map((c) => `<tr><td>${c.code}</td><td>${c.company}</td><td>${c.submarket}</td><td>${c.volume} MWm</td><td>${brl(c.price)}</td><td>${c.status}</td></tr>`)
      .join("");
    win.document.write(`<html><head><title>${r.title}</title><style>
      body{font-family:Inter,Arial,sans-serif;padding:40px;color:#0f172a}
      h1{font-size:22px;margin:0 0 4px} .sub{color:#64748b;font-size:12px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#eff6ff;color:#1e3a8a;text-align:left;padding:8px}
      td{border-top:1px solid #e2e8f0;padding:8px}
      </style></head><body>
      <h1>${r.title}</h1>
      <div class="sub">Ethere Energy · Período ${fmtDate(r.periodStart)} a ${fmtDate(r.periodEnd)} · Emitido em ${fmtDate(r.createdAt)}</div>
      <p style="font-size:13px">${r.summary}</p>
      ${sectionsFor(r).map((sec) => `<h2 style="font-size:14px;margin:20px 0 6px">${sec.title}</h2><ul style="font-size:12px;margin:0;padding-left:18px">${sec.items.map((i) => `<li>${i}</li>`).join("")}</ul>`).join("")}
      ${r.config?.visuals.includes("tabelaPld") ? pldTableHtml(r) : ""}
      ${!r.config || r.config.visuals.includes("tabelaContratos") ? `<h2 style="font-size:14px;margin:20px 0 6px">Contratos</h2>
      <table><thead><tr><th>Contrato</th><th>Empresa</th><th>Submercado</th><th>Volume</th><th>Preço</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      ${r.config?.visuals.includes("graficoPld") ? '<p style="font-size:11px;color:#64748b;margin-top:16px">O gráfico do PLD aparece na visualização do relatório na plataforma; a exportação em PDF leva apenas tabelas e textos.</p>' : ""}
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
    toast.success("Relatório exportado em PDF");
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={reportLimit === null ? `${copy.reportsDescription} · Relatórios com análise aprofundada` : `${copy.reportsDescription} · ${planInfo.usage.reportsThisMonth}/${reportLimit} relatórios básicos este mês`}
        actions={
          <Button size="sm" onClick={() => openBuilder()} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            Novo relatório
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => openBuilder(s.title, s.summary)}
            className="rounded-xl border border-border bg-card p-4 text-left shadow-soft transition hover:border-brand-soft"
          >
            <div className="text-sm font-semibold">{s.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.summary}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2 text-xs">
        {["Todos", ...types].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={
              "rounded-full border px-3 py-1.5 font-medium transition " +
              (filter === t ? "border-brand bg-brand text-white" : "border-border text-muted-foreground hover:border-brand-soft hover:text-brand-dark")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-20 text-center shadow-soft">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-softer text-brand">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold">Nenhum relatório encontrado</div>
          <p className="max-w-sm text-xs text-muted-foreground">Gere um relatório para consolidar PLD, contratos e margem do período.</p>
          <Button size="sm" onClick={() => setOpen(true)} className="text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>Gerar relatório</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <div key={r.id} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-elegant">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-softer text-brand transition group-hover:bg-brand group-hover:text-white">
                  <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " + tipoTone[r.type]}>{r.type}</span>
                  <button onClick={() => setToDelete(r)} aria-label="Excluir relatório" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
              </div>
              <div className="mt-1 text-sm font-semibold">{r.title}</div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{r.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewing(r)} className="border-brand-soft text-brand-dark hover:bg-brand-softer">
                  <Eye className="mr-1 h-4 w-4" /> Visualizar
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportPdf(r)}>
                  <FileDown className="mr-1 h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportExcel(r)}>
                  <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{step === "config" ? "Novo relatório · configurar" : "Novo relatório · revisar"}</DialogTitle>
            <DialogDescription>
              {step === "config" ? "Escolha o que entra no relatório. Só o que você selecionar será incluído." : "Confira a configuração antes de gerar."}
            </DialogDescription>
          </DialogHeader>

          {step === "config" ? (
            <div className="grid gap-5 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Relatório Semanal · Semana 13" />
                  {errors.title && <p className="text-xs font-medium text-red-500">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Finalidade</Label>
                  <Select value={config.purpose} onValueChange={(v) => setConfig({ ...config, purpose: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{reportPurposes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Report["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Início do período</Label>
                  <Input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fim do período</Label>
                  <Input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
                </div>
                {errors.period && <p className="text-xs font-medium text-red-500 md:col-span-2">{errors.period}</p>}
              </div>

              <CheckGroup label="Indicadores" options={(Object.keys(indicatorLabels) as ReportIndicator[]).filter((k) => isFarm || k !== "geracao")}
                labels={indicatorLabels} value={config.indicators} onToggle={(v) => setConfig({ ...config, indicators: toggle(config.indicators, v) })} />
              {errors.indicators && <p className="-mt-3 text-xs font-medium text-red-500">{errors.indicators}</p>}
              <CheckGroup label="Gráficos e tabelas" options={Object.keys(visualLabels) as ReportVisual[]}
                labels={visualLabels} value={config.visuals} onToggle={(v) => setConfig({ ...config, visuals: toggle(config.visuals, v) })} />
              <CheckGroup label="Submercados" options={Object.keys(PLD_LABEL) as PldKey[]}
                labels={PLD_LABEL} value={config.submarkets} onToggle={(v) => setConfig({ ...config, submarkets: toggle(config.submarkets, v) })} />

              <div>
                <Label>Nível de detalhamento</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {(Object.keys(levelLabels) as ReportLevel[]).map((l) => (
                    <button key={l} type="button" onClick={() => setConfig({ ...config, level: l })}
                      className={`rounded-xl border p-3 text-left transition ${config.level === l ? "border-brand bg-brand-softer/50" : "border-border hover:border-brand-soft"}`}>
                      <div className="text-sm font-semibold">{levelLabels[l].label}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{levelLabels[l].desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                  <span>Comparar com o período anterior</span>
                  <Switch checked={config.compare} onCheckedChange={(v) => setConfig({ ...config, compare: v })} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                  <span>Incluir interpretação analítica</span>
                  <Switch checked={config.interpretation} onCheckedChange={(v) => setConfig({ ...config, interpretation: v })} />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Formato de saída</Label>
                <Select value={config.format} onValueChange={(v) => setConfig({ ...config, format: v as ReportConfig["format"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF (visualizar e imprimir)</SelectItem>
                    <SelectItem value="csv">Planilha CSV (Excel)</SelectItem>
                  </SelectContent>
                </Select>
                {config.visuals.includes("graficoPld") && (
                  <p className="text-[11px] text-muted-foreground">O gráfico aparece na visualização dentro da plataforma; PDF e CSV levam tabelas e textos.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2 py-2 text-sm">
              {[
                ["Título", form.title],
                ["Finalidade", config.purpose],
                ["Período", `${fmtDate(form.periodStart)} a ${fmtDate(form.periodEnd)}`],
                ["Indicadores", config.indicators.map((i) => indicatorLabels[i]).join(", ") || "—"],
                ["Gráficos e tabelas", config.visuals.map((v) => visualLabels[v]).join(", ") || "Nenhum"],
                ["Submercados", config.submarkets.map((k) => PLD_LABEL[k]).join(", ") || "—"],
                ["Nível", levelLabels[config.level].label],
                ["Comparação com período anterior", config.compare ? "Sim" : "Não"],
                ["Interpretação analítica", config.interpretation ? "Sim" : "Não"],
                ["Formato", config.format === "pdf" ? "PDF" : "CSV"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border py-1.5"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>
              ))}
              {!pldReal && config.indicators.includes("pld") && (
                <p className="mt-2 text-xs text-muted-foreground">O PLD da CCEE não está carregado: o relatório usará a série demonstrativa e dirá isso no texto.</p>
              )}
            </div>
          )}

          <DialogFooter>
            {step === "config" ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => { if (validate()) setStep("review"); }} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>Revisar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setStep("config")}>Voltar</Button>
                <Button onClick={generate} disabled={generating} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                  {generating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando…</> : "Gerar relatório"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              Período {viewing && fmtDate(viewing.periodStart)} – {viewing && fmtDate(viewing.periodEnd)} · Emitido em {viewing && fmtDate(viewing.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{viewing?.summary}</p>
          <span className="w-fit rounded-full bg-brand-softer px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-dark">
            {viewing?.tier === "pro" ? "Análise aprofundada · Pro" : "Relatório informativo"}
          </span>
          {viewing && sectionsFor(viewing).map((sec) => (
            <div key={sec.title} className={"kind" in sec && sec.kind === "interpretation" ? "rounded-xl border border-brand-soft bg-brand-softer/40 p-3" : ""}>
              <div className="text-sm font-semibold">{sec.title}</div>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
                {sec.items.map((i) => <li key={i}>• {i}</li>)}
              </ul>
            </div>
          ))}
          {viewing?.config?.visuals.includes("graficoPld") && (
            <div className="h-56 rounded-xl border border-border p-3">
              <ResponsiveContainer>
                <LineChart data={pldInPeriod(viewing, pld.rows, pld.real)}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="d" fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, background: "var(--card)", border: "1px solid var(--border)" }} />
                  {viewing.config.submarkets.map((k, i) => (
                    <Line key={k} dataKey={k} name={PLD_LABEL[k]} dot={false} strokeWidth={2} stroke={["#2563EB", "#1E3A8A", "#60A5FA", "#93C5FD"][i % 4]} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {viewing?.config?.visuals.includes("tabelaPld") && (
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr><th className="py-1 text-left">Submercado</th><th className="text-right">Média</th><th className="text-right">Mínimo</th><th className="text-right">Máximo</th></tr></thead>
              <tbody>{pldAverages(viewing).map((x) => (
                <tr key={x.k} className="border-t border-border"><td className="py-1.5">{PLD_LABEL[x.k]}</td><td className="text-right tabular-nums">{x.avg != null ? brl(x.avg) : "—"}</td><td className="text-right tabular-nums">{x.min != null ? brl(x.min) : "—"}</td><td className="text-right tabular-nums">{x.max != null ? brl(x.max) : "—"}</td></tr>
              ))}</tbody>
            </table>
          )}
          {(!viewing?.config || viewing.config.visuals.includes("tabelaContratos")) && (
          <div className="mt-2 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-brand-softer/70 text-[10px] uppercase tracking-wider text-brand-dark/80">
                <tr>
                  {["Contrato", "Empresa", "Submercado", "Volume", "Preço", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-2.5 font-semibold text-brand-dark">{c.code}</td>
                    <td className="px-4 py-2.5">{c.company}</td>
                    <td className="px-4 py-2.5">{c.submarket}</td>
                    <td className="px-4 py-2.5 tabular-nums">{c.volume} MWm</td>
                    <td className="px-4 py-2.5 tabular-nums">{brl(c.price)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => viewing && exportExcel(viewing)}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button>
            <Button onClick={() => viewing && exportPdf(viewing)} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              <FileDown className="mr-1 h-4 w-4" /> Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir relatório?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.title} será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => { if (toDelete) { remove(toDelete.id); toast.success("Relatório removido"); } setToDelete(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CheckGroup<T extends string>({ label, options, labels, value, onToggle }: {
  label: string; options: T[]; labels: Record<T, string>; value: T[]; onToggle: (v: T) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-brand-soft">
            <Checkbox checked={value.includes(o)} onCheckedChange={() => onToggle(o)} />
            {labels[o]}
          </label>
        ))}
      </div>
    </div>
  );
}
