import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

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

function Reports() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Exportações semanais, mensais e trimestrais."
        actions={
          <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            Gerar novo
          </Button>
        }
      />

      <div className="mb-6 flex gap-2 text-xs">
        {["Todos", "Semanal", "Mensal", "Trimestral"].map((t, i) => (
          <button
            key={t}
            className={
              "rounded-full border px-3 py-1.5 " +
              (i === 0 ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.t} className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs text-muted-foreground">{r.tipo} · {r.d}</div>
            <div className="mt-2 text-sm font-medium">{r.t}</div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Consolidado com PLD, exposição, contratos e sinais gerados por IA.
            </p>
            <Button variant="outline" size="sm" className="mt-5">
              <FileDown className="mr-1 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
