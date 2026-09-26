import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown } from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/ethere/marketing-nav";
import { Reveal } from "@/components/ethere/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ethere Energy — Dados de energia transformados em decisões" },
      {
        name: "description",
        content:
          "Mercado, contratos, geração e indicadores financeiros em uma única plataforma de inteligência para comercializadoras e fazendas de energia.",
      },
      { property: "og:title", content: "Ethere Energy — Dados de energia transformados em decisões" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligência para o Mercado Livre de Energia: PLD, contratos, geração, alertas e análises contextualizadas por perfil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <Hero />
      <MarketTape />
      <Mercado />
      <Problema />
      <Conecta />
      <Perfis />
      <Produto />
      <Inteligencia />
      <Dados />
      <Diferencial />
      <Plano />
      <Faq />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}

/* ------------------------------ Primitives ------------------------------ */

function Eyebrow({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {n ? <span className="text-primary">{n}</span> : null}
      {n ? <span className="h-px w-6 bg-border" aria-hidden /> : null}
      {children}
    </p>
  );
}

function SectionShell({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("border-t border-border/70", className)}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">{children}</div>
    </section>
  );
}

function PrimaryCTA({ children = "Conhecer a plataforma" }: { children?: React.ReactNode }) {
  return (
    <Link to="/signup">
      <Button size="lg" className="group h-11 rounded-md px-5 font-medium">
        {children}
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </Link>
  );
}

