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
    <div className="flex min-h-screen bg-surface/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/app"><EthereLogo /></Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" strokeWidth={1.75} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-foreground text-xs font-medium text-background">
              LG
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">Lucas Gomes</div>
              <div className="text-[11px] text-muted-foreground">Ethere Ltda.</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl lg:px-10">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <input
          className="w-64 bg-transparent placeholder:text-muted-foreground focus:outline-none"
          placeholder="Buscar contratos, alertas, notícias…"
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="hidden md:inline">Trial · 12 dias restantes</span>
        <button className="rounded-md border border-border px-2.5 py-1 text-foreground hover:bg-surface">
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
    { l: "Notícia", v: "ONS revisa curva de garantia física", d: "", up: true },
    { l: "Tendência", v: "Alta moderada 48h", d: "", up: true },
  ];
  const all = [...items, ...items];
  return (
    <div className="overflow-hidden border-b border-border bg-background">
      <div className="ticker-track flex w-max gap-8 whitespace-nowrap py-2.5 text-xs">
        {all.map((i, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3">
            <span className="text-muted-foreground">{i.l}</span>
            <span className="font-medium">{i.v}</span>
            {i.d && (
              <span className={i.up ? "text-[#2563EB]" : "text-destructive"}>{i.d}</span>
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
        <h1 className="text-2xl tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
