import { Link, useRouterState } from "@tanstack/react-router";
import { EthereLogo } from "./logo";
import {
  LayoutGrid,
  Activity,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Search,
  ChevronDown,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof LayoutGrid; exact?: boolean };
const nav: NavItem[] = [
  { to: "/app", label: "Visão Geral", icon: LayoutGrid, exact: true },
  { to: "/app/monitoramento", label: "Monitoramento", icon: Activity },
  { to: "/app/contratos", label: "Contratos", icon: FileText },
  { to: "/app/alertas", label: "Alertas", icon: Bell },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/app"><EthereLogo /></Link>
        </div>
        <div className="mx-3 mb-2 rounded-xl border border-brand-soft bg-brand-softer p-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-brand-dark">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            Análise IA disponível
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            PLD SE/CO com tendência de alta nas próximas 48h.
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-brand-softer text-brand-dark font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:translate-x-0.5",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-brand transition-all duration-300",
                    active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50",
                  )}
                />
                <n.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-all duration-200",
                    active
                      ? "text-brand"
                      : "text-muted-foreground group-hover:text-foreground group-hover:scale-110",
                  )}
                  strokeWidth={1.75}
                />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all duration-200 hover:bg-sidebar-accent">
            <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white shadow-blue transition-transform duration-300 group-hover:scale-105" style={{ background: "var(--gradient-brand)" }}>
              LG
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Lucas Gomes</div>
              <div className="text-[11px] text-muted-foreground">Ethere Ltda.</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <TopBar />
        <Ticker />
        <main className="flex-1 px-6 py-8 lg:px-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <div className="group flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 focus-within:border-brand focus-within:bg-surface-muted focus-within:shadow-blue hover:border-brand-soft">
          <Search className="h-4 w-4 transition-colors duration-200 group-focus-within:text-brand" />
          <input
            className="w-64 bg-transparent placeholder:text-muted-foreground focus:outline-none"
            placeholder="Buscar contratos, alertas…"
          />
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="hidden items-center gap-1.5 rounded-full border border-brand-soft bg-brand-softer px-2.5 py-1 font-medium text-brand-dark md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          Trial · 12 dias restantes
        </span>
        <button className="rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-blue transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elegant active:translate-y-0" style={{ background: "var(--gradient-brand)" }}>
          Upgrade
        </button>
      </div>
    </header>
  );
}

function Ticker() {
  const items = [
    { l: "PLD SE/CO", v: "R$ 219,42", d: "+4,8%", up: true },
    { l: "PLD S", v: "R$ 201,10", d: "+2,1%", up: true },
    { l: "PLD NE", v: "R$ 188,30", d: "-1,2%", up: false },
    { l: "PLD N", v: "R$ 175,88", d: "+0,4%", up: true },
    { l: "Reserv. SE", v: "42,1%", d: "-0,6pp", up: false },
    { l: "Reserv. S", v: "68,9%", d: "+1,1pp", up: true },
    { l: "ONS", v: "Revisão curva garantia física", d: "", up: true },
    { l: "IA", v: "Alta moderada 48h", d: "", up: true },
  ];
  const all = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-border bg-gradient-to-r from-brand-softer via-background to-brand-softer">
      <div className="ticker-track flex w-max gap-8 whitespace-nowrap py-2 text-xs">
        {all.map((i, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-brand-dark/70">{i.l}</span>
            <span className="font-semibold text-foreground">{i.v}</span>
            {i.d && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", i.up ? "text-brand" : "text-destructive")}>
                {i.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {i.d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-[2rem]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
