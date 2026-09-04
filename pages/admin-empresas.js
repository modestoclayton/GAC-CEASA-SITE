import { useState } from "react";

const est = {
  pagina: { minHeight: "100vh", background: "#0B1F17", color: "#fff", fontFamily: "-apple-system, sans-serif", padding: 20 },
  caixaSenha: { maxWidth: 340, margin: "80px auto", padding: 24, background: "#16222F", borderRadius: 12 },
  input: { width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #333", background: "#0B1F17", color: "#fff", fontSize: 15 },
  botao: { width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#E0A526", color: "#000", fontWeight: "bold", fontSize: 15, cursor: "pointer" },
  card: { background: "#16222F", borderRadius: 10, padding: 16, marginBottom: 10 },
  badgePago: { background: "#1F4A30", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" },
  badgeExpirado: { background: "#6B1F1F", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" },
  badgeTeste: { background: "#5A4416", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: "bold" },
  botaoAcao: { padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: "bold", fontSize: 13, cursor: "pointer" },
};

export default function AdminEmpresas() {
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async (senhaUsada) => {
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch("/api/admin-empresas", {
        headers: { "x-admin-secret": senhaUsada },
      });
      const j = await r.json();
      if (!j.ok) {
        setErro(j.erro || "Senha incorreta.");
        setCarregando(false);
        return;
      }
      setEmpresas(j.empresas);
      setAutenticado(true);
    } catch (e) {
      setErro((e && e.message) || String(e));
    }
    setCarregando(false);
  };

  const alternarPago = async (empresaId, novoValor) => {
    try {
      const r = await fetch("/api/admin-empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": senha },
        body: JSON.stringify({ empresaId, ehPago: novoValor }),
      });
      const j = await r.json();
      if (!j.ok) {
        alert("Erro: " + j.erro);
        return;
      }
      carregar(senha);
    } catch (e) {
      alert("Erro: " + ((e && e.message) || String(e)));
    }
  };

  if (!autenticado) {
    return (
      <div style={est.pagina}>
        <div style={est.caixaSenha}>
          <h1 style={{ fontSize: 18, marginBottom: 16 }}>🔒 Painel Admin</h1>
          <input
            style={est.input}
            type="password"
            placeholder="Senha de administrador"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && carregar(senha)}
          />
          {erro && <div style={{ color: "#ff8080", fontSize: 13, marginBottom: 12 }}>{erro}</div>}
          <button style={est.botao} onClick={() => carregar(senha)} disabled={carregando}>
            {carregando ? "Verificando..." : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={est.pagina}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>📋 Empresas Cadastradas ({empresas.length})</h1>
      {empresas.map((e) => (
        <div key={e.id} style={est.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: "bold", fontSize: 15 }}>{e.nome_empresa}</div>
              <div style={{ fontSize: 12, color: "#94A3B8" }}>
                Código: {e.codigo_acesso} · {e.email}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Cadastrado em {new Date(e.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {e.eh_pago ? (
                <span style={est.badgePago}>PAGO</span>
              ) : e.testeExpirado ? (
                <span style={est.badgeExpirado}>TESTE EXPIRADO</span>
              ) : (
                <span style={est.badgeTeste}>{e.diasRestantesTeste} DIA(S) DE TESTE</span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {e.eh_pago ? (
              <button
                style={{ ...est.botaoAcao, background: "#6B1F1F", color: "#fff" }}
                onClick={() => alternarPago(e.id, false)}
              >
                Desmarcar como Pago
              </button>
            ) : (
              <button
                style={{ ...est.botaoAcao, background: "#1F4A30", color: "#fff" }}
                onClick={() => alternarPago(e.id, true)}
              >
                ✓ Marcar como Pago
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
