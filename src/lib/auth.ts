/**
 * Autenticação com o Supabase Auth.
 *
 * As telas chamam estas funções; os dados do usuário e da empresa são
 * carregados para os stores por `syncFromBackend` (ver `@/lib/store`).
 */

import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, errorMessage, toAppError } from "./api/errors";
import { clearLocalData, syncFromBackend, type SessionUser, type UserProfileKind } from "./store";

const NO_COMPANY =
  "Sua conta ainda não está vinculada a uma empresa. Fale com o suporte da Ethere.";

/** Carrega os dados da sessão; se a conta não tiver perfil, encerra o login. */
async function loadSession(userId: string): Promise<SessionUser> {
  try {
    return await syncFromBackend(userId);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.code === "not_found") {
      await supabase.auth.signOut();
      throw new Error(NO_COMPANY);
    }
    throw new Error(errorMessage(appError));
  }
}

export async function signInWithPassword(email: string, password: string): Promise<SessionUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(authErrorMessage(error.message));
  return loadSession(data.user.id);
}

export type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone: string;
  companyName: string;
  cnpj: string;
  profileKind: UserProfileKind;
};

/**
 * Cria o usuário. Empresa, perfil e papel de Administrador são criados no banco
 * pelo trigger `handle_new_user`, a partir dos metadados enviados aqui.
 * Devolve `null` quando o projeto exige confirmação de e-mail antes do login.
 */
export async function signUp(input: SignUpInput): Promise<SessionUser | null> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        job_title: input.jobTitle.trim(),
        phone: input.phone,
        company_name: input.companyName.trim(),
        cnpj: input.cnpj,
        profile_kind: input.profileKind,
      },
    },
  });
  if (error) {
    // Falha do trigger de cadastro (ex.: CNPJ já usado por outra empresa).
    if (/database error/i.test(error.message)) {
      throw new Error("Não foi possível criar a conta. Verifique se o CNPJ já está cadastrado.");
    }
    throw new Error(authErrorMessage(error.message));
  }
  // E-mail repetido pode voltar como usuário sem identidades.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("Este e-mail já possui uma conta.");
  }
  if (!data.user) return null;
  if (!data.session) {
    // Sem confirmação de e-mail: abre a sessão direto com as credenciais.
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });
    if (signInError || !signIn.user) return null;
    return loadSession(signIn.user.id);
  }
  return loadSession(data.user.id);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw new Error(authErrorMessage(error.message));
}

/** Define a nova senha. Exige a sessão aberta pelo link de recuperação. */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(authErrorMessage(error.message));
}

export async function hasAuthSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/**
 * Mantém os stores alinhados à sessão do Supabase: carrega os dados quando há
 * login (inclusive ao reabrir o app) e limpa tudo quando a sessão termina.
 * Devolve a função que cancela a inscrição.
 */
export function initAuth(): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // As chamadas ao Supabase ficam fora do callback para não travar o cliente.
    setTimeout(() => {
      if (!session) {
        if (event === "INITIAL_SESSION" || event === "SIGNED_OUT") clearLocalData();
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        syncFromBackend(session.user.id).catch(async (error: unknown) => {
          if (toAppError(error).code === "not_found") await supabase.auth.signOut();
        });
      }
    }, 0);
  });
  return () => data.subscription.unsubscribe();
}
