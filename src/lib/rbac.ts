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

export const rolePermissions: Record<AppRole, Permission[]> = {
  Administrador: adminPermissions,
  Gestor: managerPermissions,
  Analista: analystPermissions,
};

export function normalizeRole(role?: string | null): AppRole {
  if (role === "Gestor" || role === "Analista" || role === "Administrador") return role;
  return "Administrador";
}

export function can(role: AppRole | undefined | null, permission: Permission): boolean {
  return rolePermissions[normalizeRole(role)].includes(permission);
}

export function canAny(role: AppRole | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Rotas do app e a permissão exigida. `null` = livre para qualquer sessão. */
export const routePermissions: { path: string; exact?: boolean; permission: Permission | null }[] = [
  { path: "/app", exact: true, permission: "dashboard:view" },
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
