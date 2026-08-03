import { useCallback, useSyncExternalStore } from "react";

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

const seedContracts: Contract[] = [
  { id: "c1", code: "C-1042", name: "Suprimento anual Alfa", company: "Alfa Indústria", type: "Venda", submarket: "SE/CO", volume: 12, price: 198.5, startDate: "2025-01-01", endDate: "2026-12-31", status: "Ativo", notes: "" },
  { id: "c2", code: "C-1039", name: "Compra flexível Beta", company: "Beta Química", type: "Compra", submarket: "S", volume: 8.4, price: 205.1, startDate: "2025-02-01", endDate: "2026-07-31", status: "Ativo", notes: "" },
  { id: "c3", code: "C-1035", name: "Contrato Gama Papel", company: "Gama Papel", type: "Venda", submarket: "SE/CO", volume: 5.2, price: 189.9, startDate: "2025-03-01", endDate: "2027-03-31", status: "Ativo", notes: "" },
  { id: "c4", code: "C-1030", name: "Fornecimento Delta", company: "Delta Cimento", type: "Venda", submarket: "NE", volume: 14.7, price: 179, startDate: "2024-11-01", endDate: "2025-11-30", status: "Pendente", notes: "Renovação em negociação." },
  { id: "c5", code: "C-1026", name: "Hedge Ômega", company: "Ômega Metais", type: "Compra", submarket: "SE/CO", volume: 9.1, price: 210.4, startDate: "2025-05-01", endDate: "2027-05-31", status: "Ativo", notes: "" },
  { id: "c6", code: "C-1021", name: "Sigma sazonal", company: "Sigma Alimentos", type: "Venda", submarket: "S", volume: 3.8, price: 195, startDate: "2024-01-01", endDate: "2026-01-31", status: "Encerrado", notes: "" },
];

const contractsStore = createPersistentStore<{ items: Contract[] }>("ethere.contracts.v1", { items: seedContracts });

export function useContracts() {
  const [state, set] = useStore(contractsStore);
  return {
    contracts: state.items,
    add: (c: Omit<Contract, "id" | "code">) =>
      set((s) => ({ items: [{ ...c, id: uid(), code: `C-${1000 + Math.floor(Math.random() * 9000)}` }, ...s.items] })),
    update: (id: string, patch: Partial<Contract>) =>
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
    remove: (ids: string[]) => set((s) => ({ items: s.items.filter((i) => !ids.includes(i.id)) })),
    reset: () => contractsStore.reset(),
  };
}

/* --------------------------------- alerts -------------------------------- */

export type AlertPriority = "Alta" | "Média" | "Baixa" | "Info";
export type AlertRule = {
  id: string;
  name: string;
  type: "PLD" | "Reservatório" | "Contrato" | "Regulação";
  threshold: number;
  channel: "Email" | "SMS" | "Push";
  frequency: "Imediato" | "Diário" | "Semanal";
  priority: AlertPriority;
  enabled: boolean;
  createdAt: string;
};

const seedAlerts: AlertRule[] = [
  { id: "a1", name: "PLD SE/CO acima de R$ 220", type: "PLD", threshold: 220, channel: "Email", frequency: "Imediato", priority: "Alta", enabled: true, createdAt: "2025-03-18T10:00:00Z" },
  { id: "a2", name: "Reservatório SE abaixo de 40%", type: "Reservatório", threshold: 40, channel: "Email", frequency: "Diário", priority: "Média", enabled: true, createdAt: "2025-03-17T10:00:00Z" },
  { id: "a3", name: "Contratos vencendo em 7 dias", type: "Contrato", threshold: 7, channel: "Push", frequency: "Diário", priority: "Média", enabled: true, createdAt: "2025-03-15T10:00:00Z" },
  { id: "a4", name: "Novas resoluções ANEEL", type: "Regulação", threshold: 0, channel: "Email", frequency: "Semanal", priority: "Info", enabled: false, createdAt: "2025-03-10T10:00:00Z" },
  { id: "a5", name: "Tendência de queda no PLD S", type: "PLD", threshold: 180, channel: "SMS", frequency: "Imediato", priority: "Baixa", enabled: true, createdAt: "2025-03-08T10:00:00Z" },
];

const alertsStore = createPersistentStore<{ items: AlertRule[] }>("ethere.alerts.v1", { items: seedAlerts });

