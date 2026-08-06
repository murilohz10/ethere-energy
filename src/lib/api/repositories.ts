/**
 * Repositories — acesso a dados. Nenhuma regra de negócio aqui.
 *
 * O isolamento entre empresas é garantido pelo banco (RLS + `company_id`),
 * de modo que nenhuma consulta pode atravessar workspaces mesmo por engano.
 */

import { supabase } from "@/integrations/supabase/client";
import { toAppError } from "./errors";
import {
  mapAlertEvent, mapAlertRule, mapAttachment, mapAuditLog, mapCompany, mapConsumption,
  mapContract, mapInsight, mapReport, mapTeamUser,
} from "./mappers";
import type {
  AlertEvent, AlertRule, AlertRuleInput, Attachment, AuditLog, Company, Consumption,
  Contract, ContractInput, ContractQuery, Paginated, Report, StoredInsight, TeamUser,
} from "./types";

function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  if (result.data === null) throw toAppError({ code: "PGRST116" });
  return result.data;
}

/* ------------------------------- contratos -------------------------------- */

const sortColumn: Record<NonNullable<ContractQuery["sortBy"]>, string> = {
  code: "code",
  name: "name",
  volume: "volume",
  price: "price",
  endDate: "end_date",
  createdAt: "created_at",
};

