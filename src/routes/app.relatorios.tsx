import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";

export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · Ethere" }] }),
  component: Reports,
});

const reports = [
  { t: "Relatório Semanal · Semana 12", d: "18/03/2025", tipo: "Semanal" },
  { t: "Relatório Semanal · Semana 11", d: "11/03/2025", tipo: "Semanal" },
  { t: "Relatório Mensal · Fevereiro", d: "01/03/2025", tipo: "Mensal" },
  { t: "Relatório Mensal · Janeiro", d: "01/02/2025", tipo: "Mensal" },
  { t: "Relatório Trimestral · Q4 2024", d: "10/01/2025", tipo: "Trimestral" },
];

const tipoTone: Record<string, string> = {
  Semanal: "bg-brand-softer text-brand-dark",
  Mensal: "bg-indigo-500/10 text-indigo-700",
  Trimestral: "bg-sky-500/10 text-sky-700",
};

function Reports() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exportações semanais, mensais e trimestrais."
        actions={
          <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            Gerar novo
          </Button>
        }
      />

      <div className="mb-6 flex gap-2 text-xs">
        {["Todos", "Semanal", "Mensal", "Trimestral"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-full border px-3 py-1.5 font-medium transition " +
              (i === 0 ? "border-brand bg-brand text-white" : "border-border text-muted-foreground hover:border-brand-soft hover:text-brand-dark")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.t} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-elegant">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-softer text-brand transition group-hover:bg-brand group-hover:text-white">
                <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider " + tipoTone[r.tipo]}>
                {r.tipo}
              </span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">{r.d}</div>
            <div className="mt-1 text-sm font-semibold">{r.t}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Consolidado com PLD, exposição, contratos e sinais gerados por IA.
            </p>
            <Button variant="outline" size="sm" className="mt-5 border-brand-soft text-brand-dark hover:bg-brand-softer">
              <FileDown className="mr-1 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
