/**
 * Tratamento de erros da camada de dados.
 *
 * Toda falha de banco, rede ou validação é convertida em `AppError`, com uma
 * mensagem amigável em português pronta para exibição na interface.
 */

export type AppErrorCode =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "network"
  | "unknown";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Record<string, string>;

  constructor(code: AppErrorCode, message: string, details?: Record<string, string>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

const friendly: Record<AppErrorCode, string> = {
  unauthenticated: "Sua sessão expirou. Entre novamente para continuar.",
  forbidden: "Você não tem permissão para executar esta ação.",
  not_found: "Não encontramos o registro solicitado.",
  validation: "Revise os dados informados e tente novamente.",
  conflict: "Já existe um registro com estes dados.",
  network: "Não conseguimos falar com o servidor. Verifique sua conexão.",
  unknown: "Algo não saiu como esperado. Tente novamente em instantes.",
};

type PostgrestLike = { code?: string; message?: string; details?: string; hint?: string };

/** Converte qualquer erro (Postgrest, fetch, Error) em `AppError`. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const raw = (error ?? {}) as PostgrestLike;
  const message = typeof raw.message === "string" ? raw.message : "";

  if (/JWT|not authenticated|session/i.test(message)) {
    return new AppError("unauthenticated", friendly.unauthenticated);
  }
  if (raw.code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new AppError("forbidden", friendly.forbidden);
  }
  if (raw.code === "23505" || raw.code === "23505".slice(0, 5) || raw.code === "23505") {
    return new AppError("conflict", friendly.conflict);
  }
  if (raw.code === "23505" || raw.code === "23505") {
    return new AppError("conflict", friendly.conflict);
  }
  if (raw.code === "23505") return new AppError("conflict", friendly.conflict);
  if (raw.code === "23503") {
    return new AppError("validation", "Este registro está vinculado a outros dados.");
  }
  if (raw.code === "23514" || raw.code === "22P02") {
    return new AppError("validation", friendly.validation);
  }
  if (raw.code === "PGRST116") return new AppError("not_found", friendly.not_found);
  if (/fetch|network|Failed to fetch/i.test(message)) {
    return new AppError("network", friendly.network);
  }
  if (message.includes("duplicate key")) return new AppError("conflict", friendly.conflict);

  return new AppError("unknown", message || friendly.unknown);
}

/** Mensagem sempre exibível ao usuário final. */
export function errorMessage(error: unknown): string {
  return toAppError(error).message || friendly.unknown;
}
