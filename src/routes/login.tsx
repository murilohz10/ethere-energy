import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Ethere" },
      { name: "description", content: "Acesse a plataforma Ethere Energy." },
      { property: "og:title", content: "Entrar · Ethere" },
      { property: "og:description", content: "Acesse sua conta Ethere." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden text-white lg:block" style={{ background: "var(--gradient-brand)" }}>
        <div className="absolute inset-0 grid-lines opacity-[0.12]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="text-white">
            <EthereLogo />
          </Link>
          <div>
            <p className="max-w-md text-2xl leading-snug tracking-tight">
              “A Ethere reduziu em 70% o tempo que gastávamos consolidando dados do mercado.”
            </p>
            <div className="mt-6 text-sm text-white/75">
              Diretor de trading · Comercializadora nacional
            </div>
          </div>
        </div>
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <EthereLogo />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta Ethere.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/app" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="voce@empresa.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
                  Esqueci minha senha
                </a>
              </div>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
              Entrar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
          <div className="mt-6 text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="font-medium text-foreground hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
