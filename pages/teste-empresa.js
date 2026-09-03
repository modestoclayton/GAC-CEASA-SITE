import { useState } from "react";

const caixa = {
  maxWidth: 420,
  margin: "40px auto",
  padding: 20,
  fontFamily: "-apple-system, sans-serif",
  color: "#fff",
  background: "#0B1F17",
  minHeight: "100vh",
};
const campo = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#16222F",
  color: "#fff",
  fontSize: 15,
};
const botao = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#E0A526",
  color: "#000",
  fontWeight: "bold",
  fontSize: 15,
  marginBottom: 20,
};
const resultado = {
  background: "#000",
  color: "#0f0",
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  marginBottom: 30,
};

export default function TesteEmpresa() {
  const [nomeEmpresa, setNomeEmpresa] = useState("Empresa Teste");
  const [codigoAcesso, setCodigoAcesso] = useState("empresateste");
  const [email, setEmail] = useState("teste@exemplo.com");
  const [senha, setSenha] = useState("senha123456");
  const [resSignup, setResSignup] = useState("");
  const [resLogin, setResLogin] = useState("");
  const [carregando, setCarregando] = useState(false);

  const testarSignup = async () => {
    setCarregando(true);
    setResSignup("Enviando...");
    try {
      const r = await fetch("/api/empresa-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeEmpresa, codigoAcesso, email, senha }),
      });
      const j = await r.json();
      setResSignup(`Status HTTP: ${r.status}\n\n${JSON.stringify(j, null, 2)}`);
    } catch (e) {
      setResSignup("ERRO: " + (e && e.message ? e.message : String(e)));
    }
    setCarregando(false);
  };

  const testarLogin = async () => {
    setCarregando(true);
    setResLogin("Enviando...");
    try {
      const r = await fetch("/api/empresa-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoAcesso, senha }),
      });
      const j = await r.json();
      setResLogin(`Status HTTP: ${r.status}\n\n${JSON.stringify(j, null, 2)}`);
    } catch (e) {
      setResLogin("ERRO: " + (e && e.message ? e.message : String(e)));
    }
    setCarregando(false);
  };

  return (
    <div style={caixa}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>🧪 Teste de Empresa</h1>
      <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
        Página só pra testar o cadastro/login. Pode apagar depois que tudo funcionar.
      </p>

      <label style={{ fontSize: 12, color: "#94A3B8" }}>Nome da Empresa</label>
      <input style={campo} value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} />

      <label style={{ fontSize: 12, color: "#94A3B8" }}>Código de Acesso</label>
      <input style={campo} value={codigoAcesso} onChange={(e) => setCodigoAcesso(e.target.value)} />

      <label style={{ fontSize: 12, color: "#94A3B8" }}>E-mail</label>
      <input style={campo} value={email} onChange={(e) => setEmail(e.target.value)} />

      <label style={{ fontSize: 12, color: "#94A3B8" }}>Senha (mín. 6 caracteres)</label>
      <input style={campo} type="text" value={senha} onChange={(e) => setSenha(e.target.value)} />

      <button style={botao} onClick={testarSignup} disabled={carregando}>
        1) Testar Cadastro (Signup)
      </button>
      {resSignup && <div style={resultado}>{resSignup}</div>}

      <button style={botao} onClick={testarLogin} disabled={carregando}>
        2) Testar Login
      </button>
      {resLogin && <div style={resultado}>{resLogin}</div>}
    </div>
  );
}
