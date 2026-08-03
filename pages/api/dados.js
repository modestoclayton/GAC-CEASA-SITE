import { google } from "googleapis";

// Nomes das abas que servem como "tabelas" do banco de dados.
// Precisam já existir na planilha (a mesma que você criou antes, com o
// script do Apps Script — as abas já estão lá).
const TABELAS_CADASTROS = ["produtos", "clientes", "produtores", "compradoresVendedores"];
const TABELAS_TRANSACOES = ["compras", "vendas", "recebimentos", "pagamentos", "perdas"];

function normalizarChavePrivada(bruta) {
  let key = (bruta || "").trim();
  // remove aspas envolvendo o valor inteiro, se coladas por engano
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key
    .replace(/\\n/g, "\n") // \n literais (comum ao copiar do JSON)
    .replace(/\r\n/g, "\n") // quebras de linha estilo Windows
    .replace(/\r/g, "\n")
    .replace(/-----END PRIVATE KEY-----\s*\/n/g, "-----END PRIVATE KEY-----") // lixo "/n" (barra) colado sem querer
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
  const existentes = new Set((meta.data.sheets || []).map((s) => s.properties.title));
  const faltando = nomesNecessarios.filter((n) => !existentes.has(n));
  if (faltando.length === 0) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: faltando.map((titulo) => ({ addSheet: { properties: { title: titulo } } })),
    },
  });
}

async function lerTabela(sheets, spreadsheetId, nome) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${nome}!A2:A`,
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
    // aba pode não existir ainda, ou estar vazia — trata como lista vazia
    return [];
  }
}

async function escreverTabela(sheets, spreadsheetId, nome, registros) {
  // limpa os dados atuais (mantém o cabeçalho da linha 1)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${nome}!A2:A`,
  });
  if (registros && registros.length > 0) {
    const values = registros.map((r) => [JSON.stringify(r)]);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${nome}!A2`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  }
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
      for (const t of tabelas) {
        if (Array.isArray(data?.[t])) {
          await escreverTabela(sheets, spreadsheetId, t, data[t]);
        }
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, erro: "método não suportado" });
  } catch (err) {
    return res.status(500).json({ ok: false, erro: String(err && err.message ? err.message : err) });
  }
}
