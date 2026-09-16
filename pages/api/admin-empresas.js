import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  // Proteção simples: só responde se vier a senha certa de administrador.
  // Essa senha NÃO é a mesma de nenhuma empresa — é só sua, guardada como
  // variável de ambiente separada (ADMIN_SECRET), pra ninguém mais acessar
  // essa lista de todos os clientes.
  const senhaEnviada = req.headers["x-admin-secret"] || "";
  if (!process.env.ADMIN_SECRET || senhaEnviada !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ ok: false, erro: "Senha de administrador incorreta ou não configurada." });
  }

  try {
    const admin = getSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } = await admin
        .from("empresas")
        .select("id, nome_empresa, codigo_acesso, email, trial_iniciado_em, eh_pago, criado_em")
        .order("criado_em", { ascending: false });

      if (error) return res.status(500).json({ ok: false, erro: error.message });

      const DIAS_TESTE_GRATIS = 30;
      const empresas = (data || []).map((e) => {
        const diasDesdeInicio = Math.floor((Date.now() - new Date(e.trial_iniciado_em).getTime()) / 86400000);
        return {
          ...e,
          diasRestantesTeste: e.eh_pago ? null : Math.max(DIAS_TESTE_GRATIS - diasDesdeInicio, 0),
          testeExpirado: !e.eh_pago && diasDesdeInicio > DIAS_TESTE_GRATIS,
        };
      });

      return res.status(200).json({ ok: true, empresas });
    }

    if (req.method === "POST") {
      const { empresaId, ehPago, nomeEmpresa, email } = req.body || {};
      if (!empresaId) return res.status(400).json({ ok: false, erro: "empresaId é obrigatório." });

      const atualizacoes = {};

      if (typeof ehPago === "boolean") {
        atualizacoes.eh_pago = ehPago;
      }

      if (typeof nomeEmpresa === "string" && nomeEmpresa.trim()) {
        // É esse nome que aparece no topo do vale/pedido de venda — corrige
        // aqui quando a pessoa cadastrou um nome de brincadeira/apelido de
        // grupo em vez do nome pelo qual é conhecida no CEASA.
        atualizacoes.nome_empresa = nomeEmpresa.trim();
      }

      if (typeof email === "string" && email.trim()) {
        // Sempre em minúsculo, pra não repetir o problema de reset de senha
        // que não chega quando o e-mail salvo tem letra maiúscula.
        const emailNormalizado = email.trim().toLowerCase();

        // Precisa do user_id pra também corrigir o e-mail de login no
        // Supabase Auth — se só corrigir na tabela empresas, login e reset
        // de senha continuam usando o e-mail antigo/errado por baixo dos
        // panos.
        const { data: empresaAtual, error: erroBusca } = await admin
          .from("empresas")
          .select("user_id")
          .eq("id", empresaId)
          .maybeSingle();

        if (erroBusca || !empresaAtual) {
          return res.status(400).json({ ok: false, erro: "Empresa não encontrada." });
        }

        const { error: erroAuth } = await admin.auth.admin.updateUserById(empresaAtual.user_id, {
          email: emailNormalizado,
          email_confirm: true,
        });

        if (erroAuth) {
          const msg = erroAuth.message || String(erroAuth);
          if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")) {
            return res.status(400).json({ ok: false, erro: "Esse e-mail já está em uso por outra conta." });
          }
          return res.status(400).json({ ok: false, erro: msg });
        }

        atualizacoes.email = emailNormalizado;
      }

      if (Object.keys(atualizacoes).length === 0) {
        return res.status(400).json({ ok: false, erro: "Nada para atualizar." });
      }

      const { error } = await admin.from("empresas").update(atualizacoes).eq("id", empresaId);

      if (error) return res.status(500).json({ ok: false, erro: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, erro: "método não suportado" });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
  }
}
