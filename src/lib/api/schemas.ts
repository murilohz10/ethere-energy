/**
 * Validações e sanitização (camada de Validations).
 *
 * Toda entrada de usuário passa por aqui antes de chegar ao banco.
 */

import { z } from "zod";
import { appRoles } from "@/lib/rbac";
import { contractStatuses, contractTypes, submarkets } from "./types";

/** Remove caracteres de controle e limita o tamanho. */
export function sanitizeText(value: string, max = 500): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

const text = (max: number) =>
  z.string().transform((v) => sanitizeText(v, max));

const requiredText = (max: number, field: string) =>
  text(max).refine((v) => v.length > 0, { message: `Informe ${field}.` });

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Data inválida." });

export const contractSchema = z
  .object({
    code: text(40).optional(),
    name: requiredText(140, "o nome do contrato"),
    company: text(140).optional().default(""),
    supplier: requiredText(140, "o fornecedor"),
    consumer: requiredText(140, "o consumidor"),
    type: z.enum(contractTypes as [string, ...string[]]),
    submarket: z.enum(submarkets as [string, ...string[]]),
    volume: z.coerce.number().min(0, "Volume inválido.").max(100000),
    price: z.coerce.number().min(0, "Preço inválido.").max(1000000),
    startDate: isoDate,
    endDate: isoDate,
    status: z.enum(contractStatuses as [string, ...string[]]),
    notes: text(2000).optional().default(""),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "O vencimento deve ser posterior ao início.",
    path: ["endDate"],
  });

export const alertRuleSchema = z.object({
  name: requiredText(140, "o nome do alerta"),
  type: z.enum(["PLD", "Reservatório", "Contrato", "Regulação"]),
  threshold: z.coerce.number().min(0).max(1000000),
  channel: z.enum(["Email", "SMS", "Push"]),
  frequency: z.enum(["Imediato", "Diário", "Semanal"]),
  priority: z.enum(["Alta", "Média", "Baixa", "Info"]),
  enabled: z.boolean(),
});

export const reportSchema = z.object({
  title: requiredText(160, "o título do relatório"),
  type: z.enum(["Semanal", "Mensal", "Trimestral", "Personalizado"]),
  scope: z.enum(["Resumo Executivo", "Contratos", "Usuários", "Alertas", "Insights"]),
  periodStart: isoDate,
  periodEnd: isoDate,
});

export const companySchema = z.object({
  name: requiredText(140, "o nome da empresa"),
  cnpj: text(20).optional().default(""),
  email: z.string().email("E-mail inválido.").max(180).or(z.literal("")),
  phone: text(24).optional().default(""),
  segment: text(80).optional().default(""),
});

export const teamMemberSchema = z.object({
  name: requiredText(120, "o nome"),
  email: z.string().email("E-mail inválido.").max(180),
  role: z.enum(appRoles as [string, ...string[]]),
  jobTitle: text(80).optional().default(""),
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres.").max(72),
});

export const profileSchema = z.object({
  firstName: requiredText(80, "o nome"),
  lastName: text(80).optional().default(""),
  jobTitle: text(80).optional().default(""),
  phone: text(24).optional().default(""),
});

export const signUpSchema = z.object({
  email: z.string().email("E-mail inválido.").max(180),
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres.").max(72),
  firstName: requiredText(80, "o nome"),
  lastName: text(80).optional().default(""),
  jobTitle: text(80).optional().default(""),
  phone: text(24).optional().default(""),
  companyName: requiredText(140, "o nome da empresa"),
  cnpj: text(20).optional().default(""),
  profileKind: z.enum(["Comercializadora", "Fazenda de Energia"]),
});

/** Converte um `ZodError` em `{ campo: mensagem }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
