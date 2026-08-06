/**
 * Modelos de domínio (Models) da Ethere Energy.
 *
 * Toda a aplicação trabalha com estes tipos; a conversão de/para as linhas do
 * banco fica isolada em `mappers.ts`.
 */

import type { AppRole } from "@/lib/rbac";

export type Submarket = "SE/CO" | "S" | "NE" | "N";
export type ContractType = "Compra" | "Venda";
export type ContractStatus = "Ativo" | "Pendente" | "Encerrado";

export const submarkets: Submarket[] = ["SE/CO", "S", "NE", "N"];
export const contractTypes: ContractType[] = ["Compra", "Venda"];
export const contractStatuses: ContractStatus[] = ["Ativo", "Pendente", "Encerrado"];

export type Contract = {
  id: string;
  companyId: string;
  /** Número do contrato. */
  code: string;
  name: string;
  /** Contraparte principal (mantido para compatibilidade das telas). */
  company: string;
  supplier: string;
  consumer: string;
  type: ContractType;
  submarket: Submarket;
  /** Volume contratado em MW médios. */
  volume: number;
  /** Preço em R$/MWh. */
  price: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractInput = Omit<
  Contract,
  "id" | "companyId" | "createdAt" | "updatedAt" | "code"
> & { code?: string };

export type AlertPriority = "Alta" | "Média" | "Baixa" | "Info";
export type AlertType = "PLD" | "Reservatório" | "Contrato" | "Regulação";
export type AlertChannel = "Email" | "SMS" | "Push";
export type AlertFrequency = "Imediato" | "Diário" | "Semanal";

export type AlertRule = {
  id: string;
  companyId: string;
  name: string;
  type: AlertType;
  threshold: number;
  channel: AlertChannel;
  frequency: AlertFrequency;
  priority: AlertPriority;
  enabled: boolean;
  createdAt: string;
};

export type AlertRuleInput = Omit<AlertRule, "id" | "companyId" | "createdAt">;

export type AlertEvent = {
  id: string;
  companyId: string;
  ruleId: string | null;
  contractId: string | null;
  source: string;
  level: AlertPriority;
  title: string;
  message: string;
  read: boolean;
  resolved: boolean;
  createdAt: string;
};

export type ReportType = "Semanal" | "Mensal" | "Trimestral" | "Personalizado";
export type ReportScope = "Resumo Executivo" | "Contratos" | "Usuários" | "Alertas" | "Insights";

export const reportScopes: ReportScope[] = [
  "Resumo Executivo",
  "Contratos",
  "Usuários",
  "Alertas",
  "Insights",
];

export type Report = {
  id: string;
  companyId: string;
  title: string;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type Consumption = {
  id: string;
  companyId: string;
  contractId: string | null;
  referenceMonth: string;
  volumeMwh: number;
  cost: number;
  source: string;
};

export type StoredInsight = {
  id: string;
  companyId: string;
  level: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  generatedAt: string;
};

export type Attachment = {
  id: string;
  companyId: string;
  entityType: string;
  entityId: string | null;
  docType: string;
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.login_failed"
  | "contract.create"
  | "contract.update"
  | "contract.delete"
  | "contract.duplicate"
  | "alert.create"
  | "alert.update"
  | "alert.delete"
  | "report.create"
  | "report.delete"
  | "report.export"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "settings.update"
  | "permissions.update"
  | "company.update"
  | "insight.generate"
  | "file.upload";

export const auditActionLabels: Record<string, string> = {
  "auth.login": "Login realizado",
  "auth.logout": "Logout realizado",
  "auth.login_failed": "Falha de login",
  "contract.create": "Contrato criado",
  "contract.update": "Contrato editado",
  "contract.delete": "Contrato excluído",
  "contract.duplicate": "Contrato duplicado",
  "alert.create": "Alerta criado",
  "alert.update": "Alerta atualizado",
  "alert.delete": "Alerta excluído",
  "report.create": "Relatório gerado",
  "report.delete": "Relatório excluído",
  "report.export": "Exportação realizada",
  "user.create": "Usuário cadastrado",
  "user.update": "Usuário atualizado",
  "user.delete": "Usuário removido",
  "settings.update": "Configurações alteradas",
  "permissions.update": "Permissões alteradas",
  "company.update": "Dados da empresa alterados",
  "insight.generate": "Insights gerados",
  "file.upload": "Arquivo enviado",
};

export type AuditLog = {
  id: string;
  companyId: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  segment: string;
  planId: string;
  subscriptionStatus: string;
};

export type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  jobTitle: string;
  active: boolean;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ContractQuery = {
  search?: string;
  status?: ContractStatus | "Todos";
  type?: ContractType | "Todos";
  submarket?: Submarket | "Todos";
  sortBy?: "code" | "name" | "volume" | "price" | "endDate" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};
