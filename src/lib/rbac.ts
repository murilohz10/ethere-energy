/**
 * RBAC — Role-Based Access Control da Ethere Energy.
 *
 * Estrutura extensível: para adicionar uma nova permissão basta incluí-la em
 * `Permission` e distribuí-la em `rolePermissions`. Para uma nova rota
 * protegida, adicione uma entrada em `routePermissions`.
 */

export type AppRole = "Administrador" | "Gestor" | "Analista";

export const appRoles: AppRole[] = ["Administrador", "Gestor", "Analista"];

export const roleDescriptions: Record<AppRole, string> = {
  Administrador: "Acesso completo: usuários, assinatura e dados da empresa.",
  Gestor: "Acesso operacional: contratos, monitoramento, relatórios e alertas.",
  Analista: "Somente leitura de dashboards, monitoramento, relatórios e alertas.",
};

export type Permission =
  | "dashboard:view"
  | "insights:view"
  | "monitoring:view"
  | "contracts:view"
  | "contracts:create"
  | "contracts:edit"
  | "contracts:delete"
  | "alerts:view"
  | "alerts:manage"
  | "reports:view"
  | "reports:create"
  | "reports:export"
  | "settings:view"
  | "company:edit"
  | "users:manage"
  | "billing:manage";

const analystPermissions: Permission[] = [
  "dashboard:view",
  "insights:view",
  "monitoring:view",
  "alerts:view",
  "reports:view",
];


const managerPermissions: Permission[] = [
  ...analystPermissions,
  "contracts:view",
  "contracts:create",
  "contracts:edit",
  "alerts:manage",
  "reports:create",
  "reports:export",
];

const adminPermissions: Permission[] = [
  ...managerPermissions,
  "contracts:delete",
  "settings:view",
  "company:edit",
  "users:manage",
  "billing:manage",
];

/** Matriz padrão (código). Serve de base e de "restaurar padrões" na UI. */
export const defaultRolePermissions: Record<AppRole, Permission[]> = {
  Administrador: adminPermissions,
  Gestor: managerPermissions,
  Analista: analystPermissions,
};

/** @deprecated use `getRoleMatrix()` — mantido para compatibilidade. */
export const rolePermissions = defaultRolePermissions;

/** Grupos e rótulos usados na tela de gerenciamento de permissões. */
export const permissionGroups = [
  "Visão geral",
  "Contratos",
  "Alertas",
  "Relatórios",
  "Administração",
] as const;

export type PermissionGroup = (typeof permissionGroups)[number];

export const permissionMeta: Record<Permission, { label: string; description: string; group: PermissionGroup }> = {
  "dashboard:view": { label: "Ver dashboard", description: "Acessa KPIs, insights e páginas de métricas.", group: "Visão geral" },
  "insights:view": { label: "Ver central de inteligência", description: "Acessa insights inteligentes e recomendações estratégicas.", group: "Visão geral" },
  "monitoring:view": { label: "Ver monitoramento", description: "Acompanha PLD, curvas e reservatórios.", group: "Visão geral" },
  "contracts:view": { label: "Ver contratos", description: "Lista e consulta contratos da carteira.", group: "Contratos" },
  "contracts:create": { label: "Criar contratos", description: "Cadastra novos contratos.", group: "Contratos" },
  "contracts:edit": { label: "Editar contratos", description: "Altera dados de contratos existentes.", group: "Contratos" },
  "contracts:delete": { label: "Excluir contratos", description: "Remove contratos definitivamente.", group: "Contratos" },
  "alerts:view": { label: "Ver alertas", description: "Consulta alertas configurados e disparos.", group: "Alertas" },
  "alerts:manage": { label: "Gerenciar alertas", description: "Cria, edita, ativa e remove alertas.", group: "Alertas" },
  "reports:view": { label: "Ver relatórios", description: "Consulta relatórios gerados.", group: "Relatórios" },
  "reports:create": { label: "Gerar relatórios", description: "Cria novos relatórios.", group: "Relatórios" },
  "reports:export": { label: "Exportar relatórios", description: "Baixa em PDF, CSV e Excel.", group: "Relatórios" },
  "settings:view": { label: "Ver configurações", description: "Acessa a área de configurações.", group: "Administração" },
  "company:edit": { label: "Editar empresa", description: "Altera dados cadastrais da empresa.", group: "Administração" },
  "users:manage": { label: "Gerenciar usuários", description: "Cadastra membros e define funções.", group: "Administração" },
  "billing:manage": { label: "Gerenciar assinatura", description: "Plano, pagamento e cancelamento.", group: "Administração" },
};

export const allPermissions = Object.keys(permissionMeta) as Permission[];

/**
 * Permissões que não podem ser removidas de uma função (evita lockout).
 * O Administrador é sempre soberano.
 */
export const lockedPermissions: Partial<Record<AppRole, Permission[]>> = {
  Administrador: allPermissions,
};

export type RoleMatrix = Record<AppRole, Permission[]>;

export function normalizeMatrix(matrix: Partial<RoleMatrix> | null | undefined): RoleMatrix {
  const out = {} as RoleMatrix;
  for (const role of appRoles) {
    const base = matrix?.[role] ?? defaultRolePermissions[role];
    const locked = lockedPermissions[role] ?? [];
    out[role] = allPermissions.filter((p) => locked.includes(p) || base.includes(p));
  }
  return out;
}

let activeMatrix: RoleMatrix = normalizeMatrix(defaultRolePermissions);

/** Aplica a matriz vigente (persistida pelo store) ao motor de permissões. */
export function setRoleMatrix(matrix: Partial<RoleMatrix> | null | undefined) {
  activeMatrix = normalizeMatrix(matrix);
}

export function getRoleMatrix(): RoleMatrix {
  return activeMatrix;
}

export function isPermissionLocked(role: AppRole, permission: Permission): boolean {
  return (lockedPermissions[role] ?? []).includes(permission);
}

export function normalizeRole(role?: string | null): AppRole {
  if (role === "Gestor" || role === "Analista" || role === "Administrador") return role;
  return "Administrador";
}

export function can(role: AppRole | undefined | null, permission: Permission): boolean {
  return activeMatrix[normalizeRole(role)].includes(permission);
}

export function canAny(role: AppRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}


/** Rotas do app e a permissão exigida. `null` = livre para qualquer sessão. */
export const routePermissions: { path: string; exact?: boolean; permission: Permission | null }[] = [
  { path: "/app", exact: true, permission: "dashboard:view" },
  { path: "/app/insights", permission: "insights:view" },
  { path: "/app/intelligence", permission: null },
  { path: "/app/monitoramento", permission: "monitoring:view" },
  { path: "/app/contratos", permission: "contracts:view" },
  { path: "/app/alertas", permission: "alerts:view" },
  { path: "/app/relatorios", permission: "reports:view" },
  { path: "/app/configuracoes", permission: "settings:view" },
  { path: "/app/metricas", permission: "dashboard:view" },
  { path: "/app/perfil", permission: null },
  { path: "/app/acesso-negado", permission: null },
];

export function permissionForPath(pathname: string): Permission | null {
  const clean = pathname.replace(/\/+$/, "") || "/app";
  const match = routePermissions.find((r) =>
    r.exact ? clean === r.path : clean === r.path || clean.startsWith(`${r.path}/`),
  );
  return match ? match.permission : null;
}

export function canAccessPath(role: AppRole | undefined | null, pathname: string): boolean {
  const permission = permissionForPath(pathname);
  return permission === null ? true : can(role, permission);
}
