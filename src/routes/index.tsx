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
} from "lucide-react";
import { MarketingNav, MarketingFooter } from "@/components/ethere/marketing-nav";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] grid-lines opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              Nova versão · Análises por IA disponíveis
            </div>
            <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Transformando dados do{" "}
              <span className="text-muted-foreground">Mercado Livre de Energia</span>{" "}
              em decisões estratégicas.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              A Ethere centraliza PLD, contratos, alertas e análises geradas por IA em uma única plataforma —
              feita para comercializadoras e fazendas de energia que precisam de clareza e previsibilidade.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="h-11 bg-[#2563EB] px-5 text-white hover:bg-[#1d4ed8]">
                  Começar Trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-11 px-5">
                  Entrar
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> LGPD compliant</div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Dados CCEE em tempo real</div>
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
      <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-surface to-transparent" />
      <div className="grid gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">PLD SE/CO · hoje</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">R$ 219,42</span>
                <span className="text-xs font-medium text-[#2563EB]">+4,8%</span>
              </div>
            </div>
            <div className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              Atualizado 12:04
            </div>
          </div>
          <div className="mt-3 h-24">
            <ResponsiveContainer>
              <AreaChart data={pldData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#2563EB" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs text-muted-foreground">Contratos ativos</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">128</div>
            <div className="mt-3 flex gap-1">
              {[40, 55, 30, 70, 60, 85, 50].map((h, i) => (
                <div key={i} className="w-full rounded-sm bg-foreground/80" style={{ height: h / 3 }} />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="text-xs text-muted-foreground">Análise IA</div>
            <p className="mt-1 text-sm leading-snug">
              Tendência de alta moderada no SE/CO nas próximas 48h por baixa hidráulica.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#2563EB]">
              <Sparkles className="h-3 w-3" /> Gerado agora
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logos() {
  const names = ["ONS", "CCEE", "ANEEL", "EPE", "ABRACEEL", "ABEEólica"];
  return (
    <section className="border-y border-border/60 bg-surface/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Integrado com fontes do setor
        </span>
        {names.map((n) => (
          <span key={n} className="text-sm font-medium text-muted-foreground/80">{n}</span>
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
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="O problema"
        title="Acompanhar o Mercado Livre exige tempo e ferramentas dispersas."
        description="Comercializadoras e fazendas hoje dependem de múltiplas fontes desconexas para tomar decisões críticas."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <div key={i.t} className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm font-medium text-foreground">{i.t}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section id="solucao" className="border-y border-border/60 bg-surface/50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader
          eyebrow="A solução"
          title="Uma única camada de inteligência para todo o mercado."
          description="A Ethere unifica dados públicos e privados em módulos organizados e navegáveis."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <MiniModule
            title="PLD por submercado"
            body={
              <div className="mt-3 h-28">
                <ResponsiveContainer>
                  <LineChart data={pldData}>
                    <Line type="monotone" dataKey="v" stroke="currentColor" strokeWidth={1.5} dot={false} />
                    <XAxis dataKey="t" hide />
                    <YAxis hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            }
          />
          <MiniModule
            title="Contratos"
            body={
              <div className="mt-4 space-y-2 text-sm">
                {["Cliente Alfa · 12 MWm", "Cliente Beta · 8 MWm", "Cliente Gama · 5 MWm"].map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                    <span className="text-foreground/80">{t}</span>
                    <span className="text-xs text-muted-foreground">ativo</span>
                  </div>
                ))}
              </div>
            }
          />
          <MiniModule
            title="Alertas"
            body={
              <div className="mt-4 space-y-2 text-sm">
                {[
                  { t: "PLD +5% em 24h", p: "alta" },
                  { t: "Reservatório SE < 40%", p: "média" },
                  { t: "Contrato vence em 7d", p: "baixa" },
                ].map((a) => (
                  <div key={a.t} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="text-foreground/80">{a.t}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.p}</span>
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

function MiniModule({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
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
    { icon: History, t: "Histórico", d: "Consultas rápidas e comparações por período." },
    { icon: Newspaper, t: "Notícias", d: "Mercado, regulação, clima e energia curados." },
  ];
  return (
    <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeader
        eyebrow="Funcionalidades"
        title="Tudo o que sua operação precisa, em um só lugar."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feats.map((f) => (
          <div key={f.t} className="group rounded-2xl border border-border bg-card p-6 transition hover:shadow-elegant">
            <f.icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            <div className="mt-4 text-sm font-medium">{f.t}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Cadastro", d: "Crie sua conta em minutos e escolha o perfil da operação." },
    { n: "02", t: "Configuração", d: "Importe contratos, defina alertas e submercados relevantes." },
    { n: "03", t: "Plataforma pronta", d: "Comece a acompanhar o mercado com dados organizados." },
  ];
  return (
    <section className="border-y border-border/60 bg-surface/50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeader eyebrow="Como funciona" title="Três passos até a operação pronta." />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="text-xs font-medium text-muted-foreground">{s.n}</div>
              <div className="mt-3 text-lg font-medium tracking-tight">{s.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              {i < 2 && (
                <div className="mt-6 hidden h-px w-full bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Audience() {
  return (
    <section id="publico" className="mx-auto max-w-7xl px-6 py-24">
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
            "Simulação de cenários de venda",
            "Monitoramento por submercado",
            "Análises de sazonalidade por IA",
          ]}
        />
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
    <div className="rounded-2xl border border-border bg-card p-8">
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <div className="mt-5 text-xl font-medium tracking-tight">{title}</div>
      <ul className="mt-6 space-y-3">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
            <Check className="mt-0.5 h-4 w-4 text-[#2563EB]" strokeWidth={2} />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pricing() {
  return (
    <section id="planos" className="border-y border-border/60 bg-surface/50">
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
              "Notícias curadas",
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
              "Simulação de cenários",
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
        "rounded-2xl border p-8 transition " +
        (featured
          ? "border-foreground bg-card shadow-elegant"
          : "border-border bg-card")
      }
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{name}</div>
        {featured && (
          <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-[11px] font-medium text-[#2563EB]">
            Recomendado
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
            <Check className="mt-0.5 h-4 w-4 text-[#2563EB]" />
            {i}
          </li>
        ))}
      </ul>
      <Link to="/signup" className="mt-8 block">
        <Button
          className={
            "w-full " +
            (featured
              ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              : "bg-foreground text-background hover:opacity-90")
          }
        >
          Iniciar Trial
        </Button>
      </Link>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 md:p-16">
        <div className="absolute inset-0 -z-10 grid-lines opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="mx-auto max-w-2xl text-center">
          <LineIcon className="mx-auto h-8 w-8" strokeWidth={1.25} />
          <h2 className="mt-6 text-3xl tracking-tight md:text-4xl">
            Comece hoje a acompanhar o mercado com clareza.
          </h2>
          <p className="mt-3 text-muted-foreground">
            14 dias de trial. Sem cartão de crédito. Configure em minutos.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]">
                Começar Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Entrar</Button>
            </Link>
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
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}
