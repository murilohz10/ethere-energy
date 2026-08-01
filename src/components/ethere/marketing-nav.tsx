import { Link } from "@tanstack/react-router";
import { EthereLogo } from "./logo";
import { Button } from "@/components/ui/button";
import { Linkedin, Instagram, Mail, ArrowRight } from "lucide-react";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-foreground transition hover:opacity-90">
          <EthereLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#solucao" className="link-underline transition hover:text-brand-dark">Como funciona</a>
          <a href="#funcionalidades" className="link-underline transition hover:text-brand-dark">Funcionalidades</a>
          <a href="#publico" className="link-underline transition hover:text-brand-dark">Para quem</a>
          <a href="#plano" className="link-underline transition hover:text-brand-dark">Plano</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium">Entrar</Button>
          </Link>
          <Link to="/signup">
            <Button
              size="sm"
              className="group text-primary-foreground shadow-blue hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              Começar teste
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

const productLinks = [
  { label: "Como funciona", href: "#solucao" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Para quem", href: "#publico" },
  { label: "Plano", href: "#plano" },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-gradient-brand-soft">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <EthereLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Inteligência de mercado para o setor elétrico brasileiro. Dados energéticos transformados em decisões
              financeiras.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href="https://www.linkedin.com" label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com" label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="mailto:contato@ethere.energy" label="E-mail">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Menu</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="link-underline transition hover:text-brand-dark">{l.label}</a>
                </li>
              ))}
              <li>
                <Link to="/login" className="link-underline transition hover:text-brand-dark">Entrar</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Contato</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="mailto:contato@ethere.energy" className="link-underline transition hover:text-brand-dark">
                  contato@ethere.energy
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com" className="link-underline transition hover:text-brand-dark">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com" className="link-underline transition hover:text-brand-dark">
                  Instagram
                </a>
              </li>
              <li>São Paulo · Brasil</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="link-underline transition hover:text-brand-dark">Política de Privacidade</a></li>
              <li><a href="#" className="link-underline transition hover:text-brand-dark">Termos de Uso</a></li>
              <li><a href="#" className="link-underline transition hover:text-brand-dark">LGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Ethere Energy. Todos os direitos reservados.</span>
          <span className="inline-flex items-center gap-2">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
            Dados oficiais CCEE &amp; ONS
          </span>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-brand-dark"
    >
      {children}
    </a>
  );
}
