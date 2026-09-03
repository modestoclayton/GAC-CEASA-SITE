import { getSupabaseAdmin, normalizarCodigoAcesso } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, erro: "método não suportado" });
  }

  const { nomeEmpresa, codigoAcesso, email, senha } = req.body || {};

  if (!nomeEmpresa || !nomeEmpresa.trim()) {
    return res.status(400).json({ ok: false, erro: "Informe o nome da empresa." });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ ok: false, erro: "Informe um e-mail." });
  }
  if (!senha || senha.length < 6) {
    return res.status(400).json({ ok: false, erro: "A senha precisa ter pelo menos 6 caracteres." });
  }

  const codigo = normalizarCodigoAcesso(codigoAcesso);
  if (!codigo) {
    return res.status(400).json({ ok: false, erro: "Código de acesso inválido." });
  }

  try {
    const admin = getSupabaseAdmin();

    // 1) Confere se o código de acesso já está em uso
    const { data: existente } = await admin
      .from("empresas")
      .select("id")
      .eq("codigo_acesso", codigo)
      .maybeSingle();

    if (existente) {
      return res.status(400).json({
        ok: false,
        erro: `O código de acesso "${codigo}" já está em uso. Escolha outro.`,
      });
    }

    // 2) Cria o usuário de autenticação (e-mail + senha), já confirmado
    // (sem exigir clique em link de confirmação, pra manter o cadastro
    // rápido durante a fase de testes com poucos clientes).
    const { data: novoUsuario, error: erroAuth } = await admin.auth.admin.createUser({
      email: email.trim(),
      password: senha,
      email_confirm: true,
    });

    if (erroAuth) {
      const msg = erroAuth.message || String(erroAuth);
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
        return res.status(400).json({ ok: false, erro: "Esse e-mail já tem uma conta cadastrada." });
      }
      return res.status(400).json({ ok: false, erro: msg });
    }

    // 3) Cria a linha da empresa, ligada ao usuário recém-criado.
    // google_sheet_id fica vazio por enquanto — é preenchido na próxima etapa
    // (criação automática da planilha), que ainda vamos construir.
    const { error: erroInsert } = await admin.from("empresas").insert({
      nome_empresa: nomeEmpresa.trim(),
      codigo_acesso: codigo,
      email: email.trim(),
      user_id: novoUsuario.user.id,
    });

    if (erroInsert) {
      // Se der erro aqui, desfaz a criação do usuário pra não deixar lixo
      await admin.auth.admin.deleteUser(novoUsuario.user.id);
      return res.status(500).json({ ok: false, erro: erroInsert.message });
    }

    return res.status(200).json({
      ok: true,
      codigoAcesso: codigo,
      mensagem: "Empresa cadastrada! Faça login com o código de acesso e a senha.",
    });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
  }
}
