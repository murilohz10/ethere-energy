import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ethere/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, CreditCard, Bell, Users, Lock, SlidersHorizontal, Trash2, Eye, EyeOff, ShieldCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, useSession, useRolePermissions, uid, type SettingsState, type Submarket } from "@/lib/store";
import {
  appRoles, roleDescriptions, allPermissions, permissionGroups, permissionMeta, isPermissionLocked,
  type AppRole, type Permission,
} from "@/lib/rbac";
import { ETHERE_PLAN, formatPlanPrice, subscriptionStatusLabel } from "@/lib/billing";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Ethere" }] }),
  component: SettingsPage,
});

const tabs = [
  { k: "empresa", l: "Empresa", i: Building2 },
  { k: "assinatura", l: "Assinatura", i: CreditCard },
  { k: "notificacoes", l: "Notificações", i: Bell },
  { k: "preferencias", l: "Preferências", i: SlidersHorizontal },
  { k: "usuarios", l: "Usuários", i: Users },
  { k: "permissoes", l: "Permissões", i: ShieldCheck },
  { k: "seguranca", l: "Segurança", i: Lock },
] as const;




function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { user, signIn } = useSession();
  const [tab, setTab] = useState<(typeof tabs)[number]["k"]>("empresa");
  const [draft, setDraft] = useState<SettingsState>(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  useEffect(() => setDraft(settings), [settings]);

  const save = () => {
    setSettings(draft);
    if (user) signIn({ ...user, company: draft.company.name, email: draft.company.email });
    toast.success("Alterações salvas", { description: "Suas configurações foram atualizadas." });
  };
  const cancel = () => { setDraft(settings); toast("Alterações descartadas"); };

  const [userForm, setUserForm] = useState<{ open: boolean; id: string | null; name: string; email: string; role: AppRole }>({
    open: false, id: null, name: "", email: "", role: "Analista",
  });
  const [removeUser, setRemoveUser] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", show: false });
  const [cancelPlan, setCancelPlan] = useState(false);

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
                tab === t.k ? "bg-brand-softer font-medium text-brand-dark" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
                <Field label="Razão social" value={draft.company.name} onChange={(v) => setDraft({ ...draft, company: { ...draft.company, name: v } })} />
                <Field label="CNPJ" value={draft.company.cnpj} onChange={(v) => setDraft({ ...draft, company: { ...draft.company, cnpj: v } })} />
                <Field label="Email" value={draft.company.email} onChange={(v) => setDraft({ ...draft, company: { ...draft.company, email: v } })} />
                <Field label="Telefone" value={draft.company.phone} onChange={(v) => setDraft({ ...draft, company: { ...draft.company, phone: v } })} />
              </div>
              <SaveBar dirty={dirty} onSave={save} onCancel={cancel} />
            </Section>
          )}

          {tab === "assinatura" && (
            <Section title="Assinatura" desc="Plano atual e faturamento.">
              <div className="rounded-xl border border-border p-5">
                <div className="text-xs text-muted-foreground">Plano</div>
                <div className="mt-1 text-lg font-medium">{ETHERE_PLAN.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatPlanPrice(ETHERE_PLAN)} · {subscriptionStatusLabel(settings.subscription.status)}
                  {settings.subscription.renewsAt ? ` · Renova em ${settings.subscription.renewsAt}` : ""}
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {ETHERE_PLAN.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="text-white shadow-blue hover:opacity-95"
                    style={{ background: "var(--gradient-brand)" }}
                    onClick={() => toast.info("Pagamentos via Stripe serão habilitados em breve.")}
                  >
                    Gerenciar pagamento
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCancelPlan(true)}>Cancelar assinatura</Button>
                </div>
              </div>
            </Section>
          )}


          {tab === "notificacoes" && (
            <Section title="Notificações" desc="Escolha como deseja ser avisado.">
              <div className="space-y-4">
                {Object.keys(draft.notifications).map((l) => (
                  <div key={l} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                    <span className="text-sm">{l}</span>
                    <Switch
                      checked={draft.notifications[l]}
                      onCheckedChange={(v) => setDraft({ ...draft, notifications: { ...draft.notifications, [l]: v } })}
                    />
                  </div>
                ))}
              </div>
              <SaveBar dirty={dirty} onSave={save} onCancel={cancel} />
            </Section>
          )}

          {tab === "preferencias" && (
            <Section title="Preferências" desc="Padrões aplicados aos painéis e gráficos.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Submercado padrão</Label>
                  <Select value={draft.preferences.defaultSubmarket} onValueChange={(v) => setDraft({ ...draft, preferences: { ...draft.preferences, defaultSubmarket: v as Submarket } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["SE/CO", "S", "NE", "N"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período padrão</Label>
                  <Select value={draft.preferences.period} onValueChange={(v) => setDraft({ ...draft, preferences: { ...draft.preferences, period: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["7 dias", "30 dias", "60 dias", "180 dias"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Densidade das tabelas</Label>
                  <Select value={draft.preferences.density} onValueChange={(v) => setDraft({ ...draft, preferences: { ...draft.preferences, density: v as "Confortável" | "Compacta" } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Confortável", "Compacta"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <SaveBar dirty={dirty} onSave={save} onCancel={cancel} />
            </Section>
          )}

          {tab === "usuarios" && (
            <Section title="Usuários" desc="Cadastre, edite e remova membros e defina o nível de acesso.">
              <ul className="divide-y divide-border">
                {settings.users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={u.role}
                        onValueChange={(role) => {
                          setSettings({
                            ...settings,
                            users: settings.users.map((x) => (x.id === u.id ? { ...x, role: role as AppRole } : x)),
                          });
                          toast.success(`Permissão de ${u.name} atualizada para ${role}`);
                        }}
                      >
                        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {appRoles.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => setUserForm({ open: true, id: u.id, name: u.name, email: u.email, role: u.role })}>
                        Editar
                      </Button>
                      <button onClick={() => setRemoveUser(u.id)} aria-label={`Remover ${u.name}`} className="rounded-md p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-2 rounded-xl border border-border bg-surface-muted/40 p-4 text-xs text-muted-foreground">
                {appRoles.map((r) => (
                  <div key={r}>
                    <span className="font-medium text-foreground">{r}:</span> {roleDescriptions[r]}
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={() => setUserForm({ open: true, id: null, name: "", email: "", role: "Analista" })} className="mt-4 text-white shadow-blue hover:opacity-95" style={{ background: "var(--gradient-brand)" }}>
                Cadastrar usuário
              </Button>
            </Section>
          )}


          {tab === "seguranca" && (
            <Section title="Segurança" desc="Proteja o acesso à sua conta.">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha atual</Label>
                  <Input type={pwd.show ? "text" : "password"} value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <div className="relative">
                    <Input type={pwd.show ? "text" : "password"} value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} placeholder="••••••••" className="pr-10" />
                    <button
                      type="button"
                      onClick={() => setPwd({ ...pwd, show: !pwd.show })}
                      aria-label={pwd.show ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    >
                      {pwd.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!pwd.current) return toast.error("Informe a senha atual.");
                    if (pwd.next.length < 8) return toast.error("A nova senha deve ter ao menos 8 caracteres.");
                    setPwd({ current: "", next: "", show: false });
                    toast.success("Senha atualizada com sucesso");
                  }}
                  className="text-white shadow-blue hover:opacity-95"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  Atualizar senha
                </Button>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <div className="text-sm font-medium">Autenticação em dois fatores</div>
                    <div className="text-xs text-muted-foreground">Recomendado para contas corporativas.</div>
                  </div>
                  <Switch
                    checked={settings.twoFactor}
                    onCheckedChange={(v) => { setSettings({ ...settings, twoFactor: v }); toast.success(v ? "2FA ativado" : "2FA desativado"); }}
                  />
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* create / edit user */}
      <Dialog open={userForm.open} onOpenChange={(o) => setUserForm({ ...userForm, open: o })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{userForm.id ? "Editar usuário" : "Cadastrar usuário"}</DialogTitle>
            <DialogDescription>Defina os dados de acesso e o nível de permissão.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="pessoa@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={userForm.role} onValueChange={(role) => setUserForm({ ...userForm, role: role as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{appRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{roleDescriptions[userForm.role]}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserForm({ ...userForm, open: false })}>Cancelar</Button>
            <Button
              className="text-white shadow-blue hover:opacity-95"
              style={{ background: "var(--gradient-brand)" }}
              onClick={() => {
                if (!userForm.name.trim()) return toast.error("Informe o nome.");
                if (!/^\S+@\S+\.\S+$/.test(userForm.email)) return toast.error("Informe um email válido.");
                if (userForm.id) {
                  setSettings({
                    ...settings,
                    users: settings.users.map((u) =>
                      u.id === userForm.id ? { ...u, name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role } : u,
                    ),
                  });
                  toast.success("Usuário atualizado");
                } else {
                  setSettings({
                    ...settings,
                    users: [...settings.users, { id: uid(), name: userForm.name.trim(), email: userForm.email.trim(), role: userForm.role }],
                  });
                  toast.success("Usuário cadastrado");
                }
                setUserForm({ open: false, id: null, name: "", email: "", role: "Analista" });
              }}
            >
              {userForm.id ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>





      <AlertDialog open={!!removeUser} onOpenChange={(o) => !o && setRemoveUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>O acesso à plataforma será revogado imediatamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setSettings({ ...settings, users: settings.users.filter((u) => u.id !== removeUser) });
                setRemoveUser(null);
                toast.success("Usuário removido");
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelPlan} onOpenChange={setCancelPlan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>Você mantém acesso até o fim do ciclo atual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter plano</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={() => toast.success("Cancelamento agendado para 12/04")}>
              Cancelar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SaveBar({ dirty, onSave, onCancel }: { dirty: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-8 flex items-center gap-2 border-t border-border pt-6">
      <Button size="sm" disabled={!dirty} onClick={onSave} className="text-white shadow-blue hover:opacity-95 disabled:opacity-40" style={{ background: "var(--gradient-brand)" }}>
        Salvar alterações
      </Button>
      <Button size="sm" variant="ghost" disabled={!dirty} onClick={onCancel}>Cancelar</Button>
      {dirty && <span className="text-xs text-muted-foreground">Você tem alterações não salvas.</span>}
    </div>
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
