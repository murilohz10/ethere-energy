import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
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
import { useSettings, usePlan, notifiedCount, useSession, useRolePermissions, uid, type SettingsState, type Submarket } from "@/lib/store";
import {
  appRoles, roleDescriptions, allPermissions, permissionGroups, permissionMeta, isPermissionLocked,
  type AppRole,
} from "@/lib/rbac";
import { PLAN_LIST, getPlan, formatPlanPrice, limitMessages, subscriptionStatusLabel, type PlanId } from "@/lib/billing";
import { showPlanLimit } from "@/lib/plan-limit";

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
  const planInfo = usePlan();

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && tabs.some((x) => x.k === t)) setTab(t as (typeof tabs)[number]["k"]);
  }, []);

  const changePlan = (id: PlanId) => {
    const next = getPlan(id);
    if (next.limits.notifiedUsers !== null && notifiedCount(settings.users) > next.limits.notifiedUsers) {
      return toast.error(limitMessages.notified(next.limits.notifiedUsers), { description: "Ajuste os usuários notificados antes de mudar para o Core." });
    }
    setSettings({ ...settings, plan: next.name, subscription: { ...settings.subscription, planId: id, status: "active" } });
    if (user) signIn({ ...user, plan: next.name });
    toast.success(`Plano alterado para ${next.name}`, { description: "Simulação: nenhuma cobrança foi realizada." });
  };

  const toggleNotify = (id: string, on: boolean) => {
    if (on && !planInfo.canNotifyMore) return showPlanLimit(limitMessages.notified(2));
    setSettings({ ...settings, users: settings.users.map((x) => (x.id === id ? { ...x, notify: on } : x)) });
  };

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
            <Section title="Assinatura" desc="Plano atual, uso e faturamento. Ambos os planos incluem dados CCEE, ONS e ANA.">
              <div className="mb-4 text-sm text-muted-foreground">
                {subscriptionStatusLabel(settings.subscription.status)}
                {settings.subscription.renewsAt ? ` · Renova em ${settings.subscription.renewsAt}` : ""}
                {planInfo.plan.limits.contracts !== null && (
                  <> · Uso: {planInfo.usage.contracts}/100 contratos · {planInfo.usage.alerts}/5 alertas · {planInfo.usage.reportsThisMonth}/3 relatórios este mês · {planInfo.usage.notifiedUsers}/2 usuários notificados</>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {PLAN_LIST.map((p) => {
                  const current = p.id === planInfo.plan.id;
                  const pro = p.id === "ethere-pro";
                  return (
                    <div key={p.id} className={cn("relative rounded-xl border p-5", pro ? "border-brand-soft bg-brand-softer/40" : "border-border")}>
                      {pro && <span className="absolute right-4 top-4 rounded-full bg-brand-softer px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-dark">Mais completo</span>}
                      <div className="text-lg font-medium">{p.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{formatPlanPrice(p)}</div>
                      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        {p.features.map((f) => <li key={f}>• {f}</li>)}
                      </ul>
                      <div className="mt-5">
                        {current ? (
                          <span className="text-xs font-medium text-brand-dark">Plano atual</span>
                        ) : (
                          <Button
                            size="sm"
                            variant={pro ? "default" : "outline"}
                            className={pro ? "text-white shadow-blue hover:opacity-95" : ""}
                            style={pro ? { background: "var(--gradient-brand)" } : undefined}
                            onClick={() => changePlan(p.id)}
                          >
                            {pro ? "Fazer upgrade para o Pro" : "Mudar para o Core"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.info("Pagamentos via Stripe serão habilitados em breve.")}>
                  Gerenciar pagamento
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelPlan(true)}>Cancelar assinatura</Button>
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
            <Section title="Usuários" desc={planInfo.plan.limits.notifiedUsers === null ? "Cadastre, edite e remova membros, defina o nível de acesso e quem recebe alertas." : `Cadastre, edite e remova membros. No Ethere Core, até 2 usuários recebem notificações de alertas (${planInfo.usage.notifiedUsers}/2).`}>
              <ul className="divide-y divide-border">
                {settings.users.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={!!u.notify} onCheckedChange={(v) => toggleNotify(u.id, v)} aria-label={`Notificações de alertas para ${u.name}`} />
                        Alertas
                      </label>
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

          {tab === "permissoes" && <PermissionsMatrix />}


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

function PermissionsMatrix() {
  const { matrix, isDefault, toggle, setRole, reset } = useRolePermissions();
  const { settings } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);

  const usersByRole = (role: AppRole) => settings.users.filter((u) => u.role === role).length;

  return (
    <Section title="Permissões por função" desc="Visualize e ajuste o que cada nível de acesso pode fazer. As mudanças valem para todos os usuários da função.">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {appRoles.map((r) => (
          <div key={r} className="rounded-xl border border-border bg-surface-muted/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{r}</span>
              <span className="rounded-md bg-brand-softer px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                {matrix[r].length}/{allPermissions.length}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{roleDescriptions[r]}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {usersByRole(r)} usuário{usersByRole(r) === 1 ? "" : "s"} nesta função
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Permissão</th>
              {appRoles.map((r) => (
                <th key={r} className="px-4 py-3 text-center font-medium">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map((group) => {
              const perms = allPermissions.filter((p) => permissionMeta[p].group === group);
              if (perms.length === 0) return null;
              return (
                <Fragment key={group}>
                  <tr className="border-b border-border bg-surface-muted/20">
                    <td colSpan={appRoles.length + 1} className="px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {perms.map((p) => (
                    <tr key={p} className="border-b border-border last:border-0 transition hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{permissionMeta[p].label}</div>
                        <div className="text-xs text-muted-foreground">{permissionMeta[p].description}</div>
                        <code className="mt-1 inline-block text-[10px] text-muted-foreground/80">{p}</code>
                      </td>
                      {appRoles.map((r) => {
                        const locked = isPermissionLocked(r, p);
                        return (
                          <td key={r} className="px-4 py-3 text-center">
                            <Switch
                              checked={matrix[r].includes(p)}
                              disabled={locked}
                              aria-label={`${permissionMeta[p].label} para ${r}`}
                              onCheckedChange={(v) => {
                                toggle(r, p, v);
                                toast.success(`${permissionMeta[p].label} ${v ? "liberada" : "removida"} para ${r}`);
                              }}
                            />
                            {locked && <div className="mt-1 text-[10px] text-muted-foreground">fixo</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {appRoles.filter((r) => !isPermissionLocked(r, "dashboard:view")).map((r) => (
          <Button
            key={r}
            size="sm"
            variant="outline"
            onClick={() => {
              setRole(r, [...allPermissions]);
              toast.success(`Todas as permissões liberadas para ${r}`);
            }}
          >
            Liberar tudo · {r}
          </Button>
        ))}
        <Button size="sm" variant="ghost" disabled={isDefault} onClick={() => setConfirmReset(true)}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar padrões
        </Button>
        {!isDefault && <span className="text-xs text-muted-foreground">Matriz personalizada em uso.</span>}
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar permissões padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as personalizações da matriz serão descartadas e as funções voltarão à configuração original.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { reset(); toast.success("Permissões restauradas ao padrão"); }}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
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
