import { createClient } from "@supabase/supabase-js";

// Cliente Supabase "vestindo a identidade" de quem fez login — assim, toda
// consulta já respeita sozinha as regras de RLS (cada empresa só vê a
// própria linha), sem eu precisar filtrar isso manualmente no código.
function getSupabaseComToken(token) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const DIAS_TESTE_GRATIS = 30;

// Confirma que o token é válido, acha a empresa dona dele, e barra se o
// teste grátis já venceu (e ainda não virou pago).
async function resolverEmpresaAutenticada(token) {
  if (!token) return { erro: "Não autenticado. Faça login novamente." };

  const supabase = getSupabaseComToken(token);
  const {
    data: { user },
    error: erroUser,
  } = await supabase.auth.getUser();

  if (erroUser || !user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const { data: empresa, error: erroEmpresa } = await supabase.from("empresas").select("*").single();
  if (erroEmpresa || !empresa) {
    return { erro: "Empresa não encontrada pra esse usuário." };
  }

  const diasDesdeInicio = Math.floor((Date.now() - new Date(empresa.trial_iniciado_em).getTime()) / 86400000);
  if (!empresa.eh_pago && diasDesdeInicio > DIAS_TESTE_GRATIS) {
    return {
      erro: "Seu teste grátis de 30 dias expirou. Entre em contato pra ativar o plano pago.",
      testeExpirado: true,
    };
  }

  return { supabase, empresa };
}

// ------------------------------------------------------------------------
// Nomes das tabelas: como o app chama (camelCase) x como o banco chama
// (nome da tabela em si, geralmente snake_case).
// ------------------------------------------------------------------------
const TABELAS_CADASTROS = {
  produtos: "produtos",
  clientes: "clientes",
  produtores: "produtores",
  compradoresVendedores: "equipe",
};
const TABELAS_TRANSACOES = {
  compras: "compras",
  vendas: "vendas",
  recebimentos: "recebimentos",
  pagamentos: "pagamentos",
  perdas: "perdas",
  diasFinalizados: "dias_finalizados",
};

// ------------------------------------------------------------------------
// Conversão: objeto do app (camelCase) <-> linha do banco (snake_case)
// ------------------------------------------------------------------------
function paraLinha(chaveJS, empresaId, r) {
  if (chaveJS === "produtos") {
    return {
      id: r.id,
      empresa_id: empresaId,
      codigo: r.codigo || null,
      nome: r.nome || "",
      unidade: r.unidade || "CX",
      kg_por_caixa: r.kgPorCaixa || 0,
      custo_medio: r.custoMedio || 0,
      preco_venda: r.precoVenda || 0,
      estoque_minimo: r.estoqueMinimo || 0,
    };
  }
  if (chaveJS === "clientes") {
    return {
      id: r.id,
      empresa_id: empresaId,
      codigo: r.codigo || null,
      nome: r.nome || "",
      cidade: r.cidade || "",
      limite_credito: r.limiteCredito || 0,
      pagamento: r.pagamento || "BOLETO",
      tem_desconto_fundo_rural: !!r.temDescontoFundoRural,
    };
  }
  if (chaveJS === "produtores") {
    return {
      id: r.id,
      empresa_id: empresaId,
      codigo: r.codigo || null,
      nome: r.nome || "",
      cidade: r.cidade || "",
      telefone: r.telefone || "",
      tem_cnpj: !!r.temCNPJ,
      tem_desconto_fundo_rural: !!r.temDescontoFundoRural,
      pagamento: r.pagamento || "DINHEIRO",
      chave_pix: r.chavePix || "",
    };
  }
  if (chaveJS === "compradoresVendedores") {
    // Entradas antigas podiam ser só um texto puro (nome do gestor)
    if (typeof r === "string") {
      return { id: r, empresa_id: empresaId, nome: r, funcao: "gestor", clientes_ids: [] };
    }
    return {
      id: r.id,
      empresa_id: empresaId,
      nome: r.nome || "",
      funcao: r.funcao || "gestor",
      clientes_ids: Array.isArray(r.clientesIds) ? r.clientesIds : [],
    };
  }
  if (chaveJS === "compras") {
    return {
      id: r.id,
      empresa_id: empresaId,
      data: r.data,
      produtor_id: r.produtorId || null,
      cliente_destino: r.clienteDestino || null,
      para_estoque: !!r.paraEstoque,
      produto: r.produto || "",
      cargueiro: r.cargueiro || "",
      quantidade: r.quantidade || 0,
      valor_unitario: r.valorUnit || 0,
      valor_total: r.valorTotal || 0,
      desconto: r.desconto || 0,
      valor_final: r.valorFinal || 0,
      entrega_confirmada: !!r.entregaConfirmada,
      quantidade_recebida: r.quantidadeRecebida ?? null,
      divergencia: r.divergencia ?? null,
    };
  }
  if (chaveJS === "vendas") {
    const entrega = r.entrega || {};
    return {
      id: r.id,
      empresa_id: empresaId,
      data: r.data,
      cliente_id: r.clienteId || null,
      produto: r.produto || "",
      quantidade: r.quantidade || 0,
      preco_unitario: r.precoUnit || 0,
      valor_total: r.valorTotal || 0,
      desconto: r.desconto || 0,
      valor_final: r.valorFinal || 0,
      status: r.status || "Pendente",
      entrega_placa: entrega.placa || null,
      entrega_local: entrega.localEntrega || null,
      entrega_carregador: entrega.carregador || null,
      caixas_emprestadas: !!entrega.caixasEmprestadas,
      obs_caixas: entrega.obsCaixas || null,
      entrega_confirmada: !!entrega.confirmada,
    };
  }
  if (chaveJS === "recebimentos") {
    return {
      id: r.id,
      empresa_id: empresaId,
      data: r.data,
      cliente_id: r.clienteId || null,
      valor: r.valor || 0,
      tipo: r.tipo || "pagamento",
      forma_pagamento: r.formaPagamento || null,
      observacao: r.obs || "",
    };
  }
  if (chaveJS === "pagamentos") {
    return {
      id: r.id,
      empresa_id: empresaId,
      data: r.data,
      produtor_id: r.produtorId || null,
      valor: r.valor || 0,
      tipo: r.tipo || "pagamento",
      forma_pagamento: r.formaPagamento || null,
      observacao: r.obs || "",
    };
  }
  if (chaveJS === "perdas") {
    return {
      id: r.id,
      empresa_id: empresaId,
      data: r.data,
      produto: r.produto || "",
      quantidade: r.quantidade || 0,
      motivo: r.motivo || "",
      valor_perdido: r.valorPerdido || 0,
    };
  }
  if (chaveJS === "diasFinalizados") {
    const dataStr = typeof r === "string" ? r : "";
    return { id: dataStr, empresa_id: empresaId, data_finalizada: dataStr };
  }
  return null;
}

function paraObjeto(chaveJS, linha) {
  if (chaveJS === "produtos") {
    return {
      id: linha.id,
      codigo: linha.codigo,
      nome: linha.nome,
      unidade: linha.unidade,
      kgPorCaixa: Number(linha.kg_por_caixa) || 0,
      custoMedio: Number(linha.custo_medio) || 0,
      precoVenda: Number(linha.preco_venda) || 0,
      estoqueMinimo: Number(linha.estoque_minimo) || 0,
    };
  }
  if (chaveJS === "clientes") {
    return {
      id: linha.id,
      codigo: linha.codigo,
      nome: linha.nome,
      cidade: linha.cidade,
      limiteCredito: Number(linha.limite_credito) || 0,
      pagamento: linha.pagamento,
      temDescontoFundoRural: !!linha.tem_desconto_fundo_rural,
    };
  }
  if (chaveJS === "produtores") {
    return {
      id: linha.id,
      codigo: linha.codigo,
      nome: linha.nome,
      cidade: linha.cidade,
      telefone: linha.telefone,
      temCNPJ: !!linha.tem_cnpj,
      temDescontoFundoRural: !!linha.tem_desconto_fundo_rural,
      pagamento: linha.pagamento,
      chavePix: linha.chave_pix,
    };
  }
  if (chaveJS === "compradoresVendedores") {
    return {
      id: linha.id,
      nome: linha.nome,
      funcao: linha.funcao,
      clientesIds: Array.isArray(linha.clientes_ids) ? linha.clientes_ids : [],
    };
  }
  if (chaveJS === "compras") {
    return {
      id: linha.id,
      data: linha.data,
      produtorId: linha.produtor_id,
      clienteDestino: linha.cliente_destino,
      paraEstoque: !!linha.para_estoque,
      produto: linha.produto,
      cargueiro: linha.cargueiro,
      quantidade: Number(linha.quantidade) || 0,
      valorUnit: Number(linha.valor_unitario) || 0,
      valorTotal: Number(linha.valor_total) || 0,
      desconto: Number(linha.desconto) || 0,
      valorFinal: Number(linha.valor_final) || 0,
      entregaConfirmada: !!linha.entrega_confirmada,
      quantidadeRecebida: linha.quantidade_recebida,
      divergencia: linha.divergencia,
    };
  }
  if (chaveJS === "vendas") {
    const temEntrega = linha.entrega_placa || linha.entrega_local || linha.entrega_carregador;
    return {
      id: linha.id,
      data: linha.data,
      clienteId: linha.cliente_id,
      produto: linha.produto,
      quantidade: Number(linha.quantidade) || 0,
      precoUnit: Number(linha.preco_unitario) || 0,
      valorTotal: Number(linha.valor_total) || 0,
      desconto: Number(linha.desconto) || 0,
      valorFinal: Number(linha.valor_final) || 0,
      status: linha.status,
      entrega: temEntrega
        ? {
            placa: linha.entrega_placa || "",
            localEntrega: linha.entrega_local || "",
            carregador: linha.entrega_carregador || "",
            caixasEmprestadas: !!linha.caixas_emprestadas,
            obsCaixas: linha.obs_caixas || "",
            confirmada: !!linha.entrega_confirmada,
          }
        : null,
    };
  }
  if (chaveJS === "recebimentos") {
    return {
      id: linha.id,
      data: linha.data,
      clienteId: linha.cliente_id,
      valor: Number(linha.valor) || 0,
      tipo: linha.tipo,
      formaPagamento: linha.forma_pagamento,
      obs: linha.observacao,
    };
  }
  if (chaveJS === "pagamentos") {
    return {
      id: linha.id,
      data: linha.data,
      produtorId: linha.produtor_id,
      valor: Number(linha.valor) || 0,
      tipo: linha.tipo,
      formaPagamento: linha.forma_pagamento,
      obs: linha.observacao,
    };
  }
  if (chaveJS === "perdas") {
    return {
      id: linha.id,
      data: linha.data,
      produto: linha.produto,
      quantidade: Number(linha.quantidade) || 0,
      motivo: linha.motivo,
      valorPerdido: Number(linha.valor_perdido) || 0,
    };
  }
  if (chaveJS === "diasFinalizados") {
    return linha.data_finalizada;
  }
  return linha;
}

// Sincroniza uma tabela inteira: insere/atualiza tudo que veio do app
// (upsert) e apaga do banco o que não está mais na lista (foi excluído
// no app) — reproduz o mesmo efeito de "limpar e reescrever tudo" que a
// planilha tinha, mas sem precisar reescrever linha que não mudou.
async function sincronizarTabela(supabase, tabelaDB, empresaId, chaveJS, registrosJS) {
  const linhas = (registrosJS || [])
    .map((r) => paraLinha(chaveJS, empresaId, r))
    .filter((l) => l && l.id);

  if (linhas.length > 0) {
    const { error } = await supabase.from(tabelaDB).upsert(linhas, { onConflict: "id" });
    if (error) throw new Error(`upsert em "${tabelaDB}": ${error.message}`);
  }

  const idsAtuais = linhas.map((l) => l.id);
  let query = supabase.from(tabelaDB).delete().eq("empresa_id", empresaId);
  if (idsAtuais.length > 0) {
    query = query.not("id", "in", `(${idsAtuais.map((id) => `"${id}"`).join(",")})`);
  }
  const { error: erroDelete } = await query;
  if (erroDelete) throw new Error(`limpeza em "${tabelaDB}": ${erroDelete.message}`);
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const resolvido = await resolverEmpresaAutenticada(token);
  if (resolvido.erro) {
    return res.status(resolvido.testeExpirado ? 403 : 401).json({ ok: false, erro: resolvido.erro, testeExpirado: !!resolvido.testeExpirado });
  }
  const { supabase, empresa } = resolvido;

  try {
    if (req.method === "GET") {
      const cadastros = {};
      for (const [chaveJS, tabelaDB] of Object.entries(TABELAS_CADASTROS)) {
        const { data, error } = await supabase.from(tabelaDB).select("*").eq("empresa_id", empresa.id);
        if (error) throw new Error(`leitura de "${tabelaDB}": ${error.message}`);
        cadastros[chaveJS] = (data || []).map((linha) => paraObjeto(chaveJS, linha));
      }

      const transacoes = {};
      for (const [chaveJS, tabelaDB] of Object.entries(TABELAS_TRANSACOES)) {
        const { data, error } = await supabase.from(tabelaDB).select("*").eq("empresa_id", empresa.id);
        if (error) throw new Error(`leitura de "${tabelaDB}": ${error.message}`);
        transacoes[chaveJS] = (data || []).map((linha) => paraObjeto(chaveJS, linha));
      }

      return res.status(200).json({ ok: true, cadastros, transacoes });
    }

    if (req.method === "POST") {
      const { type, data } = req.body || {};
      const mapa = type === "cadastros" ? TABELAS_CADASTROS : TABELAS_TRANSACOES;

      const erros = [];
      for (const [chaveJS, tabelaDB] of Object.entries(mapa)) {
        if (Array.isArray(data?.[chaveJS])) {
          try {
            await sincronizarTabela(supabase, tabelaDB, empresa.id, chaveJS, data[chaveJS]);
          } catch (e) {
            erros.push((e && e.message) || String(e));
          }
        }
      }

      if (erros.length > 0) {
        return res.status(500).json({ ok: false, erro: erros.join(" | ") });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, erro: "método não suportado" });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: String(err && err.message ? err.message : err) });
  }
}
