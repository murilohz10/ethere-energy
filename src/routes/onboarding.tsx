import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EthereLogo } from "@/components/ethere/logo";
import {
  ArrowLeft, ArrowRight, Bell, BarChart3, Activity, FileText, LayoutGrid, Check, Sparkles, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  maskCnpj, maskPhone, useAlerts, useContracts, useOnboarding, useSession, useSettings,
  type AlertPriority, type Submarket,
} from "@/lib/store";
import { toast } from "sonner";
import { showPlanLimit } from "@/lib/plan-limit";
import { limitMessages } from "@/lib/billing";


export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding · Ethere" },
      { name: "description", content: "Configure seu ambiente na Ethere Energy em poucos passos." },
      { property: "og:title", content: "Onboarding · Ethere" },
      { property: "og:description", content: "Empresa, contratos e alertas configurados em minutos." },
    ],
  }),
  component: Onboarding,
});

const titles = ["Boas-vindas", "Empresa", "Primeiro contrato", "Primeiro alerta", "Tour"];

function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useSession();
  const onboarding = useOnboarding();
  const { settings, setSettings } = useSettings();
  const contracts = useContracts();
  const alerts = useAlerts();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const [company, setCompany] = useState({ name: "", cnpj: "", email: "", phone: "" });
  const [contract, setContract] = useState({
    name: "", company: "", volume: "", price: "", submarket: "SE/CO" as Submarket,
    startDate: new Date().toISOString().slice(0, 10), endDate: "",
  });
  const [alert, setAlert] = useState({ name: "PLD SE/CO acima de R$ 220", threshold: "220", priority: "Alta" as AlertPriority });

  useEffect(() => {
    setCompany({
      name: user?.company || settings.company.name,
      cnpj: user?.cnpj || settings.company.cnpj,
      email: user?.email || settings.company.email,
      phone: user?.phone || settings.company.phone,
    });
  }, [user, settings.company]);

  function finish(skipped = false) {
    setFinishing(true);
    setTimeout(() => {
      onboarding.complete();
      updateUser({ onboarded: true });
      setFinishing(false);
      toast.success(skipped ? "Tutorial pulado. Bem-vindo à Ethere." : "Ambiente configurado. Bem-vindo à Ethere.");
      navigate({ to: "/app" });
    }, 700);
  }

  function saveCompany() {
    setSettings({ ...settings, company });
    updateUser({ company: company.name, cnpj: company.cnpj, phone: company.phone });
    toast.success("Empresa cadastrada.");
    setStep(2);
  }

  function saveContract() {
    if (!contract.name.trim() || !contract.company.trim()) return toast.error("Preencha nome e contraparte do contrato.");
    const okC = contracts.add({
      name: contract.name.trim(),
      company: contract.company.trim(),
      type: "Venda",
      submarket: contract.submarket,
      volume: Number(contract.volume) || 1,
      price: Number(contract.price) || 200,
      startDate: contract.startDate,
      endDate: contract.endDate || "2026-12-31",
      status: "Ativo",
      notes: "Criado no onboarding.",
    });
    if (!okC) return showPlanLimit(limitMessages.contracts(100));
    toast.success("Contrato criado.");
    setStep(3);
  }

  function saveAlert() {
    if (!alert.name.trim()) return toast.error("Informe o nome do alerta.");
    const okA = alerts.add({
      name: alert.name.trim(),
      type: "PLD",
      threshold: Number(alert.threshold) || 0,
      channel: "Email",
      frequency: "Imediato",
      priority: alert.priority,
      enabled: true,
    });
    if (!okA) return showPlanLimit(limitMessages.alerts(5));
    toast.success("Alerta criado.");
    setStep(4);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <EthereLogo />
          <button
            onClick={() => finish(true)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pular tutorial
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2">
          {titles.map((t, i) => (
            <div key={t} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition",
                  i <= step ? "border-transparent text-white shadow-blue" : "border-border text-muted-foreground",
                )}
                style={i <= step ? { background: "var(--gradient-brand)" } : undefined}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < titles.length - 1 && <div className={cn("h-px flex-1 transition-colors", i < step ? "bg-brand" : "bg-border")} />}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          {step === 0 && (
            <Shell title={`Bem-vindo à Ethere Energy${user?.firstName ? `, ${user.firstName}` : ""}.`} subtitle="Sua central de inteligência para o Mercado Livre de Energia.">
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-soft bg-brand-softer p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white shadow-blue" style={{ background: "var(--gradient-brand)" }}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  A Ethere reúne o monitoramento do PLD, a gestão dos seus contratos, alertas inteligentes e análises por IA
                  em um único painel. Em 4 passos rápidos deixamos seu ambiente pronto para uso.
                </p>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                {["Cadastrar sua empresa", "Registrar o primeiro contrato", "Criar o primeiro alerta", "Conhecer as áreas da plataforma"].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-brand" strokeWidth={3} /> {i}
                  </li>
                ))}
              </ul>
            </Shell>
          )}

          {step === 1 && (
            <Shell title="Cadastre sua empresa" subtitle="Estas informações aparecem em relatórios e faturas.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <F label="Razão social" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
                <F label="CNPJ" value={company.cnpj} onChange={(v) => setCompany({ ...company, cnpj: maskCnpj(v) })} />
                <F label="Email corporativo" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
                <F label="Telefone" value={company.phone} onChange={(v) => setCompany({ ...company, phone: maskPhone(v) })} />
              </div>
            </Shell>
          )}

          {step === 2 && (
            <Shell title="Cadastre seu primeiro contrato" subtitle="Você poderá editar ou adicionar novos contratos depois.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <F label="Nome do contrato" value={contract.name} onChange={(v) => setContract({ ...contract, name: v })} placeholder="Suprimento anual Alfa" />
                <F label="Contraparte" value={contract.company} onChange={(v) => setContract({ ...contract, company: v })} placeholder="Alfa Indústria" />
                <div className="space-y-2">
                  <Label>Submercado</Label>
                  <select
                    value={contract.submarket}
                    onChange={(e) => setContract({ ...contract, submarket: e.target.value as Submarket })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors focus:border-brand focus:outline-none"
                  >
                    {["SE/CO", "S", "NE", "N"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <F label="Volume (MWm)" value={contract.volume} onChange={(v) => setContract({ ...contract, volume: v })} placeholder="12" />
                <F label="Preço (R$/MWh)" value={contract.price} onChange={(v) => setContract({ ...contract, price: v })} placeholder="198,50" />
                <F label="Vencimento" type="date" value={contract.endDate} onChange={(v) => setContract({ ...contract, endDate: v })} />
              </div>
            </Shell>
          )}

          {step === 3 && (
            <Shell title="Crie seu primeiro alerta" subtitle="Avisamos você assim que o mercado se mover.">
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <F label="Nome do alerta" value={alert.name} onChange={(v) => setAlert({ ...alert, name: v })} />
                <F label="Limite (R$/MWh)" value={alert.threshold} onChange={(v) => setAlert({ ...alert, threshold: v })} />
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <select
                    value={alert.priority}
                    onChange={(e) => setAlert({ ...alert, priority: e.target.value as AlertPriority })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors focus:border-brand focus:outline-none"
                  >
                    {["Alta", "Média", "Baixa", "Info"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </Shell>
          )}

          {step === 4 && (
            <Shell title="Conheça a plataforma" subtitle="As cinco áreas que você usará no dia a dia.">
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { i: LayoutGrid, t: "Visão Geral", d: "KPIs, insights por IA e resumo do portfólio." },
                  { i: Activity, t: "Monitoramento", d: "PLD por submercado, séries e comparações." },
                  { i: FileText, t: "Contratos", d: "Cadastro, filtros, exportação e vencimentos." },
                  { i: Bell, t: "Alertas", d: "Regras personalizadas por prioridade e canal." },
                  { i: BarChart3, t: "Relatórios", d: "Geração e exportação em PDF e Excel." },
                ].map((a) => (
                  <div key={a.t} className="rounded-xl border border-border bg-surface p-4 transition hover:border-brand-soft">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-softer text-brand">
                        <a.i className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {a.t}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.d}</p>
                  </div>
                ))}
              </div>
            </Shell>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            <Button
              disabled={finishing}
              onClick={() => {
                if (step === 0) return setStep(1);
                if (step === 1) return saveCompany();
                if (step === 2) return saveContract();
                if (step === 3) return saveAlert();
                finish();
              }}
              className="text-white shadow-blue hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
            >
              {finishing ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Finalizando…</> : (
                <>{step === 4 ? "Ir para a dashboard" : "Continuar"} <ArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

function F({ label, value, onChange, ...rest }: {
  label: string; value: string; onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
