import { getSupabaseAdmin, getSupabasePublico, normalizarCodigoAcesso, DIAS_TESTE_GRATIS } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, erro: "método não suportado" });
  }

  const { codigoAcesso, senha } = req.body || {};
  const codigo = normalizarCodigoAcesso(codigoAcesso);

  if (!codigo || !senha) {
    return res.status(400).json({ ok: false, erro: "Informe o código de acesso e a senha." });
  }

  try {
    const admin = getSupabaseAdmin();

    // 1) Acha o e-mail correspondente a esse código de acesso.
    // (Usa a chave admin porque essa consulta precisa ignorar as regras de
    // RLS — a pessoa ainda não está autenticada nesse momento.)
    const { data: empresa, error: erroBusca } = await admin
      .from("empresas")
      .select("*")
      .eq("codigo_acesso", codigo)
      .maybeSingle();

    if (erroBusca || !empresa) {
      return res.status(400).json({ ok: false, erro: "Código de acesso não encontrado." });
    }

    // 2) Confere a senha de verdade usando o sistema de autenticação do Supabase.
    const publico = getSupabasePublico();
    const { data: sessao, error: erroLogin } = await publico.auth.signInWithPassword({
      email: empresa.email,
      password: senha,
    });

    if (erroLogin) {
      return res.status(401).json({ ok: false, erro: "Código de acesso ou senha incorretos." });
    }

    // 3) Confere o prazo do teste grátis.
    const diasDesdeInicio = Math.floor(
      (Date.now() - new Date(empresa.trial_iniciado_em).getTime()) / 86400000
    );
    const diasRestantes = DIAS_TESTE_GRATIS - diasDesdeInicio;

    if (!empresa.eh_pago && diasRestantes < 0) {
      return res.status(403).json({
        ok: false,
        erro: "Seu teste grátis de 30 dias expirou. Entre em contato pra ativar o plano pago.",
        testeExpirado: true,
      });
    }

    return res.status(200).json({
      ok: true,
      sessao: {
        access_token: sessao.session.access_token,
        refresh_token: sessao.session.refresh_token,
      },
      empresa: {
        nomeEmpresa: empresa.nome_empresa,
        codigoAcesso: empresa.codigo_acesso,
        googleSheetId: empresa.google_sheet_id,
        ehPago: empresa.eh_pago,
        diasRestantesTeste: empresa.eh_pago ? null : Math.max(diasRestantes, 0),
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
  }
}
