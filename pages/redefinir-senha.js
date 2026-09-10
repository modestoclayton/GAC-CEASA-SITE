import { useState, useEffect } from "react";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase do lado do navegador — precisa ser um cliente novo aqui
// (diferente do backend) porque é o próprio navegador que recebe o token de
// recuperação na URL do link do e-mail e estabelece a sessão temporária.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { detectSessionInUrl: true, persistSession: false } }
);

// Mesma paleta visual do restante do app, copiada aqui porque esta página
// roda sozinha (fora do GacCeasaApp.jsx), sem import de componentes.
const C = {
  green900: "#041C06",
  green700: "#3D7A00",
  amber500: "#E0A526",
  ink: "#E2E8F0",
  inkSoft: "#94A3B8",
  card: "#0F1922",
  cardAlt: "#16222F",
  line: "#1F2937",
  rust: "#E0632E",
};
const displayFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

const inputStyle = {
  width: "100%",
  background: C.cardAlt,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 15,
  color: C.ink,
  outline: "none",
};

export default function RedefinirSenha() {
  // "verificando" | "pronto" | "invalido" | "sucesso"
  const [estado, setEstado] = useState("verificando");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    // O link do e-mail já vem com o token de recuperação embutido na URL —
    // o supabase-js detecta isso sozinho (detectSessionInUrl) e dispara este
    // evento, criando uma sessão temporária só pra permitir trocar a senha,
    // sem a pessoa precisar saber a senha antiga.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setEstado("pronto");
    });

    // Caso o evento já tenha disparado antes deste componente montar.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setEstado((atual) => (atual === "verificando" ? "pronto" : atual));
    });

    // Se depois de alguns segundos nada aconteceu, o link provavelmente
    // expirou ou já foi usado — avisa em vez de deixar girando pra sempre.
    const timeout = setTimeout(() => {
      setEstado((atual) => (atual === "verificando" ? "invalido" : atual));
    }, 5000);

    return () => {
      listener?.subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const salvar = async () => {
    setErro("");
    if (senha.length < 6) {
      setErro("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não são iguais.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro(error.message || "Não foi possível trocar a senha.");
      return;
    }
    setEstado("sucesso");
  };

  return (
    <>
      <Head>
        <title>Redefinir senha — GAC CEASA Manager</title>
      </Head>
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: C.green900, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}
      >
        <div style={{ width: "100%", maxWidth: 384 }}>
          <div className="text-center" style={{ marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                margin: "0 auto 12px",
                background: C.amber500,
                color: C.green900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              GAC
            </div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, fontFamily: displayFont }}>
              Criar nova senha
            </div>
          </div>

          <div
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            {estado === "verificando" && (
              <p style={{ color: C.inkSoft, fontSize: 13, textAlign: "center" }}>
                Confirmando o link de recuperação…
              </p>
            )}

            {estado === "invalido" && (
              <>
                <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 12 }}>
                  Esse link não é mais válido — ele expira depois de um tempo ou já
                  pode ter sido usado. Volta na tela de login e pede um novo em
                  "Esqueci minha senha".
                </p>
                <a
                  href="/"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    background: C.amber500,
                    color: C.green900,
                    fontWeight: 800,
                    textDecoration: "none",
                    fontFamily: displayFont,
                  }}
                >
                  Voltar pro login
                </a>
              </>
            )}

            {estado === "pronto" && (
              <>
                <label style={{ display: "block", marginBottom: 12 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginBottom: 4 }}>
                    Nova senha
                  </span>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                    style={inputStyle}
                    autoFocus
                  />
                </label>
                <label style={{ display: "block", marginBottom: 12 }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", marginBottom: 4 }}>
                    Confirmar nova senha
                  </span>
                  <input
                    type="password"
                    placeholder="Digite de novo"
                    value={confirmar}
                    onChange={(e) => { setConfirmar(e.target.value); setErro(""); }}
                    style={inputStyle}
                  />
                </label>
                {erro && (
                  <div style={{ fontSize: 13, marginBottom: 12, padding: 8, borderRadius: 8, background: "#4A1F1F", color: "#FF8080" }}>
                    {erro}
                  </div>
                )}
                <button
                  onClick={salvar}
                  disabled={salvando || !senha || !confirmar}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    background: salvando || !senha || !confirmar ? "#3A4A41" : C.amber500,
                    color: salvando || !senha || !confirmar ? C.inkSoft : C.green900,
                    fontWeight: 800,
                    fontFamily: displayFont,
                  }}
                >
                  {salvando ? "Salvando…" : "Salvar nova senha"}
                </button>
              </>
            )}

            {estado === "sucesso" && (
              <>
                <p style={{ color: C.ink, fontSize: 14, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>
                  ✓ Senha alterada!
                </p>
                <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
                  Já pode fazer login normalmente com a senha nova.
                </p>
                <a
                  href="/"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    background: C.amber500,
                    color: C.green900,
                    fontWeight: 800,
                    textDecoration: "none",
                    fontFamily: displayFont,
                  }}
                >
                  Ir pro login
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
