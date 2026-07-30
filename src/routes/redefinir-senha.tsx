import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { isStrongPassword } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha · Ethere" },
      { name: "description", content: "Defina uma nova senha para sua conta Ethere Energy." },
      { property: "og:title", content: "Redefinir senha · Ethere" },
      { property: "og:description", content: "Escolha uma nova senha de acesso." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isStrongPassword(password)) next.password = "Mínimo de 8 caracteres.";
    if (confirm !== password) next.confirm = "As senhas não coincidem.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Senha redefinida com sucesso. Faça login novamente.");
      navigate({ to: "/login" });
    }, 900);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/"><EthereLogo /></Link>
        <div className="mt-8 grid h-12 w-12 place-items-center rounded-xl text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
          <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Nova senha</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Defina uma senha com pelo menos 8 caracteres.</p>

        <form className="mt-8 space-y-4" noValidate onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="pwd">Nova senha</Label>
            <div className="relative">
              <Input
                id="pwd"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn("pr-10", errors.password && "border-destructive")}
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
          <div className="space-y-2">
            <Label htmlFor="pwd2">Confirmar nova senha</Label>
            <Input
              id="pwd2"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={cn(errors.confirm && "border-destructive")}
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
            {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Salvando…</> : "Redefinir senha"}
          </Button>
        </form>

        <Link to="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
