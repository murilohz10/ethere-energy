/**
 * Conversores entre as linhas do banco (snake_case) e os modelos de domínio.
 */

import type { Database } from "@/integrations/supabase/types";
import { normalizeRole } from "@/lib/rbac";
import type {
  AlertEvent, AlertPriority, AlertRule, Attachment, AuditLog, Company, Consumption,
  Contract, ContractStatus, ContractType, Report, ReportType, StoredInsight, Submarket, TeamUser,
} from "./types";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export function mapContract(row: Row<"contracts">): Contract {
  return {
    id: row.id,
    companyId: row.company_id,
    code: row.code,
    name: row.name,
    company: row.counterparty || row.consumer || row.supplier || "",
    supplier: row.supplier,
    consumer: row.consumer,
    type: row.type as ContractType,
    submarket: row.submarket as Submarket,
    volume: Number(row.volume),
    price: Number(row.price),
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status: row.status as ContractStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAlertRule(row: Row<"alert_rules">): AlertRule {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    type: row.type as AlertRule["type"],
    threshold: Number(row.threshold),
    channel: row.channel as AlertRule["channel"],
    frequency: row.frequency as AlertRule["frequency"],
    priority: row.priority as AlertPriority,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export function mapAlertEvent(row: Row<"alert_events">): AlertEvent {
  return {
    id: row.id,
    companyId: row.company_id,
    ruleId: row.rule_id,
    contractId: row.contract_id,
    source: row.source,
    level: row.level as AlertPriority,
    title: row.title,
    message: row.message,
    read: row.read,
    resolved: row.resolved,
    createdAt: row.created_at,
  };
}

export function mapReport(row: Row<"reports">): Report {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    type: row.type as ReportType,
    periodStart: row.period_start ?? "",
    periodEnd: row.period_end ?? "",
    summary: row.summary,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export function mapConsumption(row: Row<"consumptions">): Consumption {
  return {
    id: row.id,
    companyId: row.company_id,
    contractId: row.contract_id,
    referenceMonth: row.reference_month,
    volumeMwh: Number(row.volume_mwh),
    cost: Number(row.cost),
    source: row.source,
  };
}

export function mapInsight(row: Row<"insights">): StoredInsight {
  return {
    id: row.id,
    companyId: row.company_id,
    level: row.level,
    category: row.category,
    title: row.title,
    description: row.description,
    impact: row.impact,
    recommendation: row.recommendation,
    generatedAt: row.generated_at,
  };
}

export function mapAttachment(row: Row<"attachments">): Attachment {
  return {
    id: row.id,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    docType: row.doc_type,
    bucket: row.bucket,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export function mapAuditLog(row: Row<"audit_logs">): AuditLog {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    userEmail: row.user_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export function mapCompany(row: Row<"companies">): Company {
  return {
    id: row.id,
    name: row.name,
    cnpj: row.cnpj ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    segment: row.segment ?? "",
    planId: row.plan_id,
    subscriptionStatus: row.subscription_status,
  };
}

export function mapTeamUser(
  row: Row<"profiles">,
  role: string | undefined,
): TeamUser {
  return {
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email,
    email: row.email,
    role: normalizeRole(role),
    jobTitle: row.job_title,
    active: row.active,
    notify: row.receives_alerts,
    createdAt: row.created_at,
  };
}
