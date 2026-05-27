import { createClient } from "@/lib/supabase/server";

export type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type SupabaseAuthError = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
};

function logAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    console.error("[auth] Erro ao validar usuario autenticado.", error);
    return;
  }

  const authError = error as SupabaseAuthError;

  console.error("[auth] Erro ao validar usuario autenticado.", {
    code: authError.code,
    message: authError.message,
    name: authError.name,
    status: authError.status,
  });
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logAuthError(error);
  }

  if (error || !user) {
    return {
      error: "Usuário não autenticado.",
      supabase,
      user: null,
    };
  }

  return {
    error: null,
    supabase,
    user,
  };
}
