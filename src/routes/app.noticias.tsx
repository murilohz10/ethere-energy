import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/noticias")({
  head: () => ({ meta: [{ title: "Notícias · Ethere" }] }),
  component: News,
});

const news = [
  { t: "ONS revisa curva de garantia física para 2025", c: "Mercado", h: "há 2h", d: "Nova metodologia impacta contratos de longo prazo em SE/CO." },
  { t: "ANEEL abre consulta pública sobre GD", c: "Regulação", h: "há 4h", d: "Discussão sobre transição da compensação de energia distribuída." },
  { t: "Reservatórios do SE recuam pela quarta semana", c: "Clima", h: "há 1d", d: "Baixa hidrologia pressiona termelétricas e PLD." },
  { t: "Eólica supera 30% da geração no NE", c: "Energia", h: "há 1d", d: "Recorde histórico de participação renovável no submercado." },
  { t: "CCEE publica boletim mensal", c: "Mercado", h: "há 2d", d: "Volume comercializado cresce 6% frente ao mês anterior." },
  { t: "MME sinaliza novo marco para hidrogênio verde", c: "Regulação", h: "há 3d", d: "Governo prepara decreto e incentivos ao setor." },
];

const cats = ["Todos", "Mercado", "Regulação", "Clima", "Energia"] as const;

function News() {
  const [cat, setCat] = useState<(typeof cats)[number]>("Todos");
  const filtered = cat === "Todos" ? news : news.filter((n) => n.c === cat);
  return (
    <>
      <PageHeader title="Notícias" description="Curadoria automatizada de mercado, regulação, clima e energia." />

      <div className="mb-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              cat === c
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((n) => (
          <article key={n.t} className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-elegant">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>{n.c}</span>
              <span>·</span>
              <span>{n.h}</span>
            </div>
            <h3 className="mt-3 text-base font-medium tracking-tight">{n.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.d}</p>
          </article>
        ))}
      </div>
    </>
  );
}
