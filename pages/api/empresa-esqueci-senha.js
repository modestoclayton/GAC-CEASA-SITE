import { getSupabaseAdmin, getSupabasePublico, normalizarCodigoAcesso } from "../../lib/supabaseAdmin";

// Esconde a maior parte do e-mail na resposta ("le***@gmail.com"), só pra
// confirmar visualmente que foi pro endereço certo sem expor o e-mail
// completo de volta pro navegador.
function mascarar(email) {
  if (!email || !email.includes("@")) return email || "";
  const [usuario, dominio] = email.split("@");
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"*".repeat(Math.max(usuario.length - 2, 1))}@${dominio}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, erro: "método não suportado" });
  }

  const { codigoAcesso } = req.body || {};
  const codigo = normalizarCodigoAcesso(codigoAcesso);

  if (!codigo) {
    return res.status(400).json({ ok: false, erro: "Informe o código de acesso." });
  }

  try {
    const admin = getSupabaseAdmin();

    // Mesmo passo do login: acha o e-mail cadastrado a partir do código de acesso.
    const { data: empresa, error: erroBusca } = await admin
      .from("empresas")
      .select("*")
      .eq("codigo_acesso", codigo)
      .maybeSingle();

    if (erroBusca || !empresa) {
      return res.status(400).json({ ok: false, erro: "Código de acesso não encontrado." });
    }

    // Monta a URL de volta pro app (pra onde o link do e-mail vai levar a
    // pessoa depois de clicar) — usa o domínio de quem chamou a API, então
    // funciona tanto em produção quanto em ambiente de teste/preview.
    const origem = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;

    const publico = getSupabasePublico();
    const { error: erroReset } = await publico.auth.resetPasswordForEmail(empresa.email, {
      redirectTo: `${origem}/redefinir-senha`,
    });

    if (erroReset) {
      return res.status(500).json({ ok: false, erro: erroReset.message || "Não foi possível enviar o e-mail de recuperação." });
    }

    return res.status(200).json({ ok: true, emailMascarado: mascarar(empresa.email) });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
  }
}