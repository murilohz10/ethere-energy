import { PLAN_LIST } from "@/lib/billing";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  Compass,
  Eye,
  FileText,
  Gauge,
  LineChart as LineIcon,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wind,
  Zap,
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/ethere/marketing-nav";
import { HeroDashboard } from "@/components/ethere/hero-dashboard";
import { TechBackdrop } from "@/components/ethere/tech-backdrop";
import { Reveal } from "@/components/ethere/reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ethere Energy — Inteligência aplicada ao mercado de energia" },
      {
        name: "description",
        content:
          "A Ethere conecta PLD, hidrologia, geração térmica e contratos para interpretar movimentos do mercado e mostrar impactos estimados no seu negócio.",
      },
      { property: "og:title", content: "Ethere Energy — Dados são o começo. Inteligência transforma decisões." },
      {
        property: "og:description",
        content:
          "Contexto, interpretação e cenários para comercializadoras e geradoras do mercado livre de energia.",
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
      <Metrics />
      <Contrast />
      <HowItWorks />
      <Features />
      <Intelligence />
      <Differentials />
      <Audience />
      <Pricing />
      <Institutional />
      <Faq />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}

/* ------------------------------- Hero ------------------------------- */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <TechBackdrop />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:pb-28 lg:pt-24">
        <div>
          <Reveal variant="up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-brand-dark">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
              Inteligência aplicada ao mercado de energia
            </span>
          </Reveal>

          <Reveal variant="up" delay={80}>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Dados de energia são o começo.{" "}
              <span className="text-gradient-cyan">Inteligência é o que transforma decisões.</span>
            </h1>
          </Reveal>

          <Reveal variant="up" delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A Ethere conecta informações do mercado elétrico, interpreta seus movimentos e traduz dados complexos
              em análises, cenários e impactos relevantes para o seu negócio.
            </p>
          </Reveal>

          <Reveal variant="up" delay={240}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="sm:w-auto">
                <Button
                  size="lg"
                  className="group w-full text-primary-foreground shadow-blue hover:opacity-95 sm:w-auto"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  Conhecer a plataforma
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#solucao" className="sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-primary/25 bg-surface/60 backdrop-blur hover:border-primary/50 hover:bg-surface sm:w-auto"
                >
                  Como funciona
                </Button>
              </a>
            </div>
          </Reveal>

          <Reveal variant="up" delay={320}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
              {["Demonstrações identificadas", "Setup em minutos", "Sem cartão de crédito"].map((i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {i}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal variant="right" delay={140}>
          <HeroDashboard />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------- Indicador × Interpretação --------------------- */

const layers = [
  {
    label: "Indicador isolado",
    q: "O que está acontecendo?",
    text: "PLD médio do Sudeste: alta de 10% na semana (R$ 100 → R$ 110/MWh).",
  },
  {
    label: "Interpretação da Ethere",
    q: "Por que isso importa?",
    text: "A alta foi persistente (5 de 7 dias no mesmo sentido) e ocorreu junto a uma queda de 2,3 p.p. na energia armazenada e geração térmica acima do programado. Movimentos simultâneos, que a plataforma relaciona — sem afirmar causa.",
  },
  {
    label: "Impacto para o negócio",
    q: "Como isso pode afetar meu negócio?",
    text: "Nos cenários da Central de Inteligência, você vê o impacto estimado de PLD −10% / +10% sobre a carteira cadastrada e quais contratos mais contribuem para o resultado.",
  },
];

function Metrics() {
  return (
    <section id="demonstracao" className="relative border-y border-border/60 bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">A lógica do produto</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Consultar um número é diferente de entender o que ele significa
          </h2>
          <p className="mt-3 text-xs text-muted-foreground">Exemplo com dados demonstrativos — não são valores oficiais da CCEE, ONS ou ANA.</p>
        </Reveal>
        <div className="relative mt-12 grid gap-4 lg:grid-cols-3">
          {layers.map((l, i) => (
            <Reveal key={l.label} delay={i * 110}>
              <div className={"relative h-full rounded-2xl border p-6 " + (i === 0 ? "border-border/60 bg-card/40" : "glass-panel border-primary/25")}>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary/80">{l.label}</span>
                <p className="mt-3 text-base font-semibold">{l.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.text}</p>
                {i < 2 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary lg:block" aria-hidden />
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------- Informação não é inteligência ---------------- */

function Contrast() {
  const conv = [
    "Indicadores apresentados separadamente.",
    "Informações que exigem interpretação manual.",
    "Dificuldade para relacionar mercado, operação e impacto financeiro.",
    "Necessidade de consultar múltiplas telas para construir uma análise.",
  ];
  const ethere = [
    "Indicadores analisados em conjunto, quando houver dados compatíveis.",
    "Interpretações que contextualizam as variações observadas.",
    "Cenários para avaliar possíveis impactos no negócio.",
    "Informações organizadas para apoiar decisões com mais clareza.",
  ];
  return (
    <Section
      id="contexto"
      eyebrow="Diferença"
      title="Informação não falta. Contexto, sim."
      subtitle="O setor elétrico produz uma grande quantidade de informações. O desafio é relacionar esses dados, compreender seus movimentos e identificar o que realmente importa para cada decisão. A Ethere vai além da visualização: conecta variáveis, contextualiza mudanças e transforma análises complexas em informação útil para a estratégia comercial e operacional."
    >
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-border/60 bg-card/40 p-7">
            <h3 className="text-sm font-semibold text-muted-foreground">Abordagem convencional</h3>
            <ul className="mt-5 space-y-3">
              {conv.map((t) => (
                <li key={t} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-muted-foreground/40" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="h-full rounded-2xl glass-panel border-primary/30 p-7">
            <h3 className="text-sm font-semibold text-primary">Com a proposta da Ethere</h3>
            <ul className="mt-5 space-y-3">
              {ethere.map((t) => (
                <li key={t} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------- Como funciona -------------------------- */

const steps = [
  { icon: Activity, title: "Entender o mercado", desc: "Acompanhe indicadores relevantes e compreenda as principais mudanças observadas." },
  { icon: LineIcon, title: "Interpretar os movimentos", desc: "Relacione PLD, condições hidrológicas, geração térmica e outras variáveis disponíveis para contextualizar os acontecimentos." },
  { icon: Target, title: "Avaliar os impactos", desc: "Explore cenários e analise possíveis efeitos sobre contratos e resultados, de acordo com os dados disponíveis." },
  { icon: Compass, title: "Decidir com contexto", desc: "Utilize as análises para apoiar o planejamento e as decisões comerciais e operacionais." },
];

function HowItWorks() {
  return (
    <Section id="solucao" eyebrow="Como funciona" title="Do dado à decisão, em uma única linha de raciocínio.">
      <div className="relative mt-14">
        <div
          className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-primary/10 via-primary/60 to-primary lg:block"
          aria-hidden
        />
        <ol className="grid gap-8 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 110} className="relative">
              <div className="flex items-center gap-3 lg:block">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl glass-panel text-primary transition-transform duration-300 hover:-translate-y-1 hover:text-brand-dark">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="mt-4 hidden text-[11px] font-semibold uppercase tracking-widest text-primary/70 lg:block">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold lg:mt-2">{s.title}</h3>
              </div>
              <p className="mt-2 pl-15 text-sm text-muted-foreground lg:pl-0">{s.desc}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* --------------------------- Funcionalidades ------------------------- */

const features = [
  { icon: Activity, title: "PLD, Hidrologia e Térmica", desc: "Três visões do mercado, com indicadores, gráficos e comparações por período. Séries demonstrativas sempre identificadas." },
  { icon: FileText, title: "Leitura dos Contratos", desc: "Preços, volumes, vencimentos e concentração da carteira. Compare contratos semelhantes e abra a análise individual." },
  { icon: Bell, title: "Alertas Personalizados", desc: "Configure regras de PLD e contratos, prioridades e canais. Acompanhe os alertas que exigem atenção." },
  { icon: Sparkles, title: "Central de Inteligência", desc: "Insights por prioridade e categoria, com cenários de queda, referência e alta rotulados como impacto estimado." },
  { icon: MessageSquareText, title: "Ethere Intelligence", desc: "Pergunte sobre mercado e carteira. Receba respostas com período, evidências e limitações, sem decisões automáticas." },
  { icon: BarChart3, title: "Relatórios Configuráveis", desc: "Escolha finalidade, período, indicadores, tabelas e nível de detalhe. Revise antes de gerar e exportar em PDF ou planilha." },
];

function Features() {
  return (
    <Section
      id="funcionalidades"
      eyebrow="Funcionalidades"
      title="Uma plataforma completa para o mercado livre"
      subtitle="Cada módulo foi desenhado para quem opera energia todos os dias e precisa de precisão, contexto e velocidade."
    >
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} variant="zoom" delay={i * 80}>
            <article className="group relative h-full overflow-hidden rounded-2xl glass-panel p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/35">
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(340px 160px at 20% 0%, rgba(63,169,245,0.16), transparent 70%)" }}
                aria-hidden
              />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:glow-ring group-hover:text-brand-dark">
                <f.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <h3 className="relative mt-5 text-base font-semibold">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <span className="relative mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                Ver no produto <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------- Ethere Intelligence ----------------------- */

const intelligencePoints = [
  {
    icon: LineIcon,
    title: "Consulta os dados disponíveis",
    desc: "PLD, hidrologia, térmica, contratos e vencimentos. O assistente distingue dados disponíveis, exemplos e informações ainda não carregadas.",
  },
  {
    icon: Sparkles,
    title: "Interpreta, não decide",
    desc: "Explica o que aconteceu, por que importa e qual pode ser o impacto. A decisão continua com você.",
  },
  {
    icon: ShieldCheck,
    title: "Fontes e evidências em cada resposta",
    desc: "Toda análise indica de onde veio o dado e separa claramente o que é fato do que é estimativa gerencial.",
  },
  {
    icon: FileText,
    title: "Respostas na profundidade certa",
    desc: "Escolha entre quatro níveis de resposta. Consulte período, valores, fontes e limitações sem pesquisa na internet.",
  },
];

const chatPreview = [
  { from: "user", text: "O que mudou no PLD do Sudeste nesta semana?" },
  {
    from: "ai",
    text: "Neste exemplo demonstrativo, o PLD médio passou de R$ 100 para R$ 110/MWh: alta de 10% frente à semana anterior. Isso descreve a variação do preço, sem atribuir uma causa nem concluir ganho ou perda nos contratos.",
  },
  { from: "user", text: "O aumento da geração térmica explica essa alta?" },
  {
    from: "ai",
    text: "Movimentos simultâneos não comprovam causalidade. É preciso comparar as séries do mesmo período e suas fontes. Dados demonstrativos servem para explorar a análise, não para concluir o comportamento real do sistema.",
  },
];

function Intelligence() {
  return (
    <section id="intelligence" className="relative overflow-hidden border-y border-border/60 py-24">
      <div className="pointer-events-none absolute inset-0 aurora opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-brand-dark">
                <MessageSquareText className="h-3.5 w-3.5" />
                Ethere Intelligence
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Explore os dados <span className="text-gradient-cyan">fazendo perguntas</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                O Ethere Intelligence ajuda a compreender variações, investigar relações entre indicadores e obter
                explicações contextualizadas a partir dos dados disponíveis na plataforma. Ele não prevê o mercado:
                torna as informações mais compreensíveis e úteis para a sua análise.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {intelligencePoints.map((p, i) => (
                <Reveal key={p.title} delay={i * 90}>
                  <div className="group h-full rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-110">
                      <p.icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal variant="right" delay={140}>
            <div className="relative overflow-hidden rounded-2xl glass-panel hairline-top p-6">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ethere Intelligence</p>
                  <p className="text-[11px] text-muted-foreground">Exemplo ilustrativo · valores demonstrativos</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-brand-dark">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
                  Demonstração
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {chatPreview.map((m, i) => (
                  <div key={i} className={"flex " + (m.from === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={
                        "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed " +
                        (m.from === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border/60 bg-surface/70 text-muted-foreground")
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/60 bg-surface/60 px-4 py-3">
                <span className="flex-1 text-[13px] text-muted-foreground/70">Pergunte sobre PLD, hidrologia, térmica...</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Diferenciais --------------------------- */

const differentials = [
  { icon: LineIcon, title: "Contexto integrado", desc: "Relaciona informações relevantes do mercado e da operação — PLD, hidrologia, geração térmica e contratos — respeitando a disponibilidade e a compatibilidade dos dados." },
  { icon: Sparkles, title: "Interpretação aplicada", desc: "Transforma variações em leituras que dizem o que mudou, em qual período e o que merece atenção. Ex.: “PLD +10% na semana, movimento persistente em 5 de 7 dias”." },
  { icon: Target, title: "Inteligência para decisões", desc: "Permite explorar cenários de queda, referência e alta e ver o impacto estimado sobre a carteira antes de definir uma estratégia." },
];

function Differentials() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-gradient-brand-soft py-24">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Diferenciais</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Mais do que acompanhar indicadores. <span className="text-gradient-cyan">Entender o que eles significam.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {differentials.map((d, i) => (
            <Reveal key={d.title} variant={i % 2 === 0 ? "left" : "right"} delay={i * 70}>
              <div className="group flex h-full items-start gap-4 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur transition-all duration-300 hover:border-primary/35 hover:bg-card">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-110">
                  <d.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{d.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Público ----------------------------- */

function Audience() {
  const cards = [
    {
      icon: Building2,
      title: "Para comercializadoras",
      headline: "Entenda o mercado. Avalie sua carteira.",
      desc: "Relacione os movimentos do mercado à sua carteira, analise cenários de PLD e identifique os contratos relevantes para suas decisões comerciais.",
      items: ["Leitura do PLD por período e submercado", "Leitura da carteira: preços, vencimentos e concentração", "Cenários de PLD com contratos que mais contribuem"],
    },
    {
      icon: Wind,
      title: "Para geradoras",
      headline: "Conecte o cenário energético à sua estratégia.",
      desc: "Interprete informações de mercado, geração e condições hidrológicas para compreender o contexto operacional e avaliar possíveis implicações comerciais.",
      items: ["PLD, hidrologia e geração térmica em conjunto", "Contratos de venda e vencimentos", "Cenários com premissas explícitas"],
    },
  ];
  return (
    <Section id="publico" eyebrow="Inteligência por perfil" title="A mesma inteligência, aplicada ao seu negócio">
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 120}>
            <div className="group h-full overflow-hidden rounded-2xl glass-panel p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
              </div>
              <p className="mt-5 text-xl font-semibold tracking-tight">{c.headline}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {c.items.map((it) => (
                  <li key={it} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- Plano ------------------------------ */

function Pricing() {
  return (
    <Section id="plano" eyebrow="Planos" title="Os mesmos dados, dois níveis de análise">
      <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        Core e Pro acessam as mesmas áreas da plataforma. A diferença está na profundidade das análises e nos limites de uso. Séries oficiais dependem dos dados carregados; exemplos demonstrativos são identificados.
      </p>
      <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {PLAN_LIST.map((p) => {
          const pro = p.id === "ethere-pro";
          return (
            <Reveal key={p.id} variant="zoom">
              <div className={"relative h-full overflow-hidden rounded-2xl glass-panel hairline-top p-8 " + (pro ? "ring-1 ring-primary/30" : "")}>
                {pro && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "radial-gradient(500px 200px at 50% 0%, rgba(34,211,238,0.10), transparent 70%)" }}
                    aria-hidden
                  />
                )}
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  {pro && (
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium text-brand-dark">
                      Mais completo
                    </span>
                  )}
                </div>
                <div className="relative mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight">{p.priceLabel}</span>
                  <span className="pb-1 text-sm text-muted-foreground">/{p.interval}</span>
                </div>
                <p className="relative mt-4 text-sm leading-relaxed text-muted-foreground">{pro ? "Análises aprofundadas e limites ampliados para sua operação." : "Contratos, alertas e relatórios informativos para o dia a dia."}</p>
                <ul className="relative mt-8 space-y-3">
                  {p.features.map((i) => i === "Dados CCEE, ONS e ANA" ? "PLD, hidrologia e térmica" : i).map((i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-muted-foreground">{i}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="relative mt-9 block">
                  <Button
                    size="lg"
                    variant={pro ? "default" : "outline"}
                    className={"group w-full " + (pro ? "text-primary-foreground shadow-blue hover:opacity-95" : "")}
                    style={pro ? { background: "var(--gradient-brand)" } : undefined}
                  >
                    Começar teste gratuito
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        14 dias de teste · sem cartão de crédito · cancele quando quiser
      </p>
    </Section>
  );
}

/* --------------------------- Institucional -------------------------- */

const institutional = [
  {
    icon: Users,
    title: "Quem somos",
    desc: "Uma EnergyTech brasileira formada por especialistas em mercado de energia, dados e produto digital.",
  },
  {
    icon: Target,
    title: "Nossa missão",
    desc: "Transformar dados energéticos em leituras claras para apoiar decisões conscientes.",
  },
  {
    icon: Eye,
    title: "Nossa visão",
    desc: "Ser a camada de inteligência padrão do Mercado Livre de Energia no Brasil.",
  },
  {
    icon: Compass,
    title: "Nossa proposta",
    desc: "Uma plataforma única que reúne PLD, contratos, alertas e IA com clareza de nível institucional.",
  },
];

function Institutional() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 py-24">
      <div className="pointer-events-none absolute inset-0 aurora opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Ethere Energy</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Tecnologia brasileira para um mercado que não para
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {institutional.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/35">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-110">
                  <c.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-5 text-sm font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FAQ ------------------------------- */

const faq = [
  {
    q: "De onde vêm os dados do PLD?",
    a: "O PLD oficial vem da CCEE e é apresentado em médias diárias quando carregado. Hidrologia e térmica usam dados do setor quando disponíveis. Sem séries oficiais carregadas, a plataforma identifica os exemplos demonstrativos; eles não são dados oficiais nem leituras em tempo real.",
  },
  {
    q: "Os gráficos aparecem nos arquivos exportados?",
    a: "O gráfico do PLD pode ser visto dentro da plataforma. Atualmente, ele não é incluído no PDF nem na planilha; os arquivos trazem os dados e as tabelas selecionados.",
  },
  {
    q: "Como funcionam os cenários?",
    a: "Compare queda, referência e alta do PLD. Os resultados são impactos estimados no cenário, com premissas e limitações visíveis, e não liquidação oficial ou previsão garantida.",
  },
  {
    q: "Preciso instalar algo?",
    a: "Não. A Ethere é 100% web: você cria a conta, cadastra sua empresa e começa a usar em minutos.",
  },
  {
    q: "O que é o Ethere Intelligence?",
    a: "É o assistente de IA da plataforma. Você pergunta em linguagem natural e ele consulta seus contratos, alertas e os dados do mercado antes de responder, sempre indicando as fontes. Disponível nos dois planos — até 50 perguntas/mês no Core, contadas neste navegador, e ilimitado no Pro. Não pesquisa na internet nem toma decisões pelo cliente.",
  },
  {
    q: "Existe limite de contratos?",
    a: "No plano Core, até 100 contratos. No plano Pro, o cadastro é ilimitado.",
  },
  {
    q: "Como funcionam os alertas?",
    a: "Você define gatilhos por submercado, faixa de preço ou vencimento de contrato e recebe a notificação quando o mercado exigir atenção.",
  },
  {
    q: "O que a análise por IA entrega?",
    a: "Leituras por período sobre variações do PLD, hidrologia, térmica e contratos, separando dado, cálculo e hipótese. Cenários mostram impacto estimado, com premissas, sem representar liquidação oficial.",
  },
];

function Faq() {
  return (
    <Section eyebrow="Dúvidas" title="Perguntas frequentes">
      <Reveal className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faq.map((f, i) => (
            <AccordionItem key={f.q} value={`i${i}`} className="border-border/60">
              <AccordionTrigger className="text-left text-sm font-medium hover:text-brand-dark hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </Section>
  );
}

/* ------------------------------ Final CTA ---------------------------- */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal variant="zoom">
          <div className="relative overflow-hidden rounded-3xl glass-panel hairline-top px-8 py-14 text-center sm:px-14">
            <div className="pointer-events-none absolute inset-0 grid-lines-blue opacity-40" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "var(--gradient-blue-radial)" }}
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <Rocket className="h-5 w-5" />
              </div>
              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Comece hoje a decidir com dados, não com intuição
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
                Teste a plataforma completa por 14 dias e veja o mercado de energia com a clareza que sua operação
                merece.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="group w-full text-primary-foreground shadow-blue hover:opacity-95 sm:w-auto"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    Começar teste gratuito
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full border-primary/25 hover:border-primary/50 sm:w-auto">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ Wrapper ----------------------------- */

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">{eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
      </Reveal>
      {children}
    </section>
  );
}
