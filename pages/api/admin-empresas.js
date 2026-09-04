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
      const { empresaId, ehPago } = req.body || {};
      if (!empresaId) return res.status(400).json({ ok: false, erro: "empresaId é obrigatório." });

      const { error } = await admin
        .from("empresas")
        .update({ eh_pago: !!ehPago })
        .eq("id", empresaId);

      if (error) return res.status(500).json({ ok: false, erro: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, erro: "método não suportado" });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
  }
}
