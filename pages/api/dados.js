import { google } from "googleapis";

// Nomes das abas que servem como "tabelas" do banco de dados.
const TABELAS_CADASTROS = ["produtos", "clientes", "produtores", "compradoresVendedores"];
const TABELAS_TRANSACOES = ["compras", "vendas", "recebimentos", "pagamentos", "perdas", "diasFinalizados"];

function normalizarChavePrivada(bruta) {
  let key = (bruta || "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/-----END PRIVATE KEY-----\s*\/n/g, "-----END PRIVATE KEY-----")
    .replace(/-----BEGIN PRIVATE KEY-----\s*\/n/g, "-----BEGIN PRIVATE KEY-----\n")
    .trim();
  if (!key.endsWith("\n")) key += "\n";
  return key;
}

function getAuth() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const key = normalizarChavePrivada(process.env.GOOGLE_PRIVATE_KEY);
  return new google.auth.JWT(email, null, key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
}

async function garantirAbas(sheets, spreadsheetId, nomesNecessarios) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
  const existentes = new Set((meta.data.sheets || []).map((s) => (s.properties.title || "").trim()));
  const faltando = nomesNecessarios.filter((n) => !existentes.has(n));
  if (faltando.length === 0) return;
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: faltando.map((titulo) => ({ addSheet: { properties: { title: titulo } } })),
      },
    });
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (!msg.toLowerCase().includes("already exists")) throw e;
  }
}

