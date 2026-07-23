import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import { Building2, Wind, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta · Ethere" },
      { name: "description", content: "Comece seu trial na Ethere Energy." },
      { property: "og:title", content: "Criar conta · Ethere" },
      { property: "og:description", content: "Crie sua conta Ethere em minutos." },
    ],
  }),
  component: SignupPage,
});

const steps = ["Perfil", "Empresa", "Configuração", "Conclusão"];

function SignupPage() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<"comercializadora" | "fazenda" | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/"><EthereLogo /></Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Já tenho conta
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-14">
        <Progress step={step} />

        <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-soft">
          {step === 0 && (
            <StepShell title="Qual é o seu perfil?" subtitle="Personalizamos a plataforma para sua operação.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ProfileCard
                  icon={Building2}
                  label="Comercializadora"
                  active={profile === "comercializadora"}
                  onClick={() => setProfile("comercializadora")}
                />
                <ProfileCard
                  icon={Wind}
                  label="Fazenda de Energia"
                  active={profile === "fazenda"}
                  onClick={() => setProfile("fazenda")}
                />
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Dados da empresa" subtitle="Estas informações aparecem em relatórios e faturas.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Razão social" placeholder="Ethere Ltda." />
                <Field label="CNPJ" placeholder="00.000.000/0000-00" />
                <Field label="Seu nome" placeholder="Nome completo" />
                <Field label="Email corporativo" placeholder="voce@empresa.com" type="email" />
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Configuração inicial" subtitle="Ajuste depois em Configurações.">
              <div className="mt-6 space-y-4">
                <Field label="Submercados de interesse" placeholder="SE/CO, S, NE, N" />
                <Field label="Notificações" placeholder="Email, SMS" />
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Tudo pronto" subtitle="Sua conta está configurada. Bem-vindo à Ethere.">
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-surface p-4 text-sm">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#2563EB] text-white">
                  <Check className="h-4 w-4" />
                </div>
                <span>Trial de 14 dias ativado. Sem cartão de crédito.</span>
              </div>
            </StepShell>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !profile}
                className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              >
                Continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate({ to: "/app" })}
                className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              >
                Entrar na plataforma <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border text-[11px] font-medium",
                i <= step ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
            <span className={cn("text-xs", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-foreground" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

function ProfileCard({ icon: Icon, label, active, onClick }: {
  icon: typeof Building2; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-6 text-left transition",
        active ? "border-foreground bg-surface shadow-soft" : "border-border hover:bg-surface/70",
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <div className="mt-4 text-sm font-medium">{label}</div>
    </button>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...rest} />
    </div>
  );
}
