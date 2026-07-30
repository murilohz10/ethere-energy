import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EthereLogo } from "@/components/ethere/logo";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { isEmail, isStrongPassword, useSession, useOnboarding } from "@/lib/store";
import { toast } from "sonner";

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
  const { signIn } = useSession();
  const onboarding = useOnboarding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!isEmail(email)) next.email = "Formato de e-mail inválido.";
    if (!password) next.password = "Informe sua senha.";
    else if (!isStrongPassword(password)) next.password = "A senha deve ter ao menos 8 caracteres.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const name = email.split("@")[0].replace(/[._-]/g, " ");
      const [first = "", last = ""] = name.split(" ");
      signIn({
        email: email.trim(),
        firstName: first.charAt(0).toUpperCase() + first.slice(1),
        lastName: last.charAt(0).toUpperCase() + last.slice(1),
        company: "Ethere Ltda.",
        role: "Analista de Energia",
        remember,
        onboarded: onboarding.done,
      });
      toast.success("Login realizado com sucesso.");
      navigate({ to: onboarding.done ? "/app" : "/onboarding" });
    }, 900);
  }

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

          {errors.form && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.form}
            </div>
          )}

          <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/esqueci-senha" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Lembrar de mim
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white shadow-blue transition-opacity hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Entrando…
                </>
              ) : (
                <>
                  Entrar <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
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