async function lerTabela(sheets, spreadsheetId, nome) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${nome}!A2:A`, // O sistema continua lendo o JSON original guardado na coluna A
    });
    const linhas = res.data.values || [];
    return linhas
      .map((l) => l[0])
      .filter((v) => v)
      .map((v) => {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

// ------------------------------------------------------------------------
// CABEÇALHOS: uma linha de título por aba, sempre reescrita igual toda vez
// que a aba é salva — isso é o que mantém a planilha organizada sozinha,
// sem depender de ninguém editar o cabeçalho manualmente.
// ------------------------------------------------------------------------
function cabecalhoDaTabela(nome) {
  const cabecalhos = {
    produtos: ["dados_json", "id", "codigo", "nome", "unidade", "peso_por_caixa_kg", "custo_medio", "preco_venda", "estoque_minimo"],
    clientes: ["dados_json", "id", "codigo", "nome", "cidade", "limite_credito", "forma_pagamento", "desconto_fundo_rural"],
    produtores: ["dados_json", "id", "codigo", "nome", "cidade", "telefone", "tem_cnpj", "desconto_fundo_rural", "forma_pagamento", "chave_pix"],
    compradoresVendedores: ["dados_json", "id", "nome", "funcao", "empresas_ids"],
    compras: ["dados_json", "id", "data", "produtor_id", "produto", "quantidade", "valor_unitario", "valor_total", "desconto", "valor_final", "cliente_destino", "para_estoque", "cargueiro", "entrega_confirmada", "quantidade_recebida", "divergencia"],
    vendas: ["dados_json", "id", "data", "cliente_id", "produto", "quantidade", "preco_unitario", "valor_total", "desconto", "valor_final", "status", "entrega_placa", "entrega_local", "entrega_carregador", "caixas_emprestadas", "obs_caixas", "entrega_confirmada"],
    recebimentos: ["dados_json", "id", "data", "cliente_id", "valor", "tipo", "forma_pagamento", "observacao"],
    pagamentos: ["dados_json", "id", "data", "produtor_id", "valor", "tipo", "forma_pagamento", "observacao"],
    perdas: ["dados_json", "id", "data", "produto", "quantidade", "motivo", "valor_perdido"],
    diasFinalizados: ["dados_json", "data_finalizada"],
  };
  return cabecalhos[nome] || ["dados_json"];
}

function montarLinha(nome, r) {
  const jsonString = JSON.stringify(r);

  if (nome === "produtos") {
    return [jsonString, r.id || "", r.codigo || "", r.nome || "", r.unidade || "", r.kgPorCaixa || "", r.custoMedio || 0, r.precoVenda || 0, r.estoqueMinimo || 0];
  }

  if (nome === "clientes") {
    return [jsonString, r.id || "", r.codigo || "", r.nome || "", r.cidade || "", r.limiteCredito || 0, r.pagamento || "", r.temDescontoFundoRural ? "SIM" : "NÃO"];
  }

  if (nome === "produtores") {
    return [
      jsonString,
      r.id || "",
      r.codigo || "",
      r.nome || "",
      r.cidade || "",
      r.telefone || "",
      r.temCNPJ ? "SIM" : "NÃO",
      r.temDescontoFundoRural ? "SIM" : "NÃO",
      r.pagamento || "",
      r.chavePix || "",
    ];
  }

  if (nome === "compradoresVendedores") {
    // Entradas antigas eram só um texto puro (nome do gestor); o app trata
    // isso na leitura, aqui só evitamos quebrar se aparecer assim.
    if (typeof r === "string") {
      return [jsonString, r, r, "gestor", ""];
    }
    return [
      jsonString,
      r.id || "",
      r.nome || "",
      r.funcao || "",
      Array.isArray(r.clientesIds) ? r.clientesIds.join(", ") : "",
    ];
  }

  if (nome === "compras") {
    return [
      jsonString,
      r.id || "",
      r.data || "",
      r.produtorId || "",
      r.produto || "",
      r.quantidade || 0,
      r.valorUnit || 0,
      r.valorTotal || 0,
      r.desconto || 0,
      r.valorFinal || 0,
      r.clienteDestino || "",
      r.paraEstoque ? "SIM" : "NÃO",
      r.cargueiro || "",
      r.entregaConfirmada ? "SIM" : "NÃO",
      r.quantidadeRecebida ?? "",
      r.divergencia ?? "",
    ];
  }

  if (nome === "vendas") {
    const entrega = r.entrega || {};
    return [
      jsonString,
      r.id || "",
      r.data || "",
      r.clienteId || "",
      r.produto || "",
      r.quantidade || 0,
      r.precoUnit || 0,
      r.valorTotal || 0,
      r.desconto || 0,
      r.valorFinal || 0,
      r.status || "",
      entrega.placa || "",
      entrega.localEntrega || "",
      entrega.carregador || "",
      entrega.caixasEmprestadas ? "SIM" : "NÃO",
      entrega.obsCaixas || "",
      entrega.confirmada ? "SIM" : "NÃO",
    ];
  }

  if (nome === "recebimentos") {
    return [jsonString, r.id || "", r.data || "", r.clienteId || "", r.valor || 0, r.tipo || "", r.formaPagamento || "", r.obs || ""];
  }

  if (nome === "pagamentos") {
    return [jsonString, r.id || "", r.data || "", r.produtorId || "", r.valor || 0, r.tipo || "", r.formaPagamento || "", r.obs || ""];
  }

  if (nome === "perdas") {
    return [jsonString, r.id || "", r.data || "", r.produto || "", r.quantidade || 0, r.motivo || "", r.valorPerdido || 0];
  }

  if (nome === "diasFinalizados") {
    // Aqui cada registro é só uma data em texto (string), não um objeto.
    return [jsonString, typeof r === "string" ? r : ""];
  }

  // Fallback caso apareça alguma aba nova futuramente
  return [jsonString, JSON.stringify(r)];
}

// Escreve uma tabela (aba) inteira: cabeçalho + dados. Se a operação falhar
// porque a aba não foi encontrada, tenta garantir a aba de novo e repete a
// operação UMA vez antes de desistir.
async function escreverTabela(sheets, spreadsheetId, nome, registros, tentativa = 0) {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${nome}!A1:Z`,
    });
  } catch (e) {
    const msg = (e && e.message) || String(e);
    const pareceAbaFaltando = /unable to parse range|not found|unable to find/i.test(msg);
    if (tentativa === 0 && pareceAbaFaltando) {
      await garantirAbas(sheets, spreadsheetId, [nome]);
      return escreverTabela(sheets, spreadsheetId, nome, registros, tentativa + 1);
    }
    throw new Error(`Falha ao limpar a aba "${nome}": ${msg}`);
  }

  // Cabeçalho sempre é reescrito, mesmo se a tabela estiver vazia — é isso
  // que mantém a planilha organizada e legível o tempo todo, sozinha.
  const cabecalho = cabecalhoDaTabela(nome);
  const linhas = [cabecalho, ...(registros || []).map((r) => montarLinha(nome, r))];

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${nome}!A1`,
      valueInputOption: "USER_ENTERED", // Permite que o Google Sheets reconheça números e datas corretamente
      requestBody: { values: linhas },
    });
  } catch (e) {
    throw new Error(`Falha ao escrever na aba "${nome}": ${(e && e.message) || String(e)}`);
  }
}

// Aplica os cabeçalhos corretos em TODAS as abas de uma vez, mesmo nas que
// não mudaram nessa chamada — usado pelo modo de "reorganizar tudo agora".
async function reorganizarTodasAsAbas(sheets, spreadsheetId, cadastros, transacoes) {
  const resultado = {};
  for (const t of TABELAS_CADASTROS) {
    const dados = cadastros[t] || [];
    await escreverTabela(sheets, spreadsheetId, t, dados);
    resultado[t] = dados.length;
  }
  for (const t of TABELAS_TRANSACOES) {
    const dados = transacoes[t] || [];
    await escreverTabela(sheets, spreadsheetId, t, dados);
    resultado[t] = dados.length;
  }
  return resultado;
}

export default async function handler(req, res) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (req.query && req.query.debug === "key") {
    const bruta = process.env.GOOGLE_PRIVATE_KEY || "";
    const normalizada = normalizarChavePrivada(bruta);
    return res.status(200).json({
      tamanho_bruto: bruta.length,
      comeca_com_aspas: bruta.startsWith('"'),
      termina_com_aspas: bruta.endsWith('"'),
      contem_barra_n_literal: bruta.includes("\\n"),
      contem_quebra_real: bruta.includes("\n"),
      primeiros_40_brutos: bruta.slice(0, 40),
      ultimos_40_brutos: bruta.slice(-40),
      tamanho_normalizado: normalizada.length,
      primeiros_40_normalizados: normalizada.slice(0, 40),
      ultimos_40_normalizados: normalizada.slice(-40),
      linhas_normalizadas: normalizada.split("\n").length,
    });
  }

  if (req.query && req.query.debug === "abas") {
    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return res.status(500).json({ ok: false, erro: "Variáveis de ambiente não configuradas." });
    }
    try {
      const auth = getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties.title" });
      const existentes = (meta.data.sheets || []).map((s) => s.properties.title);
      const esperadas = [...TABELAS_CADASTROS, ...TABELAS_TRANSACOES];
      const faltando = esperadas.filter((n) => !existentes.includes(n));
      return res.status(200).json({
        ok: true,
        spreadsheetId,
        abas_existentes_na_planilha: existentes,
        abas_esperadas_pelo_app: esperadas,
        abas_faltando: faltando,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
    }
  }

  // Reorganiza TODAS as abas de uma vez — reescreve cabeçalho + colunas
  // legíveis certinhas em cima dos dados que já existem, sem perder nada
  // (o JSON da coluna A é a fonte da verdade, as outras colunas só são
  // recalculadas a partir dele). Use uma vez pra "consertar" a planilha
  // atual; depois disso toda gravação normal já mantém tudo em dia sozinha.
  if (req.query && req.query.reorganizar === "true") {
    if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      return res.status(500).json({ ok: false, erro: "Variáveis de ambiente não configuradas." });
    }
    try {
      const auth = getAuth();
      const sheets = google.sheets({ version: "v4", auth });
      await garantirAbas(sheets, spreadsheetId, [...TABELAS_CADASTROS, ...TABELAS_TRANSACOES]);

      const cadastros = {};
      for (const t of TABELAS_CADASTROS) cadastros[t] = await lerTabela(sheets, spreadsheetId, t);
      const transacoes = {};
      for (const t of TABELAS_TRANSACOES) transacoes[t] = await lerTabela(sheets, spreadsheetId, t);

      const resultado = await reorganizarTodasAsAbas(sheets, spreadsheetId, cadastros, transacoes);
      return res.status(200).json({ ok: true, mensagem: "Planilha reorganizada!", registros_por_aba: resultado });
    } catch (e) {
      return res.status(500).json({ ok: false, erro: String(e && e.message ? e.message : e) });
    }
  }

  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return res.status(500).json({
      ok: false,
      erro:
        "Variáveis de ambiente não configuradas (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY). Configure em Vercel → Settings → Environment Variables.",
    });
  }

  const chaveNormalizada = normalizarChavePrivada(process.env.GOOGLE_PRIVATE_KEY);
  if (
    !chaveNormalizada.includes("-----BEGIN PRIVATE KEY-----") ||
    !chaveNormalizada.includes("-----END PRIVATE KEY-----")
  ) {
    return res.status(500).json({
      ok: false,
      erro:
        "GOOGLE_PRIVATE_KEY não está no formato esperado (falta -----BEGIN/END PRIVATE KEY-----). Recopie o valor do arquivo JSON da conta de serviço, sem aspas ao redor.",
    });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    await garantirAbas(sheets, spreadsheetId, [...TABELAS_CADASTROS, ...TABELAS_TRANSACOES]);

    if (req.method === "GET") {
      const cadastros = {};
      for (const t of TABELAS_CADASTROS) cadastros[t] = await lerTabela(sheets, spreadsheetId, t);
      const transacoes = {};
      for (const t of TABELAS_TRANSACOES) transacoes[t] = await lerTabela(sheets, spreadsheetId, t);
      return res.status(200).json({ ok: true, cadastros, transacoes });
    }

    if (req.method === "POST") {
      const { type, data } = req.body || {};
      const tabelas = type === "cadastros" ? TABELAS_CADASTROS : TABELAS_TRANSACOES;

      const erros = [];
      for (const t of tabelas) {
        if (Array.isArray(data?.[t])) {
          try {
            await escreverTabela(sheets, spreadsheetId, t, data[t]);
          } catch (e) {
            erros.push(`${t}: ${(e && e.message) || String(e)}`);
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