/** Frame imitating the real Ethere app surface. */
function Frame({
  title,
  path,
  children,
  className,
}: {
  title: string;
  path: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-card text-card-foreground", className)}>
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-3 text-xs font-medium">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">{path}</span>
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, value, unit, delta, tone = "up" }: { label: string; value: string; unit?: string; delta?: string; tone?: "up" | "down" | "flat" }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </p>
      {delta ? (
        <p
          className={cn(
            "mt-0.5 font-mono text-[10px] tabular-nums",
            tone === "up" && "text-success",
            tone === "down" && "text-destructive",
            tone === "flat" && "text-muted-foreground",
          )}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

function Spark({
  points,
  secondary,
  height = 120,
  className,
}: {
  points: number[];
  secondary?: number[];
  height?: number;
  className?: string;
}) {
  const w = 400;
  const all = [...points, ...(secondary ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / (arr.length - 1)) * w;
        const y = height - 8 - ((v - min) / (max - min || 1)) * (height - 16);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const main = toPath(points);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("w-full", className)} style={{ height }}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} className="stroke-border" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      <path d={`${main} L${w},${height} L0,${height} Z`} className="fill-primary/10" />
      {secondary ? (
        <path d={toPath(secondary)} fill="none" className="stroke-muted-foreground" strokeWidth="1.25" strokeDasharray="4 3" />
      ) : null}
      <path d={main} fill="none" className="stroke-primary" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const pldSeries = [212, 218, 209, 226, 241, 236, 252, 247, 263, 271, 258, 266, 284, 279, 291, 287];
const genPlan = [62, 64, 66, 68, 70, 71, 72, 72, 71, 70, 68, 66];
const genReal = [60, 65, 63, 69, 66, 72, 70, 68, 73, 67, 66, 64];

/* --------------------------------- Hero --------------------------------- */

function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-14 lg:grid-cols-12 lg:gap-10 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-5 lg:pt-6">
          <Reveal>
            <Eyebrow>Inteligência para o mercado de energia</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-7 text-[2.5rem] font-medium leading-[1.04] tracking-[-0.035em] sm:text-5xl lg:text-[3.6rem]">
              Dados de energia transformados em <span className="text-primary">decisões.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              A Ethere reúne mercado, contratos, geração e indicadores financeiros em uma única plataforma de
              inteligência para empresas do mercado livre de energia.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <PrimaryCTA />
              <a href="#conecta" className="link-underline inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                Ver como funciona <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <dl className="mt-14 grid max-w-md grid-cols-3 border-t border-border pt-5">
              {[
                ["4", "submercados"],
                ["2", "perfis de operação"],
                ["CCEE · ONS", "fontes públicas"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-sm font-semibold tabular-nums">{v}</dt>
                  <dd className="mt-0.5 text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={140} className="lg:col-span-7">
          <HeroProduct />
        </Reveal>
      </div>
    </section>
  );
}

function HeroProduct() {
  return (
    <Frame title="Visão Geral · Inteligência da sua carteira" path="app.ethere.energy/app">
      <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border sm:grid-cols-4 sm:divide-y-0">
        <Kpi label="Energia contratada" value="18,2" unit="MWm" delta="+0,4 no mês" />
        <Kpi label="PLD SE/CO" value="287,40" unit="R$/MWh" delta="+3,1% 7d" />
        <Kpi label="Margem proj. (est.)" value="12,8" unit="%" delta="−0,6 p.p." tone="down" />
        <Kpi label="Contratos a vencer" value="3" unit="em 90d" delta="1 em 21 dias" tone="flat" />
      </div>
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium">PLD · Sudeste/Centro-Oeste</p>
            <p className="font-mono text-[10px] text-muted-foreground">16 semanas · R$/MWh</p>
          </div>
          <Spark points={pldSeries} height={140} className="mt-3" />
        </div>
        <div className="divide-y divide-border">
          <p className="px-4 py-3 text-xs font-medium">Contratos próximos</p>
          {[
            ["CT-0412", "Suprimento Ômega", "21d"],
            ["CT-0388", "Alfa Comercial", "54d"],
            ["CT-0371", "Delta Energia", "83d"],
          ].map(([id, n, d]) => (
            <div key={id} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <span className="font-mono text-muted-foreground">{id}</span>
              <span className="flex-1 truncate px-3">{n}</span>
              <span className="font-mono tabular-nums text-muted-foreground">{d}</span>
            </div>
          ))}
          <div className="flex items-start gap-3 px-4 py-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
            <div>
              <p className="text-xs font-medium">PLD acima do preço médio da carteira</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Central de Inteligência · há 12 min</p>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ------------------------------ Market tape ----------------------------- */

function MarketTape() {
  const rows = [
    ["SE/CO", "287,40", "+3,1%"],
    ["S", "281,95", "+2,4%"],
    ["NE", "264,10", "−0,8%"],
    ["N", "259,72", "−1,2%"],
    ["EAR SE", "58,4%", "−0,9 p.p."],
    ["Carga SIN", "74,1 GWm", "+1,6%"],
  ];
  return (
    <div className="border-y border-border/70 bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/70 px-6 sm:grid-cols-3 lg:grid-cols-6">
        {rows.map(([k, v, d]) => (
          <div key={k} className="flex items-baseline justify-between gap-2 px-3 py-3 first:pl-0">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
            <span className="text-xs font-medium tabular-nums">{v}</span>
            <span className={cn("font-mono text-[10px] tabular-nums", d.startsWith("−") ? "text-destructive" : "text-success")}>{d}</span>
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-7xl px-6 pb-2 font-mono text-[10px] text-muted-foreground">Valores ilustrativos de demonstração</p>
    </div>
  );
}

/* -------------------------------- Mercado ------------------------------- */

function Mercado() {
  const chain = [
    { k: "Mercado", v: "Preço horário por submercado, variação semanal, hidrologia." },
    { k: "Dados", v: "Séries da CCEE e do ONS, contratos próprios, geração medida." },
    { k: "Complexidade", v: "Fontes, formatos e periodicidades diferentes, sem relação entre si." },
    { k: "Decisão", v: "Comprar, vender, renovar, ajustar volume — com prazo curto." },
  ];
  return (
    <SectionShell id="mercado">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow n="01">O mercado</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            Um mercado que muda de preço a cada hora.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            No mercado livre, o resultado de uma empresa depende de acompanhar ao mesmo tempo preço, contratos e
            operação — e de entender como cada um afeta o outro.
          </p>
        </Reveal>
        <div className="lg:col-span-8">
          <ol className="border-t border-border">
            {chain.map((c, i) => (
              <Reveal as="li" key={c.k} delay={i * 80} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[3rem_12rem_1fr]">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <span className="text-lg font-medium">{c.k}</span>
                <span className="col-start-2 text-sm leading-relaxed text-muted-foreground sm:col-start-auto">{c.v}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </SectionShell>
  );
}

/* -------------------------------- Problema ------------------------------ */

function Problema() {
  const sources = ["CCEE", "ONS", "Contratos", "PLD", "Geração", "Mercado"];
  return (
    <SectionShell className="bg-surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-5">
          <Eyebrow n="02">O problema</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            Informação não falta. <span className="text-muted-foreground">Contexto, sim.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Planilhas, portais e relatórios separados obrigam a equipe a cruzar tudo manualmente antes de cada
            decisão. O tempo gasto consolidando é o tempo que falta para analisar.
          </p>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-7">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <span key={s} className="rounded border border-border px-3 py-1.5 font-mono text-xs">
                  {s}
                </span>
              ))}
            </div>
            {[
              ["Muitas fontes", "6 origens, formatos distintos"],
              ["Análise manual", "cruzamento em planilhas, horas por semana"],
              ["Decisão", "tomada tarde ou com informação parcial"],
            ].map(([t, d], i) => (
              <div key={t}>
                <div className="ml-4 h-8 w-px bg-border" aria-hidden />
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                  <span className={cn("text-base font-medium", i === 2 && "text-destructive")}>{t}</span>
                  <span className="text-right text-xs text-muted-foreground">{d}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* --------------------------------- Conecta ------------------------------ */

function Conecta() {
  const steps = [
    { k: "Dados", v: "PLD, hidrologia, contratos e geração unificados." },
    { k: "Contexto", v: "Cruzados com a carteira e o perfil da empresa." },
    { k: "Impacto", v: "Traduzidos em margem, receita e exposição estimadas." },
    { k: "Decisão", v: "Alertas e leituras que indicam onde agir." },
  ];
  return (
    <SectionShell id="conecta">
      <Reveal>
        <Eyebrow n="03">A Ethere</Eyebrow>
        <h2 className="mt-6 max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
          A Ethere conecta essas informações.
        </h2>
      </Reveal>
      <div className="relative mt-16">
        <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-border lg:block" aria-hidden />
        <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.k} delay={i * 100} className="relative">
              <span className={cn("relative block h-[15px] w-[15px] rounded-full border-2 bg-background", i === 3 ? "border-primary bg-primary" : "border-primary")} />
              <p className="mt-6 font-mono text-[11px] text-muted-foreground">0{i + 1}</p>
              <h3 className="mt-1 text-2xl font-medium tracking-tight">{s.k}</h3>
              <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{s.v}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </SectionShell>
  );
}

/* --------------------------------- Perfis ------------------------------- */

function Perfis() {
  return (
    <SectionShell id="perfis" className="bg-surface">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <Reveal>
          <Eyebrow n="04">Dois perfis</Eyebrow>
          <h2 className="mt-6 max-w-2xl text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            A mesma plataforma. Duas realidades operacionais.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            No cadastro, a empresa informa seu perfil. Indicadores, gráficos, alertas e análises passam a refletir
            a sua operação.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-2">
        <Reveal className="bg-background p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Comercializadoras</p>
          <h3 className="mt-3 text-xl font-medium tracking-tight">Carteira. Contratos. Exposição. Margem.</h3>
          <p className="mt-2 text-sm text-muted-foreground">Mercado → Contratos → Exposição → Margem → Decisão</p>
          <Frame title="Inteligência da sua carteira" path="/app" className="mt-6">
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              <Kpi label="Contratada" value="18,2" unit="MWm" />
              <Kpi label="Exposição (est.)" value="−1,4" unit="MWm" tone="down" delta="sub-contratada" />
              <Kpi label="Margem (est.)" value="12,8" unit="%" delta="−0,6 p.p." tone="down" />
            </div>
            <div className="p-4">
              <p className="text-xs font-medium">Posição contratada × necessidade</p>
              <div className="mt-3 space-y-2">
                {[
                  ["Jan", 92, 100],
                  ["Fev", 88, 100],
                  ["Mar", 96, 100],
                  ["Abr", 81, 100],
                ].map(([m, c]) => (
                  <div key={m as string} className="flex items-center gap-3 text-[11px]">
                    <span className="w-7 font-mono text-muted-foreground">{m}</span>
                    <div className="h-2 flex-1 rounded-sm bg-muted">
                      <div className="h-2 rounded-sm bg-primary" style={{ width: `${c}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono tabular-nums text-muted-foreground">{c}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-border px-4 py-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              <p className="text-xs">Exposição elevada em abril com PLD em alta</p>
            </div>
          </Frame>
        </Reveal>

        <Reveal delay={120} className="bg-background p-6 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Fazendas de energia</p>
          <h3 className="mt-3 text-xl font-medium tracking-tight">Geração. Contratos. Receita. Mercado.</h3>
          <p className="mt-2 text-sm text-muted-foreground">Mercado → Geração → Receita → Contratos → Decisão</p>
          <Frame title="Inteligência da sua geração" path="/app" className="mt-6">
            <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
              <Kpi label="Prevista" value="71,0" unit="MWm" />
              <Kpi label="Realizada" value="67,3" unit="MWm" delta="−5,2% desvio" tone="down" />
              <Kpi label="Receita (est.)" value="4,18" unit="R$ mi" delta="+2,1% mês" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">Geração prevista × realizada</p>
                <span className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-px w-3 bg-primary" />real</span>
                  <span className="flex items-center gap-1"><span className="h-px w-3 border-t border-dashed border-muted-foreground" />prev.</span>
                </span>
              </div>
              <Spark points={genReal} secondary={genPlan} height={96} className="mt-2" />
            </div>
            <div className="flex items-start gap-3 border-t border-border px-4 py-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <p className="text-xs">Geração 5% abaixo do previsto na última semana</p>
            </div>
          </Frame>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* --------------------------------- Produto ------------------------------ */

const modules = [
  { k: "Visão Geral", v: "Indicadores do perfil e leitura do dia." },
  { k: "Central de Inteligência", v: "Análises com contexto e impacto." },
  { k: "Monitoramento", v: "PLD por submercado e histórico." },
  { k: "Contratos", v: "Carteira, volumes, preços e vencimentos." },
  { k: "Alertas", v: "Gatilhos de preço, prazo e operação." },
  { k: "Relatórios", v: "PDF e Excel prontos para compartilhar." },
];

function Produto() {
  return (
    <SectionShell id="produto">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow n="05">Produto</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            Tudo o que importa para acompanhar sua operação, em um único ambiente.
          </h2>
          <ul className="mt-10 border-t border-border">
            {modules.map((m, i) => (
              <li key={m.k} className="group flex items-baseline gap-4 border-b border-border py-3.5">
                <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">{m.k}</p>
                  <p className="text-xs text-muted-foreground">{m.v}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-8">
          <Frame title="Ethere" path="app.ethere.energy/app/monitoramento">
            <div className="grid grid-cols-[9.5rem_1fr]">
              <aside className="hidden border-r border-border bg-sidebar py-3 text-xs sm:block">
                {modules.map((m, i) => (
                  <p
                    key={m.k}
                    className={cn(
                      "mx-2 rounded px-2.5 py-1.5 text-sidebar-foreground",
                      i === 2 && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    {m.k}
                  </p>
                ))}
              </aside>
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <p className="text-sm font-medium">Monitoramento de mercado</p>
                  <div className="flex gap-1 font-mono text-[10px]">
                    {["7D", "30D", "90D", "1A"].map((p, i) => (
                      <span key={p} className={cn("rounded px-2 py-1", i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4">
                  <Kpi label="SE/CO" value="287,40" delta="+3,1%" />
                  <Kpi label="Sul" value="281,95" delta="+2,4%" />
                  <Kpi label="Nordeste" value="264,10" delta="−0,8%" tone="down" />
                  <Kpi label="Norte" value="259,72" delta="−1,2%" tone="down" />
                </div>
                <div className="p-5">
                  <Spark points={pldSeries} height={180} />
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>jun</span><span>jul</span><span>ago</span><span>set</span>
                  </div>
                </div>
              </div>
            </div>
          </Frame>
          <div className="mt-4 grid grid-cols-3 gap-4 font-mono text-[11px] text-muted-foreground">
            <p><span className="text-foreground">↳</span> filtros por submercado e período</p>
            <p><span className="text-foreground">↳</span> exportação PDF · Excel</p>
            <p><span className="text-foreground">↳</span> permissões por função</p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* ------------------------------ Inteligência ---------------------------- */

function Inteligencia() {
  const flow = ["Dado", "Contexto", "Análise", "Impacto", "Decisão"];
  return (
    <SectionShell id="inteligencia" className="bg-surface">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <Eyebrow n="06">Central de Inteligência</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            Não é um chatbot. É leitura de mercado aplicada à sua empresa.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            A IA interpreta movimentos do PLD, contratos e geração à luz do perfil da empresa, e responde três
            perguntas: o que aconteceu, por que importa e qual impacto pode existir.
          </p>
          <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {flow.map((f, i) => (
              <li key={f} className="flex items-center gap-3">
                <span className={cn(i === flow.length - 1 ? "font-medium text-primary" : "text-foreground")}>{f}</span>
                {i < flow.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <Frame title="Central de Inteligência" path="/app/insights">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <span className="rounded border border-destructive/40 px-2 py-0.5 font-mono text-[10px] uppercase text-destructive">Crítico</span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">Exposição · hoje 09:40</span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-medium">PLD do Sudeste subiu 11% em quatro semanas</h3>
              <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                {[
                  ["O que aconteceu", "O preço no SE/CO passou de R$ 258 para R$ 287/MWh com redução do armazenamento."],
                  ["Por que importa", "Sua carteira está 1,4 MWm abaixo da necessidade projetada para abril."],
                  ["Possível impacto", "Margem estimada pode recuar cerca de 0,6 p.p. se o volume for liquidado a PLD."],
                ].map(([k, v]) => (
                  <div key={k} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Estimativa gerencial com base nos dados cadastrados. Não representa liquidação oficial da CCEE.
              </p>
            </div>
          </Frame>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* ---------------------------------- Dados ------------------------------- */

function Dados() {
  const d = [
    ["Mercado", "PLD por submercado e informações de mercado."],
    ["Operação", "Hidrologia, carga e dados operacionais relevantes."],
    ["Contratos", "Volumes, preços, períodos e vencimentos da carteira."],
    ["Geração", "Geração medida e previsão por período."],
  ];
  return (
    <SectionShell>
      <Reveal>
        <Eyebrow n="07">Dados</Eyebrow>
      </Reveal>
      <div className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
        {d.map(([k, v], i) => (
          <Reveal
            key={k}
            delay={i * 80}
            className={cn("border-b border-border py-6 sm:pr-6 lg:border-b-0", i > 0 && "lg:border-l lg:pl-6", i % 2 === 1 && "sm:border-l sm:pl-6 lg:pl-6")}
          >
            <p className="text-xl font-medium tracking-tight">{k}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v}</p>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------- Diferencial ---------------------------- */

function Diferencial() {
  const parts = ["Mercado", "Contratos", "Operação", "Impacto financeiro", "IA"];
  return (
    <section className="border-t border-border/70 bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-60">08 — Diferencial</p>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight text-background sm:text-5xl">
            Não é apenas monitoramento.
            <span className="block opacity-60">É inteligência aplicada à operação.</span>
          </h2>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-5 lg:col-start-8">
          <ul className="border-t border-background/20">
            {parts.map((p, i) => (
              <li key={p} className="flex items-center justify-between border-b border-background/20 py-3.5 text-lg">
                <span>{p}</span>
                <span className="font-mono text-xs opacity-50">{i < parts.length - 1 ? "+" : "="}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-lg font-medium">Uma visão mais clara para decisão.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------- Plano ------------------------------- */

const planItems = [
  "Monitoramento do PLD",
  "Gestão de contratos",
  "Alertas personalizados",
  "Visão geral por perfil",
  "Histórico do mercado",
  "Indicadores financeiros",
  "Análises diárias por IA",
  "Contratos ilimitados",
  "Relatórios PDF e Excel",
  "Suporte",
];

function Plano() {
  return (
    <SectionShell id="plano">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow n="09">Plano</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium leading-tight tracking-tight sm:text-[2.4rem]">
            Um plano. A plataforma inteira.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Sem módulos avulsos. Todos os recursos disponíveis para comercializadoras e fazendas de energia.
          </p>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-8">
          <div className="grid overflow-hidden rounded-lg border border-border md:grid-cols-[1fr_1.3fr]">
            <div className="border-b border-border bg-surface p-8 md:border-b-0 md:border-r">
              <p className="text-sm font-medium">Plano Ethere</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-medium tracking-tight tabular-nums">R$ 799,90</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">14 dias de teste · sem cartão · cancele quando quiser</p>
              <div className="mt-8 flex flex-col gap-3">
                <PrimaryCTA>Começar teste</PrimaryCTA>
                <a href="mailto:contato@ethere.energy" className="link-underline self-start text-sm font-medium">
                  Falar com especialista
                </a>
              </div>
            </div>
            <ul className="grid content-start gap-x-6 p-8 sm:grid-cols-2">
              {planItems.map((i) => (
                <li key={i} className="flex items-center gap-3 border-b border-border py-2.5 text-sm">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* ----------------------------------- FAQ -------------------------------- */

const faq = [
  {
    q: "De onde vêm os dados do PLD?",
    a: "De fontes públicas oficiais do setor, como CCEE e ONS, processadas e organizadas pela Ethere em leitura acionável.",
  },
  {
    q: "A plataforma muda conforme o tipo de empresa?",
    a: "Sim. Comercializadoras acompanham carteira, exposição e margem; fazendas acompanham geração, receita e contratos de venda.",
  },
  {
    q: "Os valores financeiros são oficiais?",
    a: "Não. Margem, receita e exposição são estimativas gerenciais calculadas com os dados cadastrados e não substituem a liquidação da CCEE.",
  },
  { q: "Preciso instalar algo?", a: "Não. A Ethere é 100% web: você cria a conta, cadastra sua empresa e começa a usar em minutos." },
  { q: "Existe limite de contratos?", a: "Não. O Plano Ethere inclui cadastro ilimitado de contratos." },
  {
    q: "Como funcionam os alertas?",
    a: "Você define gatilhos por submercado, faixa de preço, vencimento de contrato ou desvio de geração e recebe a notificação quando o mercado exigir atenção.",
  },
];

function Faq() {
  return (
    <SectionShell className="bg-surface">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <Eyebrow n="10">Dúvidas</Eyebrow>
          <h2 className="mt-6 text-3xl font-medium tracking-tight">Perguntas frequentes</h2>
        </Reveal>
        <Reveal delay={80} className="lg:col-span-8">
          <Accordion type="single" collapsible className="w-full border-t border-border">
            {faq.map((f, i) => (
              <AccordionItem key={f.q} value={`i${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* -------------------------------- Final CTA ----------------------------- */

function FinalCTA() {
  return (
    <SectionShell>
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-8">
          <h2 className="text-3xl font-medium leading-tight tracking-tight sm:text-5xl">Veja a Ethere em funcionamento.</h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Conheça a plataforma e veja como diferentes informações do mercado podem ser reunidas em um único
            ambiente.
          </p>
        </Reveal>
        <Reveal delay={100} className="flex flex-wrap items-center gap-6 lg:col-span-4 lg:justify-end">
          <PrimaryCTA />
          <Link to="/login" className="link-underline text-sm font-medium">
            Já tenho conta
          </Link>
        </Reveal>
      </div>
    </SectionShell>
  );
}
