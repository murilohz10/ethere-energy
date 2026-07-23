import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/contratos")({
  head: () => ({ meta: [{ title: "Contratos · Ethere" }] }),
  component: Contracts,
});

const rows = [
  { id: "C-1042", cliente: "Alfa Indústria", sub: "SE/CO", vol: "12,0 MWm", preco: "R$ 198,50", venc: "12/2026", exp: "Baixa" },
  { id: "C-1039", cliente: "Beta Química", sub: "S", vol: "8,4 MWm", preco: "R$ 205,10", venc: "07/2026", exp: "Média" },
  { id: "C-1035", cliente: "Gama Papel", sub: "SE/CO", vol: "5,2 MWm", preco: "R$ 189,90", venc: "03/2027", exp: "Baixa" },
  { id: "C-1030", cliente: "Delta Cimento", sub: "NE", vol: "14,7 MWm", preco: "R$ 179,00", venc: "11/2025", exp: "Alta" },
  { id: "C-1026", cliente: "Ômega Metais", sub: "SE/CO", vol: "9,1 MWm", preco: "R$ 210,40", venc: "05/2027", exp: "Média" },
  { id: "C-1021", cliente: "Sigma Alimentos", sub: "S", vol: "3,8 MWm", preco: "R$ 195,00", venc: "01/2026", exp: "Baixa" },
];

const badge: Record<string, string> = {
  Alta: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20",
  Média: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
  Baixa: "bg-brand-softer text-brand-dark ring-1 ring-brand/20",
};

const subTone: Record<string, string> = {
  "SE/CO": "bg-brand/10 text-brand-dark",
  "S": "bg-sky-500/10 text-sky-700",
  "NE": "bg-indigo-500/10 text-indigo-700",
  "N": "bg-slate-500/10 text-slate-700",
};

function Contracts() {
  return (
    <>
      <PageHeader
        title="Contratos"
        description="Portfólio consolidado com exposição por contrato."
        actions={
          <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            <Plus className="mr-1 h-4 w-4" /> Novo contrato
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input className="w-56 bg-transparent placeholder:text-muted-foreground focus:outline-none" placeholder="Buscar por cliente ou ID…" />
        </div>
        {["Todos", "SE/CO", "S", "NE", "N"].map((f, i) => (
          <button key={f} className={
            "rounded-full border px-3 py-1 text-xs transition " +
            (i === 0 ? "border-brand bg-brand text-white" : "border-border text-muted-foreground hover:border-brand-soft hover:text-brand-dark")
          }>{f}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-brand-softer/70 text-[11px] uppercase tracking-wider text-brand-dark/80">
            <tr>
              {["Contrato", "Cliente", "Submercado", "Volume", "Preço", "Vencimento", "Exposição"].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border transition hover:bg-brand-softer/40">
                <td className="px-6 py-4 font-semibold text-brand-dark">{r.id}</td>
                <td className="px-6 py-4 font-medium">{r.cliente}</td>
                <td className="px-6 py-4">
                  <span className={"rounded-md px-2 py-0.5 text-[11px] font-semibold " + subTone[r.sub]}>{r.sub}</span>
                </td>
                <td className="px-6 py-4 tabular-nums">{r.vol}</td>
                <td className="px-6 py-4 tabular-nums">{r.preco}</td>
                <td className="px-6 py-4 text-muted-foreground tabular-nums">{r.venc}</td>
                <td className="px-6 py-4">
                  <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold " + badge[r.exp]}>
                    {r.exp}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
