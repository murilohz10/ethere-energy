import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, CreditCard, Bell, Users, Lock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Ethere" }] }),
  component: Settings,
});

const tabs = [
  { k: "empresa", l: "Empresa", i: Building2 },
  { k: "assinatura", l: "Assinatura", i: CreditCard },
  { k: "notificacoes", l: "Notificações", i: Bell },
  { k: "usuarios", l: "Usuários", i: Users },
  { k: "seguranca", l: "Segurança", i: Lock },
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof tabs)[number]["k"]>("empresa");
  return (
    <>
      <PageHeader title="Configurações" description="Gerencie sua conta, plano e preferências." />
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                tab === t.k ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.i className="h-4 w-4" strokeWidth={1.75} />
              {t.l}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-border bg-card p-8">
          {tab === "empresa" && (
            <Section title="Dados da empresa" desc="Aparecem em relatórios e faturas.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Razão social" defaultValue="Ethere Ltda." />
                <Field label="CNPJ" defaultValue="12.345.678/0001-90" />
                <Field label="Email" defaultValue="contato@ethere.com" />
                <Field label="Telefone" defaultValue="+55 11 3000-0000" />
              </div>
            </Section>
          )}
          {tab === "assinatura" && (
            <Section title="Assinatura" desc="Plano atual e faturamento.">
              <div className="rounded-xl border border-border p-5">
                <div className="text-xs text-muted-foreground">Plano</div>
                <div className="mt-1 text-lg font-medium">Professional</div>
                <div className="mt-1 text-sm text-muted-foreground">R$ 3.990 / mês · Renova em 12/04</div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">Alterar plano</Button>
                  <Button size="sm" variant="ghost">Cancelar</Button>
                </div>
              </div>
            </Section>
          )}
          {tab === "notificacoes" && (
            <Section title="Notificações" desc="Escolha como deseja ser avisado.">
              <div className="space-y-4">
                {["Email para alertas de alta prioridade", "SMS em movimentos > 5% do PLD", "Resumo diário por IA", "Vencimentos de contrato"].map((l) => (
                  <div key={l} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                    <span className="text-sm">{l}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </Section>
          )}
          {tab === "usuarios" && (
            <Section title="Usuários" desc="Convide e gerencie sua equipe.">
              <ul className="divide-y divide-border">
                {[
                  { n: "Lucas Gomes", e: "lucas@ethere.com", r: "Admin" },
                  { n: "Marina Alves", e: "marina@ethere.com", r: "Analista" },
                  { n: "Rafael Silva", e: "rafael@ethere.com", r: "Trader" },
                ].map((u) => (
                  <li key={u.e} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium">{u.n}</div>
                      <div className="text-xs text-muted-foreground">{u.e}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.r}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-4 bg-[#2563EB] text-white hover:bg-[#1d4ed8]">Convidar usuário</Button>
            </Section>
          )}
          {tab === "seguranca" && (
            <Section title="Segurança" desc="Proteja o acesso à sua conta.">
              <div className="space-y-4">
                <Field label="Senha atual" type="password" placeholder="••••••••" />
                <Field label="Nova senha" type="password" placeholder="••••••••" />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <div className="text-sm font-medium">Autenticação em dois fatores</div>
                    <div className="text-xs text-muted-foreground">Recomendado para contas corporativas.</div>
                  </div>
                  <Switch />
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-6">{children}</div>
    </div>
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
