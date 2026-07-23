import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  Alta: "bg-destructive/10 text-destructive",
  Média: "bg-warning/15 text-warning",
  Baixa: "bg-[#2563EB]/10 text-[#2563EB]",
};

function Contracts() {
  return (
    <>
      <PageHeader
        title="Contratos"
        description="Portfólio consolidado com exposição por contrato."
        actions={
          <Button size="sm" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
            <Plus className="mr-1 h-4 w-4" /> Novo contrato
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {["Contrato", "Cliente", "Submercado", "Volume", "Preço", "Vencimento", "Exposição"].map((h) => (
                <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border transition hover:bg-surface/60">
                <td className="px-6 py-4 font-medium">{r.id}</td>
                <td className="px-6 py-4">{r.cliente}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.sub}</td>
                <td className="px-6 py-4">{r.vol}</td>
                <td className="px-6 py-4">{r.preco}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.venc}</td>
                <td className="px-6 py-4">
                  <span className={"rounded-full px-2.5 py-1 text-[11px] font-medium " + badge[r.exp]}>
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
