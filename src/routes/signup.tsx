import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import { Building2, Wind, Check, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isCnpj, isEmail, isPhone, isStrongPassword, maskCnpj, maskPhone,
  useSession, useSettings, uid, type UserProfileKind,
} from "@/lib/store";
import { ETHERE_PLAN, defaultSubscription } from "@/lib/billing";
import { toast } from "sonner";

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

const steps = ["Dados pessoais", "Acesso", "Perfil", "Plano"];

type Form = {
  firstName: string; lastName: string; role: string; company: string; cnpj: string; phone: string;
  email: string; password: string; confirm: string;
  profile: UserProfileKind | null; plan: "Essential" | "Professional" | null;
};

const initial: Form = {
  firstName: "", lastName: "", role: "", company: "", cnpj: "", phone: "",
  email: "", password: "", confirm: "", profile: null, plan: null,
};

function SignupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useSession();
  const { settings, setSettings } = useSettings();

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  function validate(current: number) {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (!form.firstName.trim()) e.firstName = "Informe seu nome.";
      if (!form.lastName.trim()) e.lastName = "Informe seu sobrenome.";
      if (!form.role.trim()) e.role = "Informe seu cargo.";
      if (!form.company.trim()) e.company = "Informe a empresa.";
      if (!isCnpj(form.cnpj)) e.cnpj = "CNPJ inválido.";
      if (!isPhone(form.phone)) e.phone = "Telefone inválido.";
    }
    if (current === 1) {
      if (!isEmail(form.email)) e.email = "E-mail inválido.";
      if (!isStrongPassword(form.password)) e.password = "Mínimo de 8 caracteres.";
      if (form.confirm !== form.password) e.confirm = "As senhas não coincidem.";
    }
    if (current === 2 && !form.profile) e.profile = "Selecione um perfil.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((s) => s + 1);
  }

  function finish() {
    if (!validate(3)) return;
    setLoading(true);
    setTimeout(() => {
      const name = [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" ");
      signIn({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role.trim(),
        accessRole: "Administrador",
        company: form.company.trim(),
        cnpj: form.cnpj,
        phone: form.phone,
        profile: form.profile!,
        plan: ETHERE_PLAN.name,
        remember: true,
        onboarded: false,
      });
      setSettings({
        ...settings,
        plan: ETHERE_PLAN.name,
        subscription: { ...defaultSubscription, status: "trialing" },
        company: { ...settings.company, name: form.company.trim(), cnpj: form.cnpj, email: form.email.trim(), phone: form.phone },
        users: [{ id: uid(), name: name || form.email.trim(), email: form.email.trim(), role: "Administrador" }],
      });
      setLoading(false);
      toast.success("Empresa e usuário administrador criados. Vamos configurar seu ambiente.");
      navigate({ to: "/onboarding" });
    }, 1000);
  }


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/"><EthereLogo /></Link>
          <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Já tenho conta
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-14">
        <Progress step={step} />

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          {step === 0 && (
            <StepShell title="Seus dados" subtitle="Usamos estas informações no seu perfil e nos relatórios.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Nome" value={form.firstName} error={errors.firstName} onChange={(v) => set({ firstName: v })} placeholder="Lucas" />
                <Field label="Sobrenome" value={form.lastName} error={errors.lastName} onChange={(v) => set({ lastName: v })} placeholder="Gomes" />
                <Field label="Cargo" value={form.role} error={errors.role} onChange={(v) => set({ role: v })} placeholder="Diretor de Trading" />
                <Field label="Empresa" value={form.company} error={errors.company} onChange={(v) => set({ company: v })} placeholder="Ethere Ltda." />
                <Field label="CNPJ" value={form.cnpj} error={errors.cnpj} onChange={(v) => set({ cnpj: maskCnpj(v) })} placeholder="00.000.000/0000-00" />
                <Field label="Telefone" value={form.phone} error={errors.phone} onChange={(v) => set({ phone: maskPhone(v) })} placeholder="(11) 99999-9999" />
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Dados de acesso" subtitle="Defina o e-mail corporativo e uma senha segura.">
              <div className="mt-6 space-y-4">
                <Field label="Email corporativo" type="email" value={form.email} error={errors.email} onChange={(v) => set({ email: v })} placeholder="voce@empresa.com" />
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Input
                      type={show ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set({ password: e.target.value })}
                      placeholder="Mínimo de 8 caracteres"
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
                <Field label="Confirmar senha" type={show ? "text" : "password"} value={form.confirm} error={errors.confirm} onChange={(v) => set({ confirm: v })} placeholder="Repita a senha" />
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Qual é o seu perfil?" subtitle="Personalizamos a plataforma para sua operação.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ProfileCard icon={Building2} label="Comercializadora" active={form.profile === "Comercializadora"} onClick={() => set({ profile: "Comercializadora" })} />
                <ProfileCard icon={Wind} label="Fazenda de Energia" active={form.profile === "Fazenda de Energia"} onClick={() => set({ profile: "Fazenda de Energia" })} />
              </div>
              {errors.profile && <p className="mt-3 text-xs text-destructive">{errors.profile}</p>}
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Plano Ethere" subtitle="Um plano único, com tudo incluído. 14 dias de trial sem cartão de crédito.">
              <div className="mt-6 overflow-hidden rounded-2xl border border-brand bg-brand-softer/60 p-6 shadow-blue">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-brand-dark">{ETHERE_PLAN.name}</div>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">{ETHERE_PLAN.description}</p>
                  </div>
                  <div className="whitespace-nowrap text-2xl font-semibold tracking-tight">
                    {ETHERE_PLAN.priceLabel}
                    <span className="text-sm font-normal text-muted-foreground">/{ETHERE_PLAN.interval}</span>
                  </div>
                </div>
                <ul className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {ETHERE_PLAN.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 text-brand" strokeWidth={3} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand-soft bg-brand-softer p-4 text-sm">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-medium text-brand-dark">
                  Ao concluir, criamos sua empresa e seu usuário como Administrador. Cobrança habilitada apenas após o trial.
                </span>
              </div>
            </StepShell>
          )}


          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0 || loading} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < 3 ? (
              <Button onClick={next} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                Continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={loading} className="text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Criando conta…</> : <>Criar conta <ArrowRight className="ml-1 h-4 w-4" /></>}
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
                "grid h-7 w-7 place-items-center rounded-full border text-[11px] font-semibold transition",
                i <= step ? "border-transparent text-white shadow-blue" : "border-border text-muted-foreground",
              )}
              style={i <= step ? { background: "var(--gradient-brand)" } : undefined}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("hidden text-xs font-medium sm:inline", i <= step ? "text-brand-dark" : "text-muted-foreground")}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={cn("h-px flex-1 transition-colors", i < step ? "bg-brand" : "bg-border")} />}
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
        active ? "border-brand bg-brand-softer shadow-blue" : "border-border hover:border-brand-soft hover:bg-brand-softer/50",
      )}
    >
      <div
        className={cn("grid h-11 w-11 place-items-center rounded-xl", active ? "text-white shadow-blue" : "bg-brand-softer text-brand")}
        style={active ? { background: "var(--gradient-brand)" } : undefined}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="mt-4 text-sm font-semibold">{label}</div>
    </button>
  );
}

function PlanOption({ name, price, items, active, featured, onClick }: {
  name: string; price: string; items: string[]; active: boolean; featured?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 text-left transition",
        active ? "border-brand bg-brand-softer shadow-blue" : "border-border hover:border-brand-soft",
      )}
    >
      {featured && <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--gradient-brand)" }} />}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{name}</span>
        {featured && <span className="rounded-full bg-brand-softer px-2 py-0.5 text-[10px] font-semibold text-brand-dark">Recomendado</span>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{price}<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 text-brand" strokeWidth={3} /> {i}
          </li>
        ))}
      </ul>
    </button>
  );
}

function Field({ label, value, onChange, error, ...rest }: {
  label: string; value: string; onChange: (v: string) => void; error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className={cn(error && "border-destructive")} {...rest} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