export function useAlerts() {
  const [state, set] = useStore(alertsStore);
  return {
    alerts: state.items,
    add: (a: Omit<AlertRule, "id" | "createdAt">) =>
      set((s) => ({ items: [{ ...a, id: uid(), createdAt: new Date().toISOString() }, ...s.items] })),
    update: (id: string, patch: Partial<AlertRule>) =>
      set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
    remove: (ids: string[]) => set((s) => ({ items: s.items.filter((i) => !ids.includes(i.id)) })),
    duplicate: (id: string) =>
      set((s) => {
        const found = s.items.find((i) => i.id === id);
        if (!found) return s;
        return { items: [{ ...found, id: uid(), name: `${found.name} (cópia)`, createdAt: new Date().toISOString() }, ...s.items] };
      }),
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
};

const seedReports: Report[] = [
  { id: "r1", title: "Relatório Semanal · Semana 12", type: "Semanal", periodStart: "2025-03-10", periodEnd: "2025-03-16", createdAt: "2025-03-18", summary: "Consolidado com PLD, exposição, contratos e sinais gerados por IA." },
  { id: "r2", title: "Relatório Semanal · Semana 11", type: "Semanal", periodStart: "2025-03-03", periodEnd: "2025-03-09", createdAt: "2025-03-11", summary: "Consolidado com PLD, exposição, contratos e sinais gerados por IA." },
  { id: "r3", title: "Relatório Mensal · Fevereiro", type: "Mensal", periodStart: "2025-02-01", periodEnd: "2025-02-28", createdAt: "2025-03-01", summary: "Fechamento mensal com curva de PLD e resultado por contrato." },
  { id: "r4", title: "Relatório Mensal · Janeiro", type: "Mensal", periodStart: "2025-01-01", periodEnd: "2025-01-31", createdAt: "2025-02-01", summary: "Fechamento mensal com curva de PLD e resultado por contrato." },
  { id: "r5", title: "Relatório Trimestral · Q4 2024", type: "Trimestral", periodStart: "2024-10-01", periodEnd: "2024-12-31", createdAt: "2025-01-10", summary: "Visão trimestral de exposição, hedge e performance do portfólio." },
];

const reportsStore = createPersistentStore<{ items: Report[] }>("ethere.reports.v1", { items: seedReports });

export function useReports() {
  const [state, set] = useStore(reportsStore);
  return {
    reports: state.items,
    add: (r: Omit<Report, "id" | "createdAt">) =>
      set((s) => ({ items: [{ ...r, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }, ...s.items] })),
    remove: (id: string) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  };
}

/* -------------------------------- settings -------------------------------- */

export type TeamUser = { id: string; name: string; email: string; role: AppRole };

export type SettingsState = {
  company: { name: string; cnpj: string; email: string; phone: string };
  plan: string;
  subscription: Subscription;
  notifications: Record<string, boolean>;
  preferences: { defaultSubmarket: Submarket; period: string; density: "Confortável" | "Compacta" };
  users: TeamUser[];
  twoFactor: boolean;
};

const settingsStore = createPersistentStore<SettingsState>("ethere.settings.v2", {
  company: { name: "Ethere Ltda.", cnpj: "12.345.678/0001-90", email: "contato@ethere.com", phone: "+55 11 3000-0000" },
  plan: ETHERE_PLAN.name,
  subscription: defaultSubscription,
  notifications: {
    "Email para alertas de alta prioridade": true,
    "SMS em movimentos > 5% do PLD": true,
    "Resumo diário por IA": true,
    "Vencimentos de contrato": true,
  },
  preferences: { defaultSubmarket: "SE/CO", period: "30 dias", density: "Confortável" },
  users: [
    { id: "u1", name: "Lucas Gomes", email: "lucas@ethere.com", role: "Administrador" },
    { id: "u2", name: "Marina Alves", email: "marina@ethere.com", role: "Gestor" },
    { id: "u3", name: "Rafael Silva", email: "rafael@ethere.com", role: "Analista" },
  ],
  twoFactor: false,
});

export function useSettings() {
  const [settings, set] = useStore(settingsStore);
  return { settings, setSettings: set };
}

/* -------------------------------- session --------------------------------- */

export type UserProfileKind = "Comercializadora" | "Fazenda de Energia";

export type SessionUser = {
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

const sessionStore = createPersistentStore<{ user: Session }>("ethere.session.v2", { user: null });

export function useSession() {
  const [state, set] = useStore(sessionStore);
  return {
    user: state.user,
    isAuthenticated: !!state.user,
    signIn: (user: Partial<SessionUser> & { email: string }) =>
      set({ user: { ...emptyUser, ...user } }),
    updateUser: (patch: Partial<SessionUser>) =>
      set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
    signOut: () => set({ user: null }),
  };
}

export const initials = (u: Session) =>
  u ? `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.email[0]?.toUpperCase() || "U" : "U";

export const fullName = (u: Session) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email : "";


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

const onboardingStore = createPersistentStore<{ done: boolean; step: number }>("ethere.onboarding.v1", {
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