export const contractsRepository = {
  async list(query: ContractQuery = {}): Promise<Paginated<Contract>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(200, Math.max(5, query.pageSize ?? 50));
    let q = supabase.from("contracts").select("*", { count: "exact" });

    if (query.search) {
      const term = `%${query.search.replace(/[%,]/g, "")}%`;
      q = q.or(
        `code.ilike.${term},name.ilike.${term},supplier.ilike.${term},consumer.ilike.${term},counterparty.ilike.${term}`,
      );
    }
    if (query.status && query.status !== "Todos") q = q.eq("status", query.status);
    if (query.type && query.type !== "Todos") q = q.eq("type", query.type);
    if (query.submarket && query.submarket !== "Todos") q = q.eq("submarket", query.submarket);

    const column = sortColumn[query.sortBy ?? "createdAt"];
    q = q.order(column, { ascending: (query.sortDir ?? "desc") === "asc", nullsFirst: false });
    q = q.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await q;
    if (error) throw toAppError(error);
    return {
      items: (data ?? []).map(mapContract),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<Contract> {
    const row = unwrap(await supabase.from("contracts").select("*").eq("id", id).maybeSingle());
    return mapContract(row);
  },

  async create(companyId: string, input: ContractInput, code: string, userId: string) {
    const row = unwrap(
      await supabase
        .from("contracts")
        .insert({
          company_id: companyId,
          code,
          name: input.name,
          supplier: input.supplier,
          consumer: input.consumer,
          counterparty: input.company || input.consumer || input.supplier,
          type: input.type,
          submarket: input.submarket,
          volume: input.volume,
          price: input.price,
          start_date: input.startDate || null,
          end_date: input.endDate || null,
          status: input.status,
          notes: input.notes,
          created_by: userId,
        })
        .select("*")
        .single(),
    );
    return mapContract(row);
  },

  async update(id: string, patch: Partial<ContractInput>) {
    const row = unwrap(
      await supabase
        .from("contracts")
        .update({
          ...(patch.code !== undefined ? { code: patch.code } : {}),
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.supplier !== undefined ? { supplier: patch.supplier } : {}),
          ...(patch.consumer !== undefined ? { consumer: patch.consumer } : {}),
          ...(patch.company !== undefined ? { counterparty: patch.company } : {}),
          ...(patch.type !== undefined ? { type: patch.type } : {}),
          ...(patch.submarket !== undefined ? { submarket: patch.submarket } : {}),
          ...(patch.volume !== undefined ? { volume: patch.volume } : {}),
          ...(patch.price !== undefined ? { price: patch.price } : {}),
          ...(patch.startDate !== undefined ? { start_date: patch.startDate || null } : {}),
          ...(patch.endDate !== undefined ? { end_date: patch.endDate || null } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        })
        .eq("id", id)
        .select("*")
        .single(),
    );
    return mapContract(row);
  },

  async remove(ids: string[]) {
    const { error } = await supabase.from("contracts").delete().in("id", ids);
    if (error) throw toAppError(error);
  },

  async countByStatus(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from("contracts").select("status");
    if (error) throw toAppError(error);
    return (data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
  },
};

/* --------------------------------- alertas -------------------------------- */

export const alertsRepository = {
  async list(): Promise<AlertRule[]> {
    const { data, error } = await supabase
      .from("alert_rules")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw toAppError(error);
    return (data ?? []).map(mapAlertRule);
  },

  async create(companyId: string, input: AlertRuleInput, userId: string) {
    const row = unwrap(
      await supabase
        .from("alert_rules")
        .insert({ company_id: companyId, created_by: userId, ...input })
        .select("*")
        .single(),
    );
    return mapAlertRule(row);
  },

  async update(id: string, patch: Partial<AlertRuleInput>) {
    const row = unwrap(
      await supabase.from("alert_rules").update(patch).eq("id", id).select("*").single(),
    );
    return mapAlertRule(row);
  },

  async remove(ids: string[]) {
    const { error } = await supabase.from("alert_rules").delete().in("id", ids);
    if (error) throw toAppError(error);
  },
};

export const alertEventsRepository = {
  async list(limit = 50): Promise<AlertEvent[]> {
    const { data, error } = await supabase
      .from("alert_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return (data ?? []).map(mapAlertEvent);
  },

  async createMany(
    companyId: string,
    events: {
      title: string;
      message: string;
      level: string;
      source: string;
      dedupeKey?: string;
      contractId?: string | null;
      ruleId?: string | null;
    }[],
  ) {
    if (!events.length) return;
    const { error } = await supabase.from("alert_events").upsert(
      events.map((e) => ({
        company_id: companyId,
        title: e.title,
        message: e.message,
        level: e.level,
        source: e.source,
        dedupe_key: e.dedupeKey ?? null,
        contract_id: e.contractId ?? null,
        rule_id: e.ruleId ?? null,
      })),
      { onConflict: "company_id,dedupe_key", ignoreDuplicates: true },
    );
    if (error) throw toAppError(error);
  },

  async markRead(ids: string[]) {
    const { error } = await supabase.from("alert_events").update({ read: true }).in("id", ids);
    if (error) throw toAppError(error);
  },

  async markAllRead() {
    const { error } = await supabase.from("alert_events").update({ read: true }).eq("read", false);
    if (error) throw toAppError(error);
  },

  async clear() {
    const { error } = await supabase.from("alert_events").delete().eq("read", true);
    if (error) throw toAppError(error);
  },
};

/* ------------------------------- relatórios -------------------------------- */

export const reportsRepository = {
  async list(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw toAppError(error);
    return (data ?? []).map(mapReport);
  },

  async create(
    companyId: string,
    input: {
      title: string;
      type: string;
      periodStart: string;
      periodEnd: string;
      summary: string;
      payload: Record<string, unknown>;
    },
    userId: string,
  ) {
    const row = unwrap(
      await supabase
        .from("reports")
        .insert({
          company_id: companyId,
          title: input.title,
          type: input.type,
          period_start: input.periodStart || null,
          period_end: input.periodEnd || null,
          summary: input.summary,
          payload: input.payload as never,
          created_by: userId,
        })
        .select("*")
        .single(),
    );
    return mapReport(row);
  },

  async remove(id: string) {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) throw toAppError(error);
  },
};

/* -------------------------------- consumos -------------------------------- */

export const consumptionsRepository = {
  async list(limit = 24): Promise<Consumption[]> {
    const { data, error } = await supabase
      .from("consumptions")
      .select("*")
      .order("reference_month", { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return (data ?? []).map(mapConsumption);
  },
};

/* -------------------------------- insights -------------------------------- */

export const insightsRepository = {
  async list(limit = 40): Promise<StoredInsight[]> {
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(limit);
    if (error) throw toAppError(error);
    return (data ?? []).map(mapInsight);
  },

  async replaceAll(
    companyId: string,
    items: {
      level: string;
      category: string;
      title: string;
      description: string;
      impact: string;
      recommendation: string;
    }[],
  ) {
    const { error: delError } = await supabase
      .from("insights")
      .delete()
      .eq("company_id", companyId);
    if (delError) throw toAppError(delError);
    if (!items.length) return;
    const { error } = await supabase
      .from("insights")
      .insert(items.map((i) => ({ company_id: companyId, ...i })));
    if (error) throw toAppError(error);
  },
};

/* -------------------------------- anexos ---------------------------------- */

export const attachmentsRepository = {
  async list(entityType?: string, entityId?: string): Promise<Attachment[]> {
    let q = supabase.from("attachments").select("*").order("created_at", { ascending: false });
    if (entityType) q = q.eq("entity_type", entityType);
    if (entityId) q = q.eq("entity_id", entityId);
    const { data, error } = await q;
    if (error) throw toAppError(error);
    return (data ?? []).map(mapAttachment);
  },

  async register(
    companyId: string,
    input: {
      entityType: string;
      entityId: string | null;
      docType: string;
      storagePath: string;
      fileName: string;
      mimeType: string | null;
      sizeBytes: number | null;
    },
    userId: string,
  ) {
    const row = unwrap(
      await supabase
        .from("attachments")
        .insert({
          company_id: companyId,
          entity_type: input.entityType,
          entity_id: input.entityId,
          doc_type: input.docType,
          storage_path: input.storagePath,
          file_name: input.fileName,
          mime_type: input.mimeType,
          size_bytes: input.sizeBytes,
          uploaded_by: userId,
        })
        .select("*")
        .single(),
    );
    return mapAttachment(row);
  },

  async remove(id: string, storagePath: string) {
    await supabase.storage.from("company-files").remove([storagePath]);
    const { error } = await supabase.from("attachments").delete().eq("id", id);
    if (error) throw toAppError(error);
  },
};

/* -------------------------------- auditoria ------------------------------- */

export const auditRepository = {
  async list(filters: { action?: string; search?: string; limit?: number } = {}): Promise<AuditLog[]> {
    let q = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Math.min(500, filters.limit ?? 200));
    if (filters.action && filters.action !== "Todas") q = q.eq("action", filters.action);
    if (filters.search) {
      const term = `%${filters.search.replace(/[%,]/g, "")}%`;
      q = q.or(`user_email.ilike.${term},description.ilike.${term},entity_type.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) throw toAppError(error);
    return (data ?? []).map(mapAuditLog);
  },
};

/* --------------------------- empresa e usuários --------------------------- */

export const companyRepository = {
  async get(companyId: string): Promise<Company> {
    const row = unwrap(
      await supabase.from("companies").select("*").eq("id", companyId).maybeSingle(),
    );
    return mapCompany(row);
  },

  async update(companyId: string, patch: Partial<Company>) {
    const row = unwrap(
      await supabase
        .from("companies")
        .update({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.cnpj !== undefined ? { cnpj: patch.cnpj || null } : {}),
          ...(patch.email !== undefined ? { email: patch.email } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
          ...(patch.segment !== undefined ? { segment: patch.segment } : {}),
        })
        .eq("id", companyId)
        .select("*")
        .single(),
    );
    return mapCompany(row);
  },
};

export const usersRepository = {
  async list(): Promise<TeamUser[]> {
    const [{ data: profiles, error }, { data: roles, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw toAppError(error);
    if (roleError) throw toAppError(roleError);
    const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role as string]));
    return (profiles ?? []).map((p) => mapTeamUser(p, roleByUser.get(p.id)));
  },

  async getProfile(userId: string) {
    return unwrap(await supabase.from("profiles").select("*").eq("id", userId).maybeSingle());
  },

  async updateProfile(
    userId: string,
    patch: {
      first_name?: string;
      last_name?: string;
      job_title?: string;
      phone?: string;
      avatar_url?: string | null;
      onboarded?: boolean;
      active?: boolean;
      last_seen_at?: string;
    },
  ) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) throw toAppError(error);
  },

  async getRole(userId: string): Promise<string | undefined> {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw toAppError(error);
    return data?.role;
  },
};

export const permissionsRepository = {
  async get(): Promise<Record<string, string[]>> {
    const { data, error } = await supabase.from("role_permissions").select("role, permissions");
    if (error) throw toAppError(error);
    return (data ?? []).reduce<Record<string, string[]>>((acc, row) => {
      acc[row.role] = row.permissions ?? [];
      return acc;
    }, {});
  },

  async setRole(companyId: string, role: string, permissions: string[]) {
    const { error } = await supabase
      .from("role_permissions")
      .upsert(
        { company_id: companyId, role: role as never, permissions, updated_at: new Date().toISOString() },
        { onConflict: "company_id,role" },
      );
    if (error) throw toAppError(error);
  },
};
