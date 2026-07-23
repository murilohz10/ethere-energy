import { Link } from "@tanstack/react-router";
import { EthereLogo } from "./logo";
import { Button } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-foreground">
          <EthereLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#solucao" className="transition hover:text-brand-dark">Plataforma</a>
          <a href="#funcionalidades" className="transition hover:text-brand-dark">Recursos</a>
          <a href="#publico" className="transition hover:text-brand-dark">Para quem</a>
          <a href="#planos" className="transition hover:text-brand-dark">Planos</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium">Entrar</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              Começar Trial
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-gradient-to-b from-brand-softer to-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <EthereLogo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Inteligência de mercado para o setor elétrico brasileiro.
            </p>
          </div>
          <FooterCol title="Produto" items={["Plataforma", "Monitoramento PLD", "Contratos", "Alertas"]} />
          <FooterCol title="Empresa" items={["Sobre", "Blog", "Carreiras", "Contato"]} />
          <FooterCol title="Legal" items={["Termos", "Privacidade", "Segurança", "LGPD"]} />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Ethere Energy. Todos os direitos reservados.</span>
          <span>São Paulo · Brasil</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="transition hover:text-brand-dark">{i}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
