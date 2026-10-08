/**
 * Contexto enviado ao Ethere Intelligence a cada mensagem.
 * Compartilhado entre o navegador (montagem) e o servidor (validação).
 */
import { z } from "zod";

export const responseLevels = ["Rápido", "Detalhado", "Técnico", "Completo"] as const;
export type ResponseLevel = (typeof responseLevels)[number];

export const pageLabels: Record<string, string> = {
  "/app": "Visão Geral",
  "/app/insights": "Central de Inteligência",
  "/app/monitoramento": "Monitoramento",
  "/app/contratos": "Contratos",
  "/app/alertas": "Alertas",
  "/app/relatorios": "Relatórios",
  "/app/configuracoes": "Configurações",
  "/app/perfil": "Meu perfil",
  "/app/intelligence": "Ethere Intelligence",
};

export const pageLabel = (path: string) =>
  pageLabels[path] ?? (path.startsWith("/app/metricas") ? "Detalhe de indicador" : "Plataforma");

const contractSchema = z.object({
  code: z.string().max(40),
  name: z.string().max(160),
  company: z.string().max(160),
  type: z.string().max(20),
  submarket: z.string().max(10),
  volume: z.number(),
  price: z.number(),
  startDate: z.string().max(12),
  endDate: z.string().max(12),
  status: z.string().max(20),
});

const alertSchema = z.object({
  name: z.string().max(160),
  type: z.string().max(30),
  threshold: z.number(),
  priority: z.string().max(10),
  enabled: z.boolean(),
});

export const companyContextSchema = z.object({
  companyName: z.string().max(160),
  profile: z.enum(["Comercializadora", "Fazenda de Energia"]),
  plan: z.string().max(40),
  page: z.string().max(80),
  level: z.enum(responseLevels),
  contracts: z.array(contractSchema).max(2000),
  alerts: z.array(alertSchema).max(500),
});

export type CompanyContext = z.infer<typeof companyContextSchema>;
