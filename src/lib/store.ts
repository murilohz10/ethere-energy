import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "./api/errors";
import {
  alertsRepository, companyRepository, contractsRepository, permissionsRepository,
  reportsRepository, usersRepository,
} from "./api/repositories";
import type { AlertRuleInput } from "./api/types";
import {
  ETHERE_PLAN, defaultSubscription, getPlan, monthKey, withinLimit,
  type Plan, type Subscription, type SubscriptionStatus,
} from "./billing";
import {
  appRoles,
  defaultRolePermissions,
  isPermissionLocked,
  normalizeMatrix,
  normalizeRole,
  setRoleMatrix,
  type AppRole,
  type Permission,
  type RoleMatrix,
} from "./rbac";


/* ---------------------------------- core --------------------------------- */

type Listener = () => void;

function createPersistentStore<T>(key: string, initial: T) {
  let value: T = initial;
  let hydrated = false;
  const listeners = new Set<Listener>();

  const read = () => {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = { ...(initial as object), ...JSON.parse(raw) } as T;
    } catch {
      /* ignore corrupted payloads */
    }
  };

  const persist = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota / private mode */
    }
  };

  const emit = () => listeners.forEach((l) => l());

  return {
    getSnapshot(): T {
      read();
      return value;
    },
    getServerSnapshot(): T {
      return initial;
    },
    set(next: T | ((prev: T) => T)) {
      read();
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      persist();
      emit();
    },
    reset() {
      value = initial;
      persist();
      emit();
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

type Store<T> = ReturnType<typeof createPersistentStore<T>>;

function useStore<T>(store: Store<T>) {
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const set = useCallback((next: T | ((prev: T) => T)) => store.set(next), [store]);
  return [value, set] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

/** Id no formato do banco (uuid), para que a tela e o Supabase usem o mesmo. */
const newId = () => crypto.randomUUID();

/* -------------------------------- contracts ------------------------------- */

export type Submarket = "SE/CO" | "S" | "NE" | "N";
export type ContractType = "Compra" | "Venda";
export type ContractStatus = "Ativo" | "Pendente" | "Encerrado";

export type Contract = {
  id: string;
  code: string;
  name: string;
  company: string;
  type: ContractType;
  submarket: Submarket;
  volume: number;
  price: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  notes: string;
};

const contractsStore = createPersistentStore<{ items: Contract[] }>("ethere.contracts.v2", { items: [] });

export function useContracts() {
  const [state, set] = useStore(contractsStore);
  return {
    contracts: state.items,
    /** Retorna `false` quando o limite do plano impede o cadastro. */
    add: (c: Omit<Contract, "id" | "code">): boolean => {
      if (!withinLimit(currentPlan().limits.contracts, contractsStore.getSnapshot().items.length)) return false;
      const id = newId();
      const code = `C-${1000 + Math.floor(Math.random() * 9000)}`;
      set((s) => ({ items: [{ ...c, id, code }, ...s.items] }));
      push(({ companyId, userId }) =>
        contractsRepository.create(companyId, { ...c, supplier: "", consumer: "" }, code, userId, id),
      );
      return true;
    },
    update: (id: string, patch: Partial<Contract>) => {
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      push(() => contractsRepository.update(id, patch));
    },
    remove: (ids: string[]) => {
      set((s) => ({ items: s.items.filter((i) => !ids.includes(i.id)) }));
      push(() => contractsRepository.remove(ids));
    },
    reset: () => contractsStore.reset(),
  };
}

/* --------------------------------- alerts -------------------------------- */

export type AlertPriority = "Alta" | "Média" | "Baixa" | "Info";

/**
 * Tipos de gatilho suportados. As telas oferecem apenas os tipos relevantes ao
 * perfil da empresa (ver `alertTypesByProfile` em `@/lib/profile`), mas o
 * modelo aceita todos para preservar regras criadas anteriormente.
 */
export type AlertRuleType =
  | "PLD"
  | "Reservatório"
  | "Contrato"
  | "Regulação"
  | "Margem"
  | "Geração"
  | "Receita"
  | "Clima"
  | "Mercado";

export type AlertRule = {
  id: string;
  name: string;
  type: AlertRuleType;
  threshold: number;
  channel: "Email" | "SMS" | "Push";
  frequency: "Imediato" | "Diário" | "Semanal";
  priority: AlertPriority;
  enabled: boolean;
  createdAt: string;
};

const alertsStore = createPersistentStore<{ items: AlertRule[] }>("ethere.alerts.v2", { items: [] });

const alertColumns = ["name", "type", "threshold", "channel", "frequency", "priority", "enabled"] as const;

/** Campos de uma regra que existem como coluna em `alert_rules`. */
function alertFields(rule: Partial<AlertRule>): Partial<AlertRuleInput> {
  const out: Record<string, unknown> = {};
  for (const key of alertColumns) if (rule[key] !== undefined) out[key] = rule[key];
  return out as Partial<AlertRuleInput>;
}

function createAlert(rule: AlertRule) {
  alertsStore.set((s) => ({ items: [rule, ...s.items] }));
  push(({ companyId, userId }) =>
    alertsRepository.create(companyId, { id: rule.id, ...alertFields(rule) } as AlertRuleInput, userId),
  );
}

export function useAlerts() {
  const [state, set] = useStore(alertsStore);
  return {
    alerts: state.items,
    /** Retorna `false` quando o limite do plano impede a criação. */
    add: (a: Omit<AlertRule, "id" | "createdAt">): boolean => {
      if (!withinLimit(currentPlan().limits.alerts, alertsStore.getSnapshot().items.length)) return false;
      createAlert({ ...a, id: newId(), createdAt: new Date().toISOString() });
      return true;
    },
    update: (id: string, patch: Partial<AlertRule>) => {
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
      push(() => alertsRepository.update(id, alertFields(patch)));
    },
    remove: (ids: string[]) => {
      set((s) => ({ items: s.items.filter((i) => !ids.includes(i.id)) }));
      push(() => alertsRepository.remove(ids));
    },
    duplicate: (id: string): boolean => {
      if (!withinLimit(currentPlan().limits.alerts, alertsStore.getSnapshot().items.length)) return false;
      const found = alertsStore.getSnapshot().items.find((i) => i.id === id);
      if (found) {
        createAlert({ ...found, id: newId(), name: `${found.name} (cópia)`, createdAt: new Date().toISOString() });
      }
      return true;
    },
  };
}

/* -------------------------------- reports -------------------------------- */

export type Report = {
  id: string;
  title: string;
  type: "Semanal" | "Mensal" | "Trimestral" | "Personalizado";
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  summary: string;
  /** "basic" = relatório informativo (Core); "pro" = análise aprofundada. */
  tier?: "basic" | "pro";
};

const reportsStore = createPersistentStore<{ items: Report[] }>("ethere.reports.v2", { items: [] });

export function useReports() {
  const [state, set] = useStore(reportsStore);
  return {
    reports: state.items,
    /** Retorna `false` quando o limite mensal do plano foi atingido. */
    add: (r: Omit<Report, "id" | "createdAt" | "tier">): boolean => {
      const plan = currentPlan();
      if (!withinLimit(plan.limits.reportsPerMonth, reportsThisMonth(reportsStore.getSnapshot().items))) return false;
      const tier: Report["tier"] = plan.limits.deepReports ? "pro" : "basic";
      const id = newId();
      set((s) => ({ items: [{ ...r, tier, id, createdAt: new Date().toISOString().slice(0, 10) }, ...s.items] }));
      push(({ companyId, userId }) =>
        reportsRepository.create(companyId, { ...r, payload: { tier } }, userId, id),
      );
      return true;
    },
    remove: (id: string) => {
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      push(() => reportsRepository.remove(id));
    },
  };
}

/* -------------------------------- settings -------------------------------- */

export type TeamUser = {
  id: string; name: string; email: string; role: AppRole;
  /** Recebe notificações de alertas (Core: até 2 usuários). */
  notify?: boolean;
};

/** Relatórios gerados no mês corrente (o contador reinicia a cada mês). */
export function reportsThisMonth(items: Report[], now: Date = new Date()) {
  const key = monthKey(now);
  return items.filter((r) => monthKey(r.createdAt) === key).length;
}

function currentPlan(): Plan {
  return getPlan(settingsStore.getSnapshot().subscription?.planId);
}

export const notifiedCount = (users: TeamUser[]) => users.filter((u) => u.notify).length;

/** Plano vigente e uso atual dos limites. */
export function usePlan() {
  const [settings] = useStore(settingsStore);
  const [contracts] = useStore(contractsStore);
  const [alerts] = useStore(alertsStore);
  const [reports] = useStore(reportsStore);
  const plan = getPlan(settings.subscription?.planId);
  const usage = {
    contracts: contracts.items.length,
    alerts: alerts.items.length,
    reportsThisMonth: reportsThisMonth(reports.items),
    notifiedUsers: notifiedCount(settings.users),
  };
  const l = plan.limits;
  return {
    plan,
    usage,
    isPro: plan.id === "ethere-pro",
    canAddContract: withinLimit(l.contracts, usage.contracts),
    canAddAlert: withinLimit(l.alerts, usage.alerts),
    canAddReport: withinLimit(l.reportsPerMonth, usage.reportsThisMonth),
    canNotifyMore: withinLimit(l.notifiedUsers, usage.notifiedUsers),
  };
}

export type SettingsState = {
  company: { name: string; cnpj: string; email: string; phone: string };
  plan: string;
  subscription: Subscription;
  notifications: Record<string, boolean>;
  preferences: { defaultSubmarket: Submarket; period: string; density: "Confortável" | "Compacta" };
  users: TeamUser[];
};

const settingsStore = createPersistentStore<SettingsState>("ethere.settings.v3", {
  company: { name: "", cnpj: "", email: "", phone: "" },
  plan: ETHERE_PLAN.name,
  subscription: defaultSubscription,
  notifications: {
    "Email para alertas de alta prioridade": true,
    "SMS em movimentos > 5% do PLD": true,
    "Resumo diário por IA": true,
    "Vencimentos de contrato": true,
  },
  preferences: { defaultSubmarket: "SE/CO", period: "30 dias", density: "Confortável" },
  users: [],
});

const companyFields = ["name", "cnpj", "email", "phone"] as const;

/**
 * Envia ao Supabase o que mudou nas configurações: dados da empresa, papel e
 * notificação de cada usuário. Notificações e preferências ainda ficam
 * apenas neste navegador.
 */
function pushSettings(prev: SettingsState, next: SettingsState) {
  const company: Partial<SettingsState["company"]> = {};
  for (const key of companyFields) {
    if (next.company[key] !== prev.company[key]) company[key] = next.company[key];
  }
  if (Object.keys(company).length) {
    push(({ companyId }) => companyRepository.update(companyId, company));
    sessionStore.set((s) =>
      s.user ? { user: { ...s.user, company: next.company.name, cnpj: next.company.cnpj } } : s,
    );
  }

  for (const user of next.users) {
    const before = prev.users.find((u) => u.id === user.id);
    if (!before) continue;
    if (before.role !== user.role) {
      push(({ companyId }) => usersRepository.setRole(user.id, companyId, user.role));
      sessionStore.set((s) =>
        s.user?.id === user.id ? { user: { ...s.user, accessRole: user.role } } : s,
      );
    }
    if (!!before.notify !== !!user.notify) {
      push(() => usersRepository.updateProfile(user.id, { receives_alerts: !!user.notify }));
    }
  }
}

export function useSettings() {
  const [settings] = useStore(settingsStore);
  const setSettings = useCallback((next: SettingsState | ((prev: SettingsState) => SettingsState)) => {
    const prev = settingsStore.getSnapshot();
    settingsStore.set(next);
    pushSettings(prev, settingsStore.getSnapshot());
  }, []);
  return { settings, setSettings };
}

/* -------------------------------- session --------------------------------- */

export type UserProfileKind = "Comercializadora" | "Fazenda de Energia";

export type SessionUser = {
  /** Id do usuário no Supabase Auth. */
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Cargo declarado pelo usuário (texto livre). */
  role: string;
  /** Nível de acesso (RBAC). */
  accessRole: AppRole;
  company: string;
  cnpj: string;
  phone: string;
  profile: UserProfileKind;
  plan: string;
  avatar: string;
  remember: boolean;
  onboarded: boolean;
};

export type Session = SessionUser | null;

export const emptyUser: SessionUser = {
  id: "",
  companyId: "",
  email: "",
  firstName: "",
  lastName: "",
  role: "",
  accessRole: "Administrador",
  company: "",
  cnpj: "",
  phone: "",
  profile: "Comercializadora",
  plan: ETHERE_PLAN.name,
  avatar: "",
  remember: false,
  onboarded: false,
};

const sessionStore = createPersistentStore<{ user: Session }>("ethere.session.v3", { user: null });

/**
 * Altera os dados do usuário logado e grava no Supabase o que tem coluna no
 * banco. E-mail, papel de acesso e plano não mudam por aqui.
 */
function updateSessionUser(patch: Partial<SessionUser>) {
  const allowed = { ...patch };
  for (const key of ["id", "companyId", "email", "accessRole", "plan"] as const) delete allowed[key];
  sessionStore.set((s) => (s.user ? { user: { ...s.user, ...allowed } } : s));

  const profile: Parameters<typeof usersRepository.updateProfile>[1] = {};
  if (allowed.firstName !== undefined) profile.first_name = allowed.firstName;
  if (allowed.lastName !== undefined) profile.last_name = allowed.lastName;
  if (allowed.role !== undefined) profile.job_title = allowed.role;
  if (allowed.phone !== undefined) profile.phone = allowed.phone;
  if (allowed.onboarded !== undefined) profile.onboarded = allowed.onboarded;
  if (Object.keys(profile).length) {
    push(({ userId }) => usersRepository.updateProfile(userId, profile));
  }

  // Só o Administrador pode alterar a empresa (regra do banco).
  if (allowed.company !== undefined || allowed.cnpj !== undefined) {
    const prev = settingsStore.getSnapshot();
    settingsStore.set({
      ...prev,
      company: {
        ...prev.company,
        ...(allowed.company !== undefined ? { name: allowed.company } : {}),
        ...(allowed.cnpj !== undefined ? { cnpj: allowed.cnpj } : {}),
      },
    });
    const next = settingsStore.getSnapshot();
    const changed = next.company.name !== prev.company.name || next.company.cnpj !== prev.company.cnpj;
    if (changed && backendScope()?.isAdmin) {
      push(({ companyId }) =>
        companyRepository.update(companyId, { name: next.company.name, cnpj: next.company.cnpj }),
      );
    }
  }
}

export function useSession() {
  const [state] = useStore(sessionStore);
  return {
    user: state.user,
    isAuthenticated: !!state.user?.id,
    updateUser: updateSessionUser,
    signOut: () => {
      void supabase.auth.signOut();
      clearLocalData();
    },
  };
}

export const initials = (u: Session) =>
  u ? `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.email[0]?.toUpperCase() || "U" : "U";

export const fullName = (u: Session) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email : "";

/* ---------------------------------- rbac ---------------------------------- */

export function useAccessRole(): AppRole {
  const { user } = useSession();
  return normalizeRole(user?.accessRole);
}

const permissionsStore = createPersistentStore<{ matrix: RoleMatrix }>("ethere.permissions.v2", {
  matrix: normalizeMatrix(defaultRolePermissions),
});

/** Mantém o motor de RBAC sincronizado com a matriz persistida. */
setRoleMatrix(permissionsStore.getSnapshot().matrix);
permissionsStore.subscribe(() => setRoleMatrix(permissionsStore.getSnapshot().matrix));

export function useRolePermissions() {
  const [state] = useStore(permissionsStore);
  const matrix = normalizeMatrix(state.matrix);
  return {
    matrix,
    isDefault: JSON.stringify(matrix) === JSON.stringify(normalizeMatrix(defaultRolePermissions)),
    toggle: (role: AppRole, permission: Permission, enabled: boolean) => {
      if (isPermissionLocked(role, permission)) return;
      const current = normalizeMatrix(permissionsStore.getSnapshot().matrix);
      const next = enabled
        ? [...current[role], permission]
        : current[role].filter((p) => p !== permission);
      saveRolePermissions({ ...current, [role]: next }, [role]);
    },
    setRole: (role: AppRole, permissions: Permission[]) =>
      saveRolePermissions(
        { ...normalizeMatrix(permissionsStore.getSnapshot().matrix), [role]: permissions },
        [role],
      ),
    reset: () => saveRolePermissions(defaultRolePermissions, appRoles),
  };
}

/** Aplica a matriz na tela e grava as funções alteradas em `role_permissions`. */
function saveRolePermissions(matrix: Partial<RoleMatrix>, changed: AppRole[]) {
  const next = normalizeMatrix(matrix);
  permissionsStore.set({ matrix: next });
  for (const role of changed) {
    push(({ companyId }) => permissionsRepository.setRole(companyId, role, next[role]));
  }
}

export function useCan() {
  const role = useAccessRole();
  const { matrix } = useRolePermissions();
  return useCallback(
    (permission: Permission) => matrix[role].includes(permission),
    [matrix, role],
  );
}





/* ----------------------------- notifications ------------------------------ */

export type Notification = { id: string; title: string; time: string; read: boolean };

const notificationsStore = createPersistentStore<{ items: Notification[] }>("ethere.notifications.v1", {
  items: [
    { id: "n1", title: "PLD SE/CO ultrapassou R$ 219", time: "há 12 min", read: false },
    { id: "n2", title: "Reservatório SE caiu para 42,1%", time: "há 1h", read: false },
    { id: "n3", title: "Contrato C-1030 vence em 7 dias", time: "hoje", read: false },
    { id: "n4", title: "Relatório semanal disponível", time: "ontem", read: true },
  ],
});

export function useNotifications() {
  const [state, set] = useStore(notificationsStore);
  return {
    notifications: state.items,
    unread: state.items.filter((n) => !n.read).length,
    markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
    markRead: (id: string) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    clear: () => set({ items: [] }),
  };
}

/* ------------------------------ sincronização ----------------------------- */
//
// As telas leem e alteram os stores acima de forma síncrona. O Supabase é a
// fonte da verdade: `syncFromBackend` carrega tudo no login e `push` grava cada
// alteração em seguida. O localStorage funciona só como cache entre recargas.

type BackendScope = { userId: string; companyId: string; isAdmin: boolean };

/** Usuário e empresa da sessão Supabase; `null` quando não há login. */
function backendScope(): BackendScope | null {
  const user = sessionStore.getSnapshot().user;
  if (!user?.id || !user.companyId) return null;
  return { userId: user.id, companyId: user.companyId, isAdmin: user.accessRole === "Administrador" };
}

/**
 * Grava no Supabase uma alteração já aplicada na tela. Se o banco recusar
 * (permissão, limite do plano, rede), avisa o usuário e recarrega os dados.
 */
function push(write: (scope: BackendScope) => Promise<unknown>) {
  const scope = backendScope();
  if (!scope) return;
  write(scope).catch((error: unknown) => {
    toast.error("Não foi possível salvar a alteração.", {
      description: errorMessage(error).replace(/^PLAN_LIMIT:\s*/, ""),
    });
    syncFromBackend(scope.userId).catch(() => undefined);
  });
}

async function listAllContracts(): Promise<Contract[]> {
  const pageSize = 200;
  const items: Contract[] = [];
  for (let page = 1; ; page += 1) {
    const result = await contractsRepository.list({ page, pageSize });
    items.push(...result.items);
    if (items.length >= result.total || !result.items.length) return items;
  }
}

async function loadBackend(userId: string): Promise<SessionUser> {
  const profile = await usersRepository.getProfile(userId);
  const [role, company, contracts, alerts, reports, users, permissions] = await Promise.all([
    usersRepository.getRole(userId),
    companyRepository.get(profile.company_id),
    listAllContracts(),
    alertsRepository.list(),
    reportsRepository.list(),
    usersRepository.list(),
    permissionsRepository.get(),
  ]);

  const plan = getPlan(company.planId);
  const previous = sessionStore.getSnapshot().user;
  const user: SessionUser = {
    id: userId,
    companyId: company.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.job_title,
    // Sem papel no banco, assume o de menor acesso.
    accessRole: normalizeRole(role ?? "Analista"),
    company: company.name,
    cnpj: company.cnpj,
    phone: profile.phone,
    profile: profile.profile_kind === "Fazenda de Energia" ? "Fazenda de Energia" : "Comercializadora",
    plan: plan.name,
    // A foto de perfil ainda fica apenas neste navegador.
    avatar: previous?.id === userId ? previous.avatar : "",
    remember: true,
    onboarded: profile.onboarded,
  };

  sessionStore.set({ user });
  contractsStore.set({ items: contracts });
  alertsStore.set({ items: alerts });
  reportsStore.set({
    items: reports.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      createdAt: r.createdAt,
      summary: r.summary,
      tier: r.payload.tier === "pro" ? "pro" : "basic",
    })),
  });
  settingsStore.set((s) => ({
    ...s,
    company: { name: company.name, cnpj: company.cnpj, email: company.email, phone: company.phone },
    plan: plan.name,
    subscription: {
      ...s.subscription,
      planId: plan.id,
      status: company.subscriptionStatus as SubscriptionStatus,
    },
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, notify: u.notify })),
  }));
  permissionsStore.set({
    matrix: normalizeMatrix(
      Object.keys(permissions).length ? (permissions as Partial<RoleMatrix>) : defaultRolePermissions,
    ),
  });
  onboardingStore.set((s) => ({ ...s, done: profile.onboarded }));
  return user;
}

let syncing: { userId: string; promise: Promise<SessionUser> } | null = null;

/** Carrega do Supabase os dados do usuário e da empresa para os stores. */
export function syncFromBackend(userId: string): Promise<SessionUser> {
  if (syncing?.userId === userId) return syncing.promise;
  const promise = loadBackend(userId).finally(() => {
    if (syncing?.promise === promise) syncing = null;
  });
  syncing = { userId, promise };
  return promise;
}

/** Remove deste navegador tudo o que pertence à sessão encerrada. */
export function clearLocalData() {
  syncing = null;
  sessionStore.reset();
  contractsStore.reset();
  alertsStore.reset();
  reportsStore.reset();
  settingsStore.reset();
  permissionsStore.reset();
  onboardingStore.reset();
  try {
    window.localStorage.removeItem("ethere.intelligence.v1");
  } catch {
    /* modo privado */
  }
}

/* --------------------------------- utils ---------------------------------- */

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
};

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => escape(r[h])).join(";"))].join("\n");
}

/* ------------------------------- onboarding ------------------------------- */

const onboardingStore = createPersistentStore<{ done: boolean; step: number }>("ethere.onboarding.v2", {
  done: false,
  step: 0,
});

export function useOnboarding() {
  const [state, set] = useStore(onboardingStore);
  return {
    ...state,
    setStep: (step: number) => set((s) => ({ ...s, step })),
    complete: () => set({ done: true, step: 5 }),
    restart: () => set({ done: false, step: 0 }),
  };
}

/* -------------------------------- validation ------------------------------ */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
export const isStrongPassword = (v: string) => v.length >= 8;
export const isPhone = (v: string) => v.replace(/\D/g, "").length >= 10;
export const isCnpj = (v: string) => v.replace(/\D/g, "").length === 14;

export const maskCnpj = (v: string) =>
  v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");

export const maskPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

/* -------------------------------- insights -------------------------------- */

export type Insight = { id: string; tone: "positive" | "warning" | "neutral"; title: string; body: string };

export function buildInsights(contracts: Contract[], alerts: AlertRule[], firstName?: string): Insight[] {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const activeAlerts = alerts.filter((a) => a.enabled).length;
  const now = Date.now();
  const expiring = contracts
    .filter((c) => c.status !== "Encerrado")
    .map((c) => ({ c, days: Math.ceil((new Date(`${c.endDate}T00:00:00`).getTime() - now) / 86400000) }))
    .filter((x) => x.days > 0 && x.days <= 60)
    .sort((a, b) => a.days - b.days);
  const volume = contracts.filter((c) => c.status === "Ativo").reduce((s, c) => s + c.volume, 0);
  const revenue = contracts
    .filter((c) => c.status === "Ativo" && c.type === "Venda")
    .reduce((s, c) => s + c.volume * c.price * 730, 0);

  const list: Insight[] = [
    {
      id: "greet",
      tone: "neutral",
      title: `${greeting}${firstName ? `, ${firstName}` : ""}!`,
      body: "O PLD SE/CO apresenta tendência de alta moderada nas próximas 48 horas.",
    },
  ];

  if (expiring[0]) {
    list.push({
      id: "expiring",
      tone: "warning",
      title: `Contrato ${expiring[0].c.code} vence em ${expiring[0].days} dias`,
      body: `${expiring[0].c.name} · ${expiring[0].c.company}. Avalie a renovação antecipada.`,
    });
  }

  list.push({
    id: "alerts",
    tone: activeAlerts ? "positive" : "warning",
    title: activeAlerts ? `Você possui ${activeAlerts} alertas ativos` : "Nenhum alerta ativo",
    body: activeAlerts
      ? "As regras estão monitorando PLD, reservatórios e vencimentos em tempo real."
      : "Crie um alerta para ser avisado sobre movimentos relevantes do mercado.",
  });

  list.push({
    id: "volatility",
    tone: "warning",
    title: "Maior volatilidade prevista entre 18h e 21h",
    body: "Concentração de carga no horário de ponta deve pressionar o preço no submercado SE/CO.",
  });

  list.push({
    id: "revenue",
    tone: "positive",
    title: "Receita estimada aumentou 7% em relação ao mês anterior",
    body: `Portfólio ativo de ${volume.toFixed(1)} MWm, com receita projetada de ${brl(revenue)}.`,
  });

  return list;
}
