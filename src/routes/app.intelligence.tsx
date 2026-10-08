import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { IntelligenceChat } from "@/components/ethere/intelligence-chat";

export const Route = createFileRoute("/app/intelligence")({
  head: () => ({
    meta: [
      { title: "Ethere Intelligence · Ethere" },
      { name: "description", content: "Pergunte sobre o mercado de energia e os dados da sua empresa, com fontes." },
      { property: "og:title", content: "Ethere Intelligence · Ethere" },
      { property: "og:description", content: "Assistente de interpretação de dados do Mercado Livre de Energia." },
    ],
  }),
  component: IntelligencePage,
});

function IntelligencePage() {
  return (
    <>
      <PageHeader
        title="Ethere Intelligence"
        description="Informação, explicação e contexto sobre o mercado e a sua operação, com as fontes de cada dado."
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <IntelligenceChat variant="page" />
      </div>
    </>
  );
}
