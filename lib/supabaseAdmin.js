import { createClient } from "@supabase/supabase-js";

// Esse cliente usa a chave "service_role" (secreta) e tem acesso total ao banco,
// ignorando as regras de RLS. Por isso ele SÓ pode ser importado em arquivos
// dentro de pages/api/ (que rodam no servidor) — nunca em componentes React
// que rodam no navegador da pessoa.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Variáveis SUPABASE não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Esse cliente usa a chave pública (anon/publishable) — é o mesmo tipo de
// cliente que o navegador usaria. Usamos ele aqui no servidor só pra fazer
// o login (signInWithPassword), que não precisa de privilégio nenhum.
export function getSupabasePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis SUPABASE não configuradas (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Normaliza o "código de acesso": minúsculo, sem espaço, só letras/números/hífen.
// Evita que "Água Branca" e "agua branca" e "AguaBranca" virem códigos diferentes.
export function normalizarCodigoAcesso(bruto) {
  return (bruto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DIAS_TESTE_GRATIS = 30;
