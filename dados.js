import { google } from "googleapis";

// Nomes das abas que servem como "tabelas" do banco de dados.
// Precisam já existir na planilha (a mesma que você criou antes, com o
// script do Apps Script — as abas já estão lá).
const TABELAS_CADASTROS = ["produtos", "clientes", "produtores", "compradoresVendedores"];
const TABELAS_TRANSACOES = ["compras", "vendas", "recebimentos", "pagamentos", "perdas"];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return new google.auth.JWT(email, null, key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
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

  if (!spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return res.status(500).json({
      ok: false,
      erro:
        "Variáveis de ambiente não configuradas (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY). Configure em Vercel → Settings → Environment Variables.",
    });
  }

  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

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
