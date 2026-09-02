import { createFileRoute } from "@tanstack/react-router";
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
import { useContracts, useReports, brl, fmtDate, downloadFile, toCsv, type Report } from "@/lib/store";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · Ethere" }] }),
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

  const filtered = useMemo(
    () => (filter === "Todos" ? reports : reports.filter((r) => r.type === filter)),
    [reports, filter],
  );

  const generate = async () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Informe o título do relatório.";
    if (!form.periodStart || !form.periodEnd) e.period = "Selecione o período.";
    else if (form.periodEnd < form.periodStart) e.period = "Período final deve ser após o inicial.";
    setErrors(e);
    if (Object.keys(e).length) return toast.error("Verifique os campos obrigatórios.");

    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    add({
      title: form.title,
      type: form.type,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      summary: "Consolidado com PLD, contratos e sinais gerados por IA.",
    });
    setGenerating(false);
    setOpen(false);
    setForm({ ...form, title: "" });
    toast.success("Relatório gerado", { description: form.title });
  };

  const reportRows = (r: Report) =>
    contracts.map((c) => ({
      Relatorio: r.title, Contrato: c.code, Empresa: c.company, Submercado: c.submarket,
      Volume: c.volume, Preco: c.price, Status: c.status,
    }));

  const exportExcel = (r: Report) => {
    downloadFile(`${r.title.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(reportRows(r)), "text/csv;charset=utf-8");
    toast.success("Exportado para Excel", { description: "Arquivo CSV compatível com Excel." });
  };

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
      <table><thead><tr><th>Contrato</th><th>Empresa</th><th>Submercado</th><th>Volume</th><th>Preço</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
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
        description="Exportações semanais, mensais e trimestrais."
        actions={
          <Button size="sm" onClick={() => { setErrors({}); setOpen(true); }} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            Gerar novo
          </Button>
        }
      />

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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar relatório</DialogTitle>
            <DialogDescription>Escolha o tipo e o período que deseja consolidar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Relatório Semanal · Semana 13" />
              {errors.title && <p className="text-xs font-medium text-red-500">{errors.title}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={generate} disabled={generating} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              {generating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando…</> : "Gerar relatório"}
            </Button>
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
