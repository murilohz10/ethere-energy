import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Activity,
  FileText,
  Bell,
  Sparkles,
  History,
  Check,
  Building2,
  Wind,
  ShieldCheck,
  Zap,
  TrendingUp,
  BarChart3,
  LineChart as LineIcon,
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/ethere/marketing-nav";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ethere — Inteligência para o Mercado Livre de Energia" },
      {
        name: "description",
        content:
          "Transformando dados do Mercado Livre de Energia em decisões estratégicas. Monitoramento do PLD, contratos, alertas e análises por IA.",
      },
      { property: "og:title", content: "Ethere — Inteligência para o Mercado Livre de Energia" },
      {
        property: "og:description",
        content: "Plataforma SaaS para comercializadoras e fazendas de energia.",
      },
    ],
  }),
  component: Landing,
});

const pldData = [
  { t: "00h", v: 148 }, { t: "03h", v: 152 }, { t: "06h", v: 161 },
  { t: "09h", v: 176 }, { t: "12h", v: 188 }, { t: "15h", v: 204 },
  { t: "18h", v: 219 }, { t: "21h", v: 197 },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <Hero />
      <Stats />
      <Logos />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <Audience />
      <Pricing />
      <FinalCTA />
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-blue-radial)" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] grid-lines-blue opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-brand-softer/70 px-3 py-1 text-xs text-brand-dark shadow-soft backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Nova versão · Análises por IA disponíveis
            </div>
            <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Inteligência para o{" "}
              <span className="text-gradient-brand">Mercado Livre</span>{" "}
              de Energia.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A Ethere centraliza PLD, contratos, alertas e análises geradas por IA em uma única plataforma —
              feita para comercializadoras e fazendas de energia que precisam de clareza e previsibilidade.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="h-11 px-5 text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                  Começar Trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-11 border-brand-soft px-5 text-brand-dark hover:bg-brand-softer">
                  Entrar
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> LGPD compliant</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-brand" /> Dados CCEE em tempo real</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand" /> Análises por IA</div>
            </div>
          </div>
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-brand/10 via-brand-light/5 to-transparent blur-2xl" />
      <div className="rounded-2xl border border-brand-soft bg-card p-4 shadow-elegant" style={{ background: "var(--gradient-card)" }}>
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            <span className="ml-2 text-[11px] text-muted-foreground">app.ethere.com/dashboard</span>
          </div>
          <span className="rounded-full bg-brand-softer px-2 py-0.5 text-[10px] font-medium text-brand-dark">Live</span>
        </div>
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">PLD SE/CO · hoje</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight">R$ 219,42</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand">
                    <TrendingUp className="h-3 w-3" /> +4,8%
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-brand-softer px-2.5 py-1 text-[10px] font-medium text-brand-dark">
                Atualizado 12:04
              </div>
            </div>
            <div className="mt-3 h-24">
              <ResponsiveContainer>
                <AreaChart data={pldData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Contratos ativos
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">128</div>
              <div className="mt-3 flex items-end gap-1 h-8">
                {[40, 55, 30, 70, 60, 85, 50].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)` }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-brand-soft bg-brand-softer/60 p-4 shadow-soft">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-dark">
                <Sparkles className="h-3.5 w-3.5" /> Análise IA
              </div>
              <p className="mt-2 text-sm leading-snug text-foreground/85">
                Tendência de alta moderada no SE/CO nas próximas 48h.
              </p>
              <div className="mt-3 text-[10px] uppercase tracking-wider text-brand-dark/70">Gerado agora</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { v: "R$ 12,4B", l: "Volume negociado analisado" },
    { v: "+2.400", l: "Contratos monitorados" },
    { v: "99,98%", l: "Disponibilidade da plataforma" },
    { v: "48h", l: "Antecipação média de sinais" },
  ];
  return (
    <section className="border-y border-brand-soft bg-brand-softer/70">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center md:text-left">
            <div className="text-3xl font-semibold tracking-tight text-brand-dark md:text-4xl">{s.v}</div>
            <div className="mt-1 text-xs text-muted-foreground md:text-sm">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Logos() {
  const names = ["ONS", "CCEE", "ANEEL", "EPE", "ABRACEEL", "ABEEólica"];
  return (
    <section className="border-b border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-10">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Integrado com fontes do setor
        </span>
        {names.map((n) => (
          <span key={n} className="text-sm font-semibold tracking-tight text-muted-foreground/80">{n}</span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    { t: "Dados dispersos", d: "PLD, ONS, CCEE, notícias — cada informação em um sistema diferente." },
    { t: "Decisões tardias", d: "Sem alertas centralizados, oportunidades e riscos passam despercebidos." },
    { t: "Análises manuais", d: "Planilhas frágeis para acompanhar contratos, exposição e cenários." },
  ];
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="O problema"
          title="Acompanhar o Mercado Livre exige tempo e ferramentas dispersas."
          description="Comercializadoras e fazendas hoje dependem de múltiplas fontes desconexas para tomar decisões críticas."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map((i, idx) => (
            <div key={i.t} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-brand-soft hover:shadow-elegant">
              <div className="absolute right-4 top-4 text-[10px] font-semibold text-brand/40">0{idx + 1}</div>
              <div className="text-base font-semibold text-foreground">{i.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section id="solucao" className="border-y border-brand-soft bg-brand-softer/60">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="A solução"
          title="Uma única camada de inteligência para todo o mercado."
          description="A Ethere unifica dados públicos e privados em módulos organizados e navegáveis."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <MiniModule
            icon={LineIcon}
            title="PLD por submercado"
            body={
              <div className="mt-3 h-28">
                <ResponsiveContainer>
                  <LineChart data={pldData}>
                    <Line type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} dot={false} />
                    <XAxis dataKey="t" hide />
                    <YAxis hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            }
          />
          <MiniModule
            icon={FileText}
            title="Contratos"
            body={
              <div className="mt-4 space-y-2 text-sm">
                {["Cliente Alfa · 12 MWm", "Cliente Beta · 8 MWm", "Cliente Gama · 5 MWm"].map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg bg-brand-softer px-3 py-2">
                    <span className="text-foreground/85">{t}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-brand-dark">ativo</span>
                  </div>
                ))}
              </div>
            }
          />
          <MiniModule
            icon={Bell}
            title="Alertas"
            body={
              <div className="mt-4 space-y-2 text-sm">
                {[
                  { t: "PLD +5% em 24h", p: "alta", c: "bg-red-500/10 text-red-600" },
                  { t: "Reservatório SE < 40%", p: "média", c: "bg-amber-500/10 text-amber-700" },
                  { t: "Contrato vence em 7d", p: "baixa", c: "bg-brand-softer text-brand-dark" },
                ].map((a) => (
                  <div key={a.t} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                    <span className="text-foreground/85">{a.t}</span>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + a.c}>{a.p}</span>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

function MiniModule({ icon: Icon, title, body }: { icon: typeof FileText; title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-soft bg-card p-5 shadow-soft transition hover:shadow-elegant">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-softer text-brand">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">módulo</span>
      </div>
      {body}
    </div>
  );
}

function Features() {
  const feats = [
    { icon: Activity, t: "Monitoramento do PLD", d: "Séries históricas e tempo real por submercado." },
    { icon: FileText, t: "Gestão de Contratos", d: "Volumes, preços, vencimentos e exposição." },
    { icon: Bell, t: "Alertas Inteligentes", d: "Regras personalizadas e prioridades automáticas." },
    { icon: Sparkles, t: "Análises por IA", d: "Resumos diários e recomendações contextuais." },
    { icon: BarChart3, t: "Relatórios Executivos", d: "Exportações semanais, mensais e trimestrais." },
    { icon: History, t: "Histórico", d: "Consultas rápidas e comparações por período." },
  ];
  return (
    <section id="funcionalidades" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="Funcionalidades"
          title="Tudo o que sua operação precisa, em um só lugar."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feats.map((f) => (
            <div key={f.t} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-softer text-brand transition group-hover:bg-brand group-hover:text-white">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="mt-5 text-base font-semibold">{f.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Crie sua conta", d: "Cadastro em minutos, com trial de 14 dias e sem cartão de crédito." },
    { n: "02", t: "Cadastre seus contratos", d: "Volumes, preços, submercados e vencimentos organizados em um só lugar." },
    { n: "03", t: "Configure alertas", d: "Regras por PLD, reservatórios, vencimentos e mudanças regulatórias." },
    { n: "04", t: "Decida com base nos dados", d: "Dashboards executivos e análises por IA para agir no momento certo." },
  ];
  return (
    <section id="como-funciona" className="border-y border-brand-soft bg-brand-softer/60">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="Como funciona" title="Quatro passos até a operação pronta." />
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-brand-soft bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
              <div className="grid h-9 w-9 place-items-center rounded-lg text-xs font-semibold text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                {s.n}
              </div>
              <div className="mt-4 text-lg font-semibold tracking-tight">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              {i < steps.length - 1 && (
                <div className="absolute right-[-14px] top-1/2 hidden -translate-y-1/2 lg:block">
                  <ArrowRight className="h-5 w-5 text-brand/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: Activity, t: "Monitoramento do PLD", d: "Acompanhe preços por submercado em tempo real, com séries históricas e comparações." },
    { icon: FileText, t: "Gestão simplificada de contratos", d: "Portfólio completo com volumes, preços, exposição e alertas de vencimento." },
    { icon: Bell, t: "Alertas inteligentes", d: "Regras personalizadas por prioridade e canal, disparadas no momento exato." },
    { icon: Sparkles, t: "Análises por IA", d: "Resumos diários, tendências e recomendações contextuais para sua operação." },
    { icon: BarChart3, t: "Dashboards executivos", d: "Indicadores consolidados prontos para comitês, diretoria e investidores." },
    { icon: ShieldCheck, t: "Confiabilidade", d: "Dados organizados, histórico auditável e relatórios exportáveis em PDF e Excel." },
  ];
  return (
    <section id="beneficios" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="Benefícios"
          title="Menos planilhas. Mais decisões com base em dados."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <div key={b.t} className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-softer text-brand transition group-hover:bg-brand group-hover:text-white">
                <b.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="mt-5 text-base font-semibold">{b.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: "O que é o Mercado Livre de Energia?",
      a: "É o ambiente em que consumidores, comercializadoras e geradores negociam energia livremente, definindo preço, prazo e volume por contrato — diferente do mercado regulado, onde a tarifa é definida pela distribuidora.",
    },
    {
      q: "Preciso instalar algum software?",
      a: "Não. A Ethere é 100% web. Basta acessar pelo navegador com seu login — não há instalação, servidores ou manutenção do seu lado.",
    },
    {
      q: "Existe período de teste?",
      a: "Sim. Todos os planos incluem 14 dias de trial, sem necessidade de cartão de crédito, com acesso completo às funcionalidades.",
    },
    {
      q: "Como funciona o plano Professional?",
      a: "O Professional inclui contratos ilimitados, alertas avançados por regra, análises por IA com recomendações, relatórios trimestrais e acesso à API para integrações.",
    },
    {
      q: "Meus dados ficam seguros?",
      a: "Sim. Os dados são isolados por empresa, com controle de acesso por usuário, autenticação em duas etapas opcional e histórico de atividades.",
    },
  ];
  return (
    <section id="faq" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="FAQ" title="Perguntas frequentes." />
        <div className="mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`i${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}


function Audience() {
  return (
    <section id="publico" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="Para quem" title="Construída para os dois lados do mercado." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <AudienceCard
            icon={Building2}
            title="Comercializadoras"
            items={[
              "Gestão consolidada de portfólio",
              "Exposição em tempo real",
              "Alertas de preço e regulação",
              "Relatórios executivos automatizados",
            ]}
          />
          <AudienceCard
            icon={Wind}
            title="Fazendas de Energia"
            items={[
              "Acompanhamento de geração e receita",
              "Projeções de receita por submercado",
              "Monitoramento por submercado",
              "Análises de sazonalidade por IA",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Building2;
  title: string;
  items: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition hover:border-brand-soft hover:shadow-elegant">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/5 blur-2xl" />
      <div className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <div className="mt-5 text-2xl font-semibold tracking-tight">{title}</div>
      <ul className="mt-6 space-y-3">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
            <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand/15 text-brand">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pricing() {
  return (
    <section id="planos" className="border-y border-brand-soft bg-brand-softer/60">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="Planos" title="Escolha o plano que acompanha sua operação." />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <PlanCard
            name="Essential"
            price="R$ 1.490"
            desc="Para times enxutos começando a estruturar a operação."
            items={[
              "Monitoramento do PLD",
              "Até 20 contratos",
              "Alertas essenciais",
              "Relatórios mensais",
            ]}
          />
          <PlanCard
            featured
            name="Professional"
            price="R$ 3.990"
            desc="Para operações consolidadas com portfólio amplo."
            items={[
              "Tudo do Essential",
              "Contratos ilimitados",
              "Alertas avançados por regra",
              "Análises por IA e recomendações",
              "Relatórios trimestrais e API",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name, price, desc, items, featured,
}: { name: string; price: string; desc: string; items: string[]; featured?: boolean }) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border p-8 transition " +
        (featured
          ? "border-brand bg-card shadow-elegant"
          : "border-border bg-card hover:border-brand-soft")
      }
    >
      {featured && (
        <div className="pointer-events-none absolute inset-x-0 -top-px h-1" style={{ background: "var(--gradient-brand)" }} />
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{name}</div>
        {featured && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
            Recomendado
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className={"text-4xl font-semibold tracking-tight " + (featured ? "text-gradient-brand" : "")}>{price}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
            <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand/15 text-brand">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {i}
          </li>
        ))}
      </ul>
      <Link to="/signup" className="mt-8 block">
        <Button
          className={
            "w-full " +
            (featured
              ? "text-white shadow-blue hover:opacity-95"
              : "bg-foreground text-background hover:opacity-90")
          }
          style={featured ? { background: "var(--gradient-brand)" } : undefined}
        >
          Iniciar Trial
        </Button>
      </Link>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="relative overflow-hidden rounded-3xl border border-brand-soft p-12 md:p-16" style={{ background: "var(--gradient-brand)" }}>
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-10" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center text-white">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
              Comece hoje a acompanhar o mercado com clareza.
            </h2>
            <p className="mt-3 text-white/80">
              14 dias de trial. Sem cartão de crédito. Configure em minutos.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-brand-dark hover:bg-white/90">
                  Começar Trial <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">Entrar</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow, title, description,
}: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-brand-softer px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
        <span className="h-1 w-1 rounded-full bg-brand" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
