import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { isEmail } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha · Ethere" },
      { name: "description", content: "Recupere o acesso à sua conta Ethere Energy." },
      { property: "og:title", content: "Recuperar senha · Ethere" },
      { property: "og:description", content: "Enviaremos um link de redefinição de senha." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) return setError("Informe um e-mail válido.");
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/"><EthereLogo /></Link>

        {!sent ? (
          <>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight">Esqueci minha senha</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
            </p>
            <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(error && "border-destructive")}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Enviando…</> : "Enviar link de redefinição"}
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-8">
            <div className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
              <MailCheck className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Verifique seu e-mail</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Enviamos um link de redefinição para <b className="text-foreground">{email}</b>. O link expira em 30 minutos.
            </p>
            <div className="mt-6 space-y-3">
              <Button
                className="w-full text-white shadow-blue hover:opacity-95"
                style={{ background: "var(--gradient-brand)" }}
                onClick={() => navigate({ to: "/redefinir-senha" })}
              >
                Abrir tela de redefinição
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                Reenviar para outro e-mail
              </Button>
            </div>
          </div>
        )}

        <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
