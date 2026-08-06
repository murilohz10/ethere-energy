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
  const code = raw.code ?? "";

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new AppError("forbidden", friendly.forbidden);
  }
  if (code === "23505" || /duplicate key/i.test(message)) {
    return new AppError("conflict", friendly.conflict);
  }
  if (code === "23503") {
    return new AppError("validation", "Este registro está vinculado a outros dados.");
  }
  if (code === "23514" || code === "22P02" || code === "23502") {
    return new AppError("validation", friendly.validation);
  }
  if (code === "PGRST116") return new AppError("not_found", friendly.not_found);
  if (/JWT|not authenticated|Auth session missing|invalid claim/i.test(message)) {
    return new AppError("unauthenticated", friendly.unauthenticated);
  }
  if (/network|failed to fetch/i.test(message)) {
    return new AppError("network", friendly.network);
  }

  return new AppError("unknown", message || friendly.unknown);
}

/** Mensagem sempre exibível ao usuário final. */
export function errorMessage(error: unknown): string {
  return toAppError(error).message || friendly.unknown;
}

/** Traduz mensagens do serviço de autenticação para português. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Este e-mail já possui uma conta.";
  if (m.includes("password should be at least"))
    return "A senha precisa ter no mínimo 8 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  if (m.includes("weak password")) return "Escolha uma senha mais forte.";
  return message || "Não foi possível concluir a autenticação.";
}
