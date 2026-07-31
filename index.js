import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutGrid,
  PlusCircle,
  Package,
  Wallet,
  ShoppingBasket,
  ArrowDownCircle,
  ArrowUpCircle,
  HandCoins,
  Landmark,
  AlertTriangle,
  Search,
  X,
  Check,
  ChevronRight,
  Loader2,
  Truck,
  ClipboardCheck,
  Users,
  Shield,
  Trash2,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Design tokens — "market ledger" identity for a CEASA yard app          */
/* ---------------------------------------------------------------------- */
const C = {
  canvas: "#E8E0C9", // kraft tag paper
  card: "#FBF8EF",
  cardAlt: "#F3EDDA",
  ink: "#241F16",
  inkSoft: "#6E6650",
  green900: "#122A1E",
  green800: "#173824",
  green700: "#1F4A30",
  green600: "#2B6640",
  amber500: "#D9861C",
  amber600: "#B76F13",
  amberSoft: "#F6E3C4",
  rust: "#A63B2E",
  rustSoft: "#F1DAD2",
  twine: "#C3AF80",
  line: "#D8CBA0",
};

const displayFont =
  "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Narrow', sans-serif";
const monoFont =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtMoney = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const SEED_CADASTROS = {
  produtos: [
    {
      id: "p1",
      codigo: 1001,
      nome: "BATATA DOCE",
      unidade: "CX",
      custoMedio: 50,
      precoVenda: 65,
      estoqueMinimo: 500,
    },
  ],
  clientes: [
    {
      id: "c1",
      codigo: 3001,
      nome: "L.MOCCI",
      cidade: "PALOTINA PR",
      limiteCredito: 0,
      pagamento: "BOLETO",
    },
  ],
  produtores: [
    {
      id: "pr1",
      codigo: 2001,
      nome: "JOÃO",
      cidade: "LONDRINA PR",
      telefone: "44998942726",
    },
  ],
  compradoresVendedores: [], // nomes autorizados a ter acesso completo (gestor)
};

const SEED_TRANSACOES = {
  compras: [
    {
      id: uid(),
      data: "2026-07-27",
      produtorId: "pr1",
      produto: "BATATA DOCE",
      quantidade: 500,
      valorUnit: 50,
      valorTotal: 25000,
      entregaConfirmada: false,
      quantidadeRecebida: null,
      divergencia: null,
    },
  ],
  vendas: [
    {
      id: uid(),
      data: "2026-07-27",
      clienteId: "c1",
      produto: "BATATA DOCE",
      quantidade: 250,
      precoUnit: 65,
      valorTotal: 16250,
      status: "Pendente",
      entrega: null,
    },
  ],
  recebimentos: [],
  pagamentos: [],
  perdas: [],
};

const CAD_KEY = "gac-cadastros";
const TX_KEY = "gac-transacoes";
const PERFIL_KEY = "gac-perfil";

/* ---------------------------------------------------------------------- */
/* Small UI atoms                                                         */
/* ---------------------------------------------------------------------- */
function CrateTag({ label, value, sub, tone = "amber" }) {
  const bg = tone === "amber" ? C.amber500 : tone === "rust" ? C.rust : C.green600;
  const fg = "#FBF8EF";
  return (
    <div
      className="relative rounded-md py-3 shadow-sm overflow-hidden"
      style={{
        background: bg,
        color: fg,
        clipPath: "polygon(0% 50%, 10px 0%, 100% 0%, 100% 100%, 10px 100%)",
        paddingLeft: 22,
        paddingRight: 14,
      }}
    >
      {/* punch hole */}
      <span
        className="absolute rounded-full"
        style={{
          left: 3,
          top: "50%",
          width: 5,
          height: 5,
          transform: "translateY(-50%)",
          background: C.canvas,
        }}
      />
      {/* stitch line */}
      <span
        className="absolute"
        style={{
          left: 14,
          top: 4,
          bottom: 4,
          borderLeft: "1px dashed rgba(251,248,239,0.35)",
        }}
      />
      <div
        className="text-xs uppercase tracking-widest font-bold opacity-90"
        style={{ fontFamily: displayFont, letterSpacing: 1 }}
      >
        {label}
      </div>
      <div
        className="text-xl font-bold leading-tight"
        style={{ fontFamily: monoFont }}
      >
        {value}
      </div>
      {sub && <div className="text-xs opacity-80 mt-0.5">{sub}</div>}
    </div>
  );
}

function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{
        background: C.card,
        borderColor: C.line,
        boxShadow: "0 1px 2px rgba(36,31,22,0.06)",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <div
      className="flex items-center gap-2 mb-2 mt-5 first:mt-0"
      style={{ color: C.green900 }}
    >
      {Icon && <Icon size={16} />}
      <h2
        className="text-xs uppercase tracking-widest font-bold"
        style={{ fontFamily: displayFont }}
      >
        {children}
      </h2>
    </div>
  );
}

function Badge({ children, tone = "ok" }) {
  const color =
    tone === "ok" ? C.green700 : tone === "warn" ? C.amber600 : C.rust;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap uppercase"
      style={{
        color,
        border: `1.5px solid ${color}`,
        letterSpacing: 0.4,
        fontFamily: displayFont,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span
        className="block text-xs uppercase tracking-wide font-bold mb-1"
        style={{ color: C.inkSoft }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 15,
  color: C.ink,
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select(props) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {props.children}
    </select>
  );
}

function PrimaryButton({ children, onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold text-sm active:scale-95 transition-transform"
      style={{
        background: disabled ? "#C9C2AF" : C.green700,
        color: "#fff",
        fontFamily: displayFont,
        fontWeight: 800,
        letterSpacing: 0.5,
      }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function PerfilHeader({ perfil, titulo, onTrocar }) {
  return (
    <header
      className="px-4 pt-5 pb-4 flex items-start gap-3"
      style={{ background: C.green900, color: "#fff" }}
    >
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          border: `2px solid ${C.amber500}`,
          color: C.amber500,
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        GAC
      </div>
      <div className="flex-1">
        <div
          className="text-xs uppercase tracking-widest font-bold opacity-70"
          style={{ fontFamily: displayFont }}
        >
          CEASA Manager · Pátio
        </div>
        <div
          className="text-2xl font-bold leading-tight"
          style={{ fontFamily: displayFont, letterSpacing: 0.5 }}
        >
          {titulo}
        </div>
        <div className="text-xs opacity-60 mt-0.5">{fmtDate(todayISO())}</div>
      </div>
      <button onClick={onTrocar} className="text-xs font-bold opacity-70 flex-shrink-0 text-right">
        {perfil.nome}
        <br />
        Trocar
      </button>
    </header>
  );
}

function ToastBanner({ toast }) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 z-20"
      style={{ background: C.green700, color: "#fff" }}
    >
      <Check size={14} /> {toast}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Cadastro de Perfil (define acesso: Comprador/Vendedor, Conferente,     */
/* Entregador)                                                            */
/* ---------------------------------------------------------------------- */
const FUNCOES = [
  {
    id: "gestor",
    label: "Comprador / Vendedor",
    desc: "Acesso completo: dashboard, compras, vendas, estoque e contas.",
  },
  {
    id: "conferente",
    label: "Conferente",
    desc: "Acesso só à conferência de compras (chegada de mercadoria).",
  },
  {
    id: "entregador",
    label: "Entregador",
    desc: "Acesso só às entregas com o seu nome como carregador.",
  },
];

function CadastroPerfil({ onSalvar }) {
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("gestor");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const tentarEntrar = async () => {
    setErro("");
    setEnviando(true);
    const resultado = await onSalvar({ nome: nome.trim(), funcao });
    setEnviando(false);
    if (resultado && !resultado.ok) {
      setErro(resultado.message || "Não foi possível entrar.");
    }
  };

  return (
    <div
      className="mx-auto max-w-md flex flex-col items-center justify-center px-6"
      style={{ background: C.canvas, minHeight: 640 }}
    >
      <div
        className="rounded-full flex items-center justify-center mb-4"
        style={{
          width: 56,
          height: 56,
          border: `2px solid ${C.amber500}`,
          color: C.amber500,
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 16,
        }}
      >
        GAC
      </div>
      <div
        className="text-xl font-bold mb-1 text-center"
        style={{ fontFamily: displayFont, color: C.green900 }}
      >
        Quem é você?
      </div>
      <p className="text-xs text-center mb-5" style={{ color: C.inkSoft }}>
        Cadastre seu nome e sua função pra liberar o acesso certo neste
        aparelho.
      </p>
      <Card className="w-full">
        <Field label="Seu nome">
          <TextInput
            placeholder="Ex: Marcos"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setErro("");
            }}
            autoFocus
          />
        </Field>
        <Field label="Função">
          <div className="flex flex-col gap-2">
            {FUNCOES.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFuncao(f.id);
                  setErro("");
                }}
                className="text-left rounded-lg p-3"
                style={{
                  border: `2px solid ${funcao === f.id ? C.green700 : C.line}`,
                  background: funcao === f.id ? C.cardAlt : "#fff",
                }}
              >
                <div className="font-bold text-sm" style={{ color: C.green900 }}>
                  {f.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                  {f.desc}
                </div>
              </button>
            ))}
          </div>
        </Field>
        {erro && (
          <div
            className="flex items-center gap-2 text-xs font-bold mb-3 px-2 py-2 rounded"
            style={{ background: C.rustSoft, color: C.rust }}
          >
            <AlertTriangle size={14} />
            {erro}
          </div>
        )}
        <PrimaryButton disabled={!nome.trim() || enviando} onClick={tentarEntrar} icon={Check}>
          {enviando ? "Verificando…" : "Entrar"}
        </PrimaryButton>
      </Card>
      <p className="text-xs text-center mt-4" style={{ color: C.inkSoft }}>
        O acesso de Comprador/Vendedor só é liberado pra nomes já cadastrados
        na lista de autorizados. Conferente e Entregador não precisam de
        cadastro prévio.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Main App                                                                */
/* ---------------------------------------------------------------------- */
export default function GacCeasaApp() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [cadastros, setCadastros] = useState(SEED_CADASTROS);
  const [transacoes, setTransacoes] = useState(SEED_TRANSACOES);
  const [toast, setToast] = useState(null);
  const [perfil, setPerfil] = useState(null); // { nome, funcao } | null
  const [erroCarregamento, setErroCarregamento] = useState(null);

  // ---- carrega da planilha (via API do servidor) + perfil do navegador ----
  useEffect(() => {
    (async () => {
      let cad = SEED_CADASTROS;
      let tx = SEED_TRANSACOES;

      try {
        const res = await fetch("/api/dados");
        const json = await res.json();
        if (json.ok) {
          cad = { ...SEED_CADASTROS, ...json.cadastros };
          tx = { ...SEED_TRANSACOES, ...json.transacoes };
        } else {
          setErroCarregamento(json.erro || "Erro desconhecido ao carregar dados.");
        }
      } catch (e) {
        setErroCarregamento((e && e.message) || String(e));
      }

      // perfil: privado por navegador/aparelho (quem sou eu aqui)
      let perfilSalvo = null;
      try {
        const salvo = localStorage.getItem(PERFIL_KEY);
        if (salvo) perfilSalvo = JSON.parse(salvo);
      } catch (e) {
        /* sem perfil salvo ainda */
      }

      setCadastros(cad);
      setTransacoes(tx);
      setPerfil(perfilSalvo);
      setLoading(false);
    })();
  }, []);

  const persistCadastros = useCallback(async (next) => {
    setCadastros(next);
    try {
      await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cadastros", data: next }),
      });
    } catch (e) {
      /* ignore write failure, keep local state */
    }
  }, []);

  const persistTransacoes = useCallback(async (next) => {
    setTransacoes(next);
    try {
      await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "transacoes", data: next }),
      });
    } catch (e) {
      /* ignore write failure, keep local state */
    }
  }, []);

  const salvarPerfil = useCallback(
    async (novoPerfil) => {
      const nomeNorm = novoPerfil.nome.trim().toLowerCase();

      if (novoPerfil.funcao === "gestor") {
        const lista = cadastros.compradoresVendedores || [];
        const jaAutorizado = lista.some((n) => n.trim().toLowerCase() === nomeNorm);

        if (lista.length === 0) {
          // ninguém cadastrado ainda: este nome vira a base da lista de autorizados
          await persistCadastros({
            ...cadastros,
            compradoresVendedores: [novoPerfil.nome.trim()],
          });
        } else if (!jaAutorizado) {
          return {
            ok: false,
            message:
              "Seu nome não está na lista de Compradores/Vendedores autorizados. Peça pra alguém já cadastrado te adicionar em Contas → Gerenciar Acesso.",
          };
        }
      }

      setPerfil(novoPerfil);
      try {
        localStorage.setItem(PERFIL_KEY, JSON.stringify(novoPerfil));
      } catch (e) {
        /* ignore write failure, keep local state */
      }
      return { ok: true };
    },
    [cadastros, persistCadastros]
  );

  const trocarPerfil = useCallback(async () => {
    setPerfil(null);
    try {
      localStorage.removeItem(PERFIL_KEY);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* ---------------- derived data ---------------- */
  const estoquePorProduto = useMemo(() => {
    return cadastros.produtos.map((p) => {
      const entradas = transacoes.compras
        .filter((c) => c.produto === p.nome)
        .reduce((s, c) => s + Number(c.quantidade), 0);
      const saidas = transacoes.vendas
        .filter((v) => v.produto === p.nome)
        .reduce((s, v) => s + Number(v.quantidade), 0);
      const perdas = (transacoes.perdas || [])
        .filter((pd) => pd.produto === p.nome)
        .reduce((s, pd) => s + Number(pd.quantidade), 0);
      const saldo = entradas - saidas - perdas;
      return { ...p, entradas, saidas, perdas, saldo };
    });
  }, [cadastros.produtos, transacoes.compras, transacoes.vendas, transacoes.perdas]);

  const contaClientes = useMemo(() => {
    return cadastros.clientes.map((cl) => {
      const debito = transacoes.vendas
        .filter((v) => v.clienteId === cl.id)
        .reduce((s, v) => s + Number(v.valorTotal), 0);
      const credito = transacoes.recebimentos
        .filter((r) => r.clienteId === cl.id)
        .reduce((s, r) => s + Number(r.valor), 0);
      const saldo = debito - credito;
      const acima = cl.limiteCredito > 0 && saldo > cl.limiteCredito;
      return { ...cl, saldo, acima };
    });
  }, [cadastros.clientes, transacoes.vendas, transacoes.recebimentos]);

  const contaProdutores = useMemo(() => {
    return cadastros.produtores.map((pr) => {
      const debito = transacoes.compras
        .filter((c) => c.produtorId === pr.id)
        .reduce((s, c) => s + Number(c.valorTotal), 0);
      const credito = transacoes.pagamentos
        .filter((p) => p.produtorId === pr.id)
        .reduce((s, p) => s + Number(p.valor), 0);
      const saldo = debito - credito;
      return { ...pr, saldo, pendente: saldo > 0 };
    });
  }, [cadastros.produtores, transacoes.compras, transacoes.pagamentos]);

  const dashboard = useMemo(() => {
    const t = todayISO();
    const faturamentoHoje = transacoes.vendas
      .filter((v) => v.data === t)
      .reduce((s, v) => s + Number(v.valorTotal), 0);
    const comprasHoje = transacoes.compras
      .filter((c) => c.data === t)
      .reduce((s, c) => s + Number(c.valorTotal), 0);
    const lucroHoje = transacoes.vendas
      .filter((v) => v.data === t)
      .reduce((s, v) => {
        const prod = cadastros.produtos.find((p) => p.nome === v.produto);
        const custo = prod ? prod.custoMedio : 0;
        return s + (Number(v.precoUnit) - custo) * Number(v.quantidade);
      }, 0);
    const contasReceber = contaClientes.reduce((s, c) => s + Math.max(c.saldo, 0), 0);
    const estoqueBaixo = estoquePorProduto.filter((e) => e.saldo < e.estoqueMinimo).length;
    const perdaHoje = (transacoes.perdas || [])
      .filter((pd) => pd.data === t)
      .reduce((s, pd) => s + Number(pd.valorPerdido), 0);
    return { faturamentoHoje, comprasHoje, lucroHoje, contasReceber, estoqueBaixo, perdaHoje };
  }, [transacoes, cadastros.produtos, contaClientes, estoquePorProduto]);

  /* ---------------- loading splash ---------------- */
  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ background: C.canvas, minHeight: 520 }}
      >
        <div className="flex flex-col items-center gap-3" style={{ color: C.green900 }}>
          <Loader2 className="animate-spin" size={28} />
          <div className="text-sm font-bold" style={{ fontFamily: displayFont }}>
            Carregando GAC CEASA…
          </div>
        </div>
      </div>
    );
  }

  const bannerErro = erroCarregamento ? (
    <div className="px-4 pt-3 mx-auto max-w-md">
      <Card style={{ background: C.rustSoft, borderColor: C.rust }}>
        <div className="text-xs font-bold mb-1" style={{ color: C.rust }}>
          Não conseguiu buscar dados da planilha
        </div>
        <div
          className="text-xs"
          style={{ color: C.ink, fontFamily: monoFont, wordBreak: "break-word" }}
        >
          {erroCarregamento}
        </div>
        <div className="text-xs mt-2" style={{ color: C.inkSoft }}>
          Confira as variáveis de ambiente no Vercel (GOOGLE_SHEET_ID,
          GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) e se a planilha foi
          compartilhada com o e-mail da conta de serviço.
        </div>
      </Card>
    </div>
  ) : null;

  /* ---------------- perfil não cadastrado ainda ---------------- */
  if (!perfil) {
    return (
      <>
        {bannerErro}
        <CadastroPerfil onSalvar={salvarPerfil} />
      </>
    );
  }

  /* ---------------- acesso restrito: Conferente ---------------- */
  if (perfil.funcao === "conferente") {
    return (
      <div
        className="mx-auto max-w-md flex flex-col"
        style={{
          background: C.canvas,
          minHeight: 640,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {bannerErro}
        <PerfilHeader perfil={perfil} titulo="Conferência de Compras" onTrocar={trocarPerfil} />
        <main className="flex-1 px-4 py-4 overflow-y-auto">
          <ConferenciaComprasTab
            cadastros={cadastros}
            transacoes={transacoes}
            persistTransacoes={persistTransacoes}
            showToast={showToast}
          />
        </main>
        {toast && <ToastBanner toast={toast} />}
      </div>
    );
  }

  /* ---------------- acesso restrito: Entregador ---------------- */
  if (perfil.funcao === "entregador") {
    return (
      <div
        className="mx-auto max-w-md flex flex-col"
        style={{
          background: C.canvas,
          minHeight: 640,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {bannerErro}
        <PerfilHeader perfil={perfil} titulo="Minhas Entregas" onTrocar={trocarPerfil} />
        <main className="flex-1 px-4 py-4 overflow-y-auto">
          <EntregasTab
            cadastros={cadastros}
            transacoes={transacoes}
            persistTransacoes={persistTransacoes}
            showToast={showToast}
            soMeuNome={perfil.nome}
          />
        </main>
        {toast && <ToastBanner toast={toast} />}
      </div>
    );
  }

  /* ---------------- acesso completo: Comprador/Vendedor ---------------- */
  return (
    <div
      className="mx-auto max-w-md flex flex-col"
      style={{
        background: C.canvas,
        minHeight: 640,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {bannerErro}
      {/* Header */}
      <header
        className="px-4 pt-5 pb-4 flex items-start gap-3"
        style={{ background: C.green900, color: "#fff" }}
      >
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            border: `2px solid ${C.amber500}`,
            color: C.amber500,
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 0.5,
            marginTop: 2,
          }}
        >
          GAC
        </div>
        <div className="flex-1">
          <div
            className="text-xs uppercase tracking-widest font-bold opacity-70 flex items-center gap-1.5"
            style={{ fontFamily: displayFont }}
          >
            CEASA Manager · Pátio
          </div>
          <div
            className="text-2xl font-bold leading-tight"
            style={{ fontFamily: displayFont, letterSpacing: 0.5 }}
          >
            {tab === "dashboard" && "Hoje no Pátio"}
            {tab === "registrar" && "Registrar Movimento"}
            {tab === "estoque" && "Estoque"}
            {tab === "conta" && "Conta Corrente"}
          </div>
          <div className="text-xs opacity-60 mt-0.5">{fmtDate(todayISO())}</div>
        </div>
        <button onClick={trocarPerfil} className="text-xs font-bold opacity-70 flex-shrink-0">
          {perfil.nome}
          <br />
          Trocar
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {tab === "dashboard" && (
          <DashboardTab
            dashboard={dashboard}
            estoquePorProduto={estoquePorProduto}
            contaClientes={contaClientes}
            contaProdutores={contaProdutores}
          />
        )}
        {tab === "registrar" && (
          <RegistrarTab
            cadastros={cadastros}
            transacoes={transacoes}
            persistCadastros={persistCadastros}
            persistTransacoes={persistTransacoes}
            showToast={showToast}
          />
        )}
        {tab === "estoque" && (
          <EstoqueTab
            estoquePorProduto={estoquePorProduto}
            cadastros={cadastros}
            transacoes={transacoes}
            persistTransacoes={persistTransacoes}
            showToast={showToast}
          />
        )}
        {tab === "conta" && (
          <ContaCorrenteTab
            contaClientes={contaClientes}
            contaProdutores={contaProdutores}
            transacoes={transacoes}
            cadastros={cadastros}
            persistCadastros={persistCadastros}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 z-20"
          style={{ background: C.green700, color: "#fff" }}
        >
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex border-t"
        style={{ background: C.green900, borderColor: C.green700 }}
      >
        <NavButton
          active={tab === "dashboard"}
          icon={LayoutGrid}
          label="Hoje"
          onClick={() => setTab("dashboard")}
        />
        <NavButton
          active={tab === "registrar"}
          icon={PlusCircle}
          label="Registrar"
          onClick={() => setTab("registrar")}
        />
        <NavButton
          active={tab === "estoque"}
          icon={Package}
          label="Estoque"
          onClick={() => setTab("estoque")}
        />
        <NavButton
          active={tab === "conta"}
          icon={Wallet}
          label="Contas"
          onClick={() => setTab("conta")}
        />
      </nav>
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 flex flex-col items-center gap-1 py-2.5"
      style={{ color: active ? C.amber500 : "#7E9484" }}
    >
      {active && (
        <span
          className="absolute top-0 rounded-full"
          style={{ width: 24, height: 3, background: C.amber500 }}
        />
      )}
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span
        className="text-xs font-bold uppercase tracking-wide"
        style={{ fontFamily: displayFont, fontWeight: 800 }}
      >
        {label}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Dashboard Tab                                                          */
/* ---------------------------------------------------------------------- */
function DashboardTab({ dashboard, estoquePorProduto, contaClientes, contaProdutores }) {
  const alertas = estoquePorProduto.filter((e) => e.saldo < e.estoqueMinimo);
  const clientesAcima = contaClientes.filter((c) => c.acima);
  const produtoresPendentes = contaProdutores.filter((p) => p.pendente);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <CrateTag label="Faturamento Hoje" value={fmtMoney(dashboard.faturamentoHoje)} />
        <CrateTag label="Compras Hoje" value={fmtMoney(dashboard.comprasHoje)} tone="green" />
        <CrateTag label="Lucro Bruto Hoje" value={fmtMoney(dashboard.lucroHoje)} />
        <CrateTag
          label="A Receber"
          value={fmtMoney(dashboard.contasReceber)}
          tone={dashboard.contasReceber > 0 ? "rust" : "green"}
        />
        <CrateTag
          label="Perda Hoje"
          value={fmtMoney(dashboard.perdaHoje)}
          tone={dashboard.perdaHoje > 0 ? "rust" : "green"}
        />
      </div>

      <SectionTitle icon={AlertTriangle}>Alertas de estoque</SectionTitle>
      {alertas.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhum produto abaixo do estoque mínimo.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {alertas.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{a.nome}</div>
                <div className="text-xs" style={{ color: C.inkSoft }}>
                  Saldo {a.saldo} / mínimo {a.estoqueMinimo} {a.unidade}
                </div>
              </div>
              <Badge tone="danger">repor</Badge>
            </Card>
          ))}
        </div>
      )}

      {(clientesAcima.length > 0 || produtoresPendentes.length > 0) && (
        <>
          <SectionTitle icon={Landmark}>Ações financeiras</SectionTitle>
          <div className="flex flex-col gap-2">
            {clientesAcima.map((c) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{c.nome}</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>
                    Saldo devedor {fmtMoney(c.saldo)} — acima do limite
                  </div>
                </div>
                <Badge tone="danger">cobrar</Badge>
              </Card>
            ))}
            {produtoresPendentes.map((p) => (
              <Card key={p.id} className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{p.nome}</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>
                    A pagar {fmtMoney(p.saldo)}
                  </div>
                </div>
                <Badge tone="warn">pagar</Badge>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Registrar Tab                                                          */
/* ---------------------------------------------------------------------- */
const TIPOS = [
  { id: "compra", label: "Compra", icon: ArrowDownCircle },
  { id: "venda", label: "Venda", icon: ArrowUpCircle },
  { id: "recebimento", label: "Recebi de Cliente", icon: HandCoins },
  { id: "pagamento", label: "Paguei Produtor", icon: Landmark },
  { id: "entregas", label: "Entregas", icon: Truck },
  { id: "conferencia", label: "Conferência Compras", icon: ClipboardCheck },
];

function RegistrarTab({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast }) {
  const [tipo, setTipo] = useState("compra");

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTipo(t.id)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold"
            style={{
              background: tipo === t.id ? C.green700 : "#fff",
              color: tipo === t.id ? "#fff" : C.green900,
              border: `1px solid ${tipo === t.id ? C.green700 : C.line}`,
              fontFamily: displayFont,
              fontWeight: 800,
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tipo === "compra" && (
        <FormCompra
          cadastros={cadastros}
          transacoes={transacoes}
          persistCadastros={persistCadastros}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
      {tipo === "venda" && (
        <FormVenda
          cadastros={cadastros}
          transacoes={transacoes}
          persistCadastros={persistCadastros}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
      {tipo === "recebimento" && (
        <FormRecebimento
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
      {tipo === "pagamento" && (
        <FormPagamento
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
      {tipo === "entregas" && (
        <EntregasTab
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
      {tipo === "conferencia" && (
        <ConferenciaComprasTab
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function QuickAddInline({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold mt-1"
        style={{ color: C.green700 }}
      >
        + Cadastrar novo
      </button>
    );
  return (
    <div className="flex gap-2 mt-2">
      <TextInput
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        autoFocus
      />
      <button
        className="px-3 rounded-lg font-bold text-sm"
        style={{ background: C.amber500, color: C.green900 }}
        onClick={() => {
          if (!val.trim()) return;
          onAdd(val.trim());
          setVal("");
          setOpen(false);
        }}
      >
        OK
      </button>
      <button onClick={() => setOpen(false)} style={{ color: C.inkSoft }}>
        <X size={18} />
      </button>
    </div>
  );
}

function QuickAddCliente({ onAdd, standalone = false }) {
  const [open, setOpen] = useState(standalone);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [limiteCredito, setLimiteCredito] = useState("");
  const [pagamento, setPagamento] = useState("BOLETO");

  const reset = () => {
    setNome("");
    setCidade("");
    setLimiteCredito("");
    setPagamento("BOLETO");
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold mt-1"
        style={{ color: C.green700 }}
      >
        + Cadastrar novo cliente
      </button>
    );

  return (
    <div
      className="mt-2 rounded-lg p-3"
      style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
    >
      <Field label="Nome do cliente">
        <TextInput
          placeholder="Ex: L.MOCCI"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Cidade">
        <TextInput
          placeholder="Ex: PALOTINA PR"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Limite de Crédito (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
            placeholder="0,00"
            value={limiteCredito}
            onChange={(e) => setLimiteCredito(e.target.value)}
          />
        </Field>
        <Field label="Forma de Pagamento">
          <Select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option value="BOLETO">Boleto</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="OUTRO">Outro</option>
          </Select>
        </Field>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm"
          style={{ background: C.amber500, color: C.green900 }}
          onClick={() => {
            if (!nome.trim()) return;
            onAdd({
              nome: nome.trim(),
              cidade: cidade.trim(),
              limiteCredito: Number(limiteCredito) || 0,
              pagamento,
            });
            reset();
            if (!standalone) setOpen(false);
          }}
        >
          Salvar Cliente
        </button>
        {!standalone && (
          <button
            className="px-3 rounded-lg"
            style={{ color: C.inkSoft }}
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function FormCompra({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast }) {
  const [produtorId, setProdutorId] = useState(cadastros.produtores[0]?.id || "");
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnit, setValorUnit] = useState("");
  const total = (Number(quantidade) || 0) * (Number(valorUnit) || 0);

  const addProdutor = async (nome) => {
    const novo = { id: uid(), codigo: Date.now() % 100000, nome, cidade: "", telefone: "" };
    const next = { ...cadastros, produtores: [...cadastros.produtores, novo] };
    await persistCadastros(next);
    setProdutorId(novo.id);
  };
  const addProduto = async (nome) => {
    const novo = {
      id: uid(),
      codigo: Date.now() % 100000,
      nome: nome.toUpperCase(),
      unidade: "UN",
      custoMedio: 0,
      precoVenda: 0,
      estoqueMinimo: 0,
    };
    const next = { ...cadastros, produtos: [...cadastros.produtos, novo] };
    await persistCadastros(next);
    setProduto(novo.nome);
  };

  const salvar = async () => {
    if (!produtorId || !produto || !quantidade || !valorUnit) return;
    const nova = {
      id: uid(),
      data: todayISO(),
      produtorId,
      produto,
      quantidade: Number(quantidade),
      valorUnit: Number(valorUnit),
      valorTotal: total,
      entregaConfirmada: false,
      quantidadeRecebida: null,
      divergencia: null,
    };
    await persistTransacoes({ ...transacoes, compras: [nova, ...transacoes.compras] });
    setQuantidade("");
    setValorUnit("");
    showToast("Compra registrada");
  };

  return (
    <Card>
      <Field label="Produtor">
        <Select value={produtorId} onChange={(e) => setProdutorId(e.target.value)}>
          {cadastros.produtores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
        <QuickAddInline placeholder="Nome do produtor" onAdd={addProdutor} />
      </Field>
      <Field label="Produto">
        <Select value={produto} onChange={(e) => setProduto(e.target.value)}>
          {cadastros.produtos.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </Select>
        <QuickAddInline placeholder="Nome do produto" onAdd={addProduto} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade">
          <TextInput
            type="number"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Valor Unit. (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
            value={valorUnit}
            onChange={(e) => setValorUnit(e.target.value)}
            placeholder="0,00"
          />
        </Field>
      </div>
      <div className="text-sm font-bold mb-3" style={{ color: C.green700 }}>
        Total: <span style={{ fontFamily: monoFont }}>{fmtMoney(total)}</span>
      </div>
      <PrimaryButton onClick={salvar} icon={ArrowDownCircle}>
        Registrar Compra
      </PrimaryButton>
    </Card>
  );
}

function FormVenda({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast }) {
  const [clienteId, setClienteId] = useState(cadastros.clientes[0]?.id || "");
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [entregaVendaId, setEntregaVendaId] = useState(null);
  const total = (Number(quantidade) || 0) * (Number(precoUnit) || 0);

  useEffect(() => {
    const p = cadastros.produtos.find((p) => p.nome === produto);
    if (p && p.precoVenda) setPrecoUnit(String(p.precoVenda));
  }, [produto]); // eslint-disable-line react-hooks/exhaustive-deps

  const addCliente = async (dados) => {
    const novo = { id: uid(), codigo: Date.now() % 100000, ...dados };
    const next = { ...cadastros, clientes: [...cadastros.clientes, novo] };
    await persistCadastros(next);
    setClienteId(novo.id);
  };

  const salvar = async () => {
    if (!clienteId || !produto || !quantidade || !precoUnit) return;
    const novaId = uid();
    const nova = {
      id: novaId,
      data: todayISO(),
      clienteId,
      produto,
      quantidade: Number(quantidade),
      precoUnit: Number(precoUnit),
      valorTotal: total,
      status,
      entrega: null,
    };
    await persistTransacoes({ ...transacoes, vendas: [nova, ...transacoes.vendas] });
    setQuantidade("");
    showToast("Venda registrada");
    setEntregaVendaId(novaId);
  };

  if (entregaVendaId) {
    return (
      <EntregaVendaForm
        vendaId={entregaVendaId}
        transacoes={transacoes}
        persistTransacoes={persistTransacoes}
        showToast={showToast}
        onDone={() => setEntregaVendaId(null)}
      />
    );
  }

  return (
    <Card>
      <Field label="Cliente">
        <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          {cadastros.clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <QuickAddCliente onAdd={addCliente} />
      </Field>
      <Field label="Produto">
        <Select value={produto} onChange={(e) => setProduto(e.target.value)}>
          {cadastros.produtos.map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade">
          <TextInput
            type="number"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Preço Unit. (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
            value={precoUnit}
            onChange={(e) => setPrecoUnit(e.target.value)}
            placeholder="0,00"
          />
        </Field>
      </div>
      <Field label="Status do pagamento">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
        </Select>
      </Field>
      <div className="text-sm font-bold mb-3" style={{ color: C.green700 }}>
        Total: <span style={{ fontFamily: monoFont }}>{fmtMoney(total)}</span>
      </div>
      <PrimaryButton onClick={salvar} icon={ArrowUpCircle}>
        Registrar Venda
      </PrimaryButton>
    </Card>
  );
}

function EntregaVendaForm({ vendaId, initial, transacoes, persistTransacoes, showToast, onDone }) {
  const [placa, setPlaca] = useState(initial?.placa || "");
  const [localEntrega, setLocalEntrega] = useState(initial?.localEntrega || "");
  const [carregador, setCarregador] = useState(initial?.carregador || "");
  const [telefone, setTelefone] = useState(initial?.telefone || "");

  const salvarEntrega = async () => {
    const nextVendas = transacoes.vendas.map((v) =>
      v.id === vendaId
        ? {
            ...v,
            entrega: {
              placa: placa.trim(),
              localEntrega: localEntrega.trim(),
              carregador: carregador.trim(),
              telefone: telefone.trim(),
              confirmada: initial?.confirmada || false,
            },
          }
        : v
    );
    await persistTransacoes({ ...transacoes, vendas: nextVendas });
    showToast("Dados de entrega salvos");
    onDone();
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Truck size={18} style={{ color: C.green700 }} />
        <div
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: C.green900, fontFamily: displayFont, fontWeight: 800 }}
        >
          Dados de Entrega
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        {initial
          ? "Atualize os dados do transporte dessa venda."
          : 'Venda registrada. Preencha os dados do transporte agora, ou pule e preencha depois em "Entregas".'}
      </p>
      <Field label="Placa do Caminhão">
        <TextInput
          placeholder="Ex: ABC-1D23"
          value={placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
          autoFocus
        />
      </Field>
      <Field label="Local de Entrega">
        <TextInput
          placeholder="Ex: Galpão 4, Box 12"
          value={localEntrega}
          onChange={(e) => setLocalEntrega(e.target.value)}
        />
      </Field>
      <Field label="Nome do Carregador">
        <TextInput
          placeholder="Ex: Marcos"
          value={carregador}
          onChange={(e) => setCarregador(e.target.value)}
        />
      </Field>
      <Field label="Telefone do Carregador">
        <TextInput
          type="tel"
          inputMode="tel"
          placeholder="Ex: (44) 99894-2726"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        <PrimaryButton onClick={salvarEntrega} icon={Truck}>
          Salvar Entrega
        </PrimaryButton>
      </div>
      <button
        onClick={onDone}
        className="w-full text-center text-xs font-bold mt-3"
        style={{ color: C.inkSoft }}
      >
        {initial ? "Cancelar" : "Pular por agora"}
      </button>
    </Card>
  );
}

function FormRecebimento({ cadastros, transacoes, persistTransacoes, showToast }) {
  const [clienteId, setClienteId] = useState(cadastros.clientes[0]?.id || "");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");

  const salvar = async () => {
    if (!clienteId || !valor) return;
    const novo = { id: uid(), data: todayISO(), clienteId, valor: Number(valor), obs };
    await persistTransacoes({
      ...transacoes,
      recebimentos: [novo, ...transacoes.recebimentos],
    });
    setValor("");
    setObs("");
    showToast("Recebimento registrado");
  };

  return (
    <Card>
      <Field label="Cliente">
        <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          {cadastros.clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Valor Recebido (R$)">
        <TextInput
          type="number"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label="Observação (opcional)">
        <TextInput value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: PIX, boleto nº..." />
      </Field>
      <PrimaryButton onClick={salvar} icon={HandCoins}>
        Registrar Recebimento
      </PrimaryButton>
    </Card>
  );
}

function FormPagamento({ cadastros, transacoes, persistTransacoes, showToast }) {
  const [produtorId, setProdutorId] = useState(cadastros.produtores[0]?.id || "");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");

  const salvar = async () => {
    if (!produtorId || !valor) return;
    const novo = { id: uid(), data: todayISO(), produtorId, valor: Number(valor), obs };
    await persistTransacoes({
      ...transacoes,
      pagamentos: [novo, ...transacoes.pagamentos],
    });
    setValor("");
    setObs("");
    showToast("Pagamento registrado");
  };

  return (
    <Card>
      <Field label="Produtor">
        <Select value={produtorId} onChange={(e) => setProdutorId(e.target.value)}>
          {cadastros.produtores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Valor Pago (R$)">
        <TextInput
          type="number"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label="Observação (opcional)">
        <TextInput value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: PIX, dinheiro..." />
      </Field>
      <PrimaryButton onClick={salvar} icon={Landmark}>
        Registrar Pagamento
      </PrimaryButton>
    </Card>
  );
}

/* ---------------------------------------------------------------------- */
/* Entregas Tab (pós-venda)                                               */
/* ---------------------------------------------------------------------- */
function EntregasTab({ cadastros, transacoes, persistTransacoes, showToast, soMeuNome }) {
  const clienteNome = (id) => cadastros.clientes.find((c) => c.id === id)?.nome || "—";
  const [editandoId, setEditandoId] = useState(null);

  const norm = (s) => (s || "").trim().toLowerCase();
  const ehMinha = (v) => !soMeuNome || norm(v.entrega?.carregador) === norm(soMeuNome);

  const comEntrega = transacoes.vendas.filter((v) => v.entrega && ehMinha(v));
  const pendentes = comEntrega.filter((v) => !v.entrega.confirmada);
  const confirmadas = comEntrega.filter((v) => v.entrega.confirmada);
  // vendas sem dados de entrega só fazem sentido pra quem cadastra (gestor);
  // o entregador só vê o que já está com o nome dele
  const semDados = soMeuNome ? [] : transacoes.vendas.filter((v) => !v.entrega);

  const toggleConfirmada = async (vendaId, next) => {
    const nextVendas = transacoes.vendas.map((v) =>
      v.id === vendaId ? { ...v, entrega: { ...v.entrega, confirmada: next } } : v
    );
    await persistTransacoes({ ...transacoes, vendas: nextVendas });
    showToast(next ? "Entrega confirmada" : "Entrega desmarcada");
  };

  const EntregaCard = ({ v }) => {
    if (editandoId === v.id) {
      return (
        <EntregaVendaForm
          vendaId={v.id}
          initial={v.entrega}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
          onDone={() => setEditandoId(null)}
        />
      );
    }
    return (
      <Card key={v.id} className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-bold text-sm">{clienteNome(v.clienteId)}</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>
            {v.produto} · {v.quantidade} un · {fmtDate(v.data)}
          </div>
          <div className="text-xs mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5" style={{ color: C.inkSoft }}>
            <span>
              <b style={{ color: C.ink }}>Placa:</b> {v.entrega.placa || "—"}
            </span>
            <span>
              <b style={{ color: C.ink }}>Local:</b> {v.entrega.localEntrega || "—"}
            </span>
            <span>
              <b style={{ color: C.ink }}>Carregador:</b> {v.entrega.carregador || "—"}
            </span>
            <span>
              <b style={{ color: C.ink }}>Telefone:</b> {v.entrega.telefone || "—"}
            </span>
          </div>
          <button
            onClick={() => setEditandoId(v.id)}
            className="text-xs font-bold mt-1.5"
            style={{ color: C.green700 }}
          >
            Editar dados
          </button>
        </div>
        <button
          onClick={() => toggleConfirmada(v.id, !v.entrega.confirmada)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <span
            className="flex items-center justify-center rounded-md"
            style={{
              width: 30,
              height: 30,
              background: v.entrega.confirmada ? C.green700 : "#fff",
              border: `2px solid ${v.entrega.confirmada ? C.green700 : C.line}`,
            }}
          >
            {v.entrega.confirmada && <Check size={18} color="#fff" />}
          </span>
          <span className="text-xs font-bold" style={{ color: C.inkSoft }}>
            Entregue
          </span>
        </button>
      </Card>
    );
  };

  return (
    <div>
      {pendentes.length > 0 && (
        <>
          <SectionTitle icon={Truck}>Entregas pendentes</SectionTitle>
          <div className="flex flex-col gap-2">
            {pendentes.map((v) => (
              <EntregaCard key={v.id} v={v} />
            ))}
          </div>
        </>
      )}

      {semDados.length > 0 && (
        <>
          <SectionTitle icon={AlertTriangle}>Vendas sem dados de entrega</SectionTitle>
          <div className="flex flex-col gap-2">
            {semDados.map((v) =>
              editandoId === v.id ? (
                <EntregaVendaForm
                  key={v.id}
                  vendaId={v.id}
                  transacoes={transacoes}
                  persistTransacoes={persistTransacoes}
                  showToast={showToast}
                  onDone={() => setEditandoId(null)}
                />
              ) : (
                <Card key={v.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">{clienteNome(v.clienteId)}</div>
                    <div className="text-xs" style={{ color: C.inkSoft }}>
                      {v.produto} · {v.quantidade} un · {fmtDate(v.data)}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditandoId(v.id)}
                    className="px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 flex-shrink-0"
                    style={{ background: C.amber500, color: C.green900 }}
                  >
                    <Truck size={14} />
                    Adicionar
                  </button>
                </Card>
              )
            )}
          </div>
        </>
      )}

      {confirmadas.length > 0 && (
        <>
          <SectionTitle icon={Check}>Entregas confirmadas</SectionTitle>
          <div className="flex flex-col gap-2">
            {confirmadas.map((v) => (
              <EntregaCard key={v.id} v={v} />
            ))}
          </div>
        </>
      )}

      {comEntrega.length === 0 && semDados.length === 0 && (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            {soMeuNome
              ? "Nenhuma entrega atribuída ao seu nome ainda."
              : "Nenhuma venda registrada ainda."}
          </p>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Conferência de Compras (cargueiro tica recebimento)                    */
/* ---------------------------------------------------------------------- */
function ConferenciaComprasTab({ cadastros, transacoes, persistTransacoes, showToast }) {
  const produtorNome = (id) => cadastros.produtores.find((p) => p.id === id)?.nome || "—";
  const [conferindoId, setConferindoId] = useState(null);

  const pendentes = transacoes.compras.filter((c) => !c.entregaConfirmada);
  const confirmadas = transacoes.compras.filter((c) => c.entregaConfirmada);

  const confirmar = async (compraId, quantidadeRecebida) => {
    const nextCompras = transacoes.compras.map((c) => {
      if (c.id !== compraId) return c;
      const divergencia = Number(quantidadeRecebida) - Number(c.quantidade);
      return {
        ...c,
        entregaConfirmada: true,
        quantidadeRecebida: Number(quantidadeRecebida),
        divergencia,
      };
    });
    await persistTransacoes({ ...transacoes, compras: nextCompras });
    setConferindoId(null);
    showToast("Recebimento confirmado");
  };

  const desconfirmar = async (compraId) => {
    const nextCompras = transacoes.compras.map((c) =>
      c.id === compraId
        ? { ...c, entregaConfirmada: false, quantidadeRecebida: null, divergencia: null }
        : c
    );
    await persistTransacoes({ ...transacoes, compras: nextCompras });
    showToast("Confirmação removida");
  };

  const ConferirForm = ({ c }) => {
    const [qtd, setQtd] = useState(String(c.quantidade));
    const divergencia = Number(qtd) - Number(c.quantidade);
    return (
      <Card key={c.id}>
        <div className="font-bold text-sm">{c.produto}</div>
        <div className="text-xs mb-3" style={{ color: C.inkSoft }}>
          {produtorNome(c.produtorId)} · pedido: {c.quantidade} un · {fmtDate(c.data)}
        </div>
        <Field label="Quantidade Recebida">
          <TextInput
            type="number"
            inputMode="decimal"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            autoFocus
          />
        </Field>
        {divergencia !== 0 && qtd !== "" && (
          <div
            className="flex items-center gap-2 text-xs font-bold mb-3 px-2 py-1.5 rounded"
            style={{ background: C.rustSoft, color: C.rust }}
          >
            <AlertTriangle size={14} />
            Divergência de {divergencia > 0 ? "+" : ""}
            {divergencia} un em relação ao pedido
          </div>
        )}
        <div className="flex gap-2">
          <PrimaryButton onClick={() => confirmar(c.id, qtd)} icon={Check}>
            Confirmar Recebimento
          </PrimaryButton>
        </div>
        <button
          onClick={() => setConferindoId(null)}
          className="w-full text-center text-xs font-bold mt-3"
          style={{ color: C.inkSoft }}
        >
          Cancelar
        </button>
      </Card>
    );
  };

  const CompraRow = ({ c }) => {
    if (conferindoId === c.id) return <ConferirForm c={c} />;
    const temDivergencia = c.entregaConfirmada && c.divergencia !== null && c.divergencia !== 0;
    return (
      <Card key={c.id}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="font-bold text-sm">{c.produto}</div>
            <div className="text-xs" style={{ color: C.inkSoft }}>
              {produtorNome(c.produtorId)} · pedido: {c.quantidade} un · {fmtDate(c.data)}
            </div>
            {c.entregaConfirmada && (
              <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                Recebido: {c.quantidadeRecebida} un
              </div>
            )}
          </div>
          <button
            onClick={() =>
              c.entregaConfirmada ? desconfirmar(c.id) : setConferindoId(c.id)
            }
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <span
              className="flex items-center justify-center rounded-md"
              style={{
                width: 30,
                height: 30,
                background: c.entregaConfirmada ? C.green700 : "#fff",
                border: `2px solid ${c.entregaConfirmada ? C.green700 : C.line}`,
              }}
            >
              {c.entregaConfirmada && <Check size={18} color="#fff" />}
            </span>
            <span className="text-xs font-bold" style={{ color: C.inkSoft }}>
              OK Entrega
            </span>
          </button>
        </div>
        {temDivergencia && (
          <div
            className="flex items-center gap-2 text-xs font-bold mt-2 pt-2 border-t px-1"
            style={{ color: C.rust, borderColor: C.line }}
          >
            <AlertTriangle size={14} />
            Divergência de {c.divergencia > 0 ? "+" : ""}
            {c.divergencia} un em relação ao pedido
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        Lista de compras pra o cargueiro conferir a quantidade recebida e marcar quando a
        mercadoria chegar no pátio.
      </p>
      <SectionTitle icon={ClipboardCheck}>A conferir</SectionTitle>
      {pendentes.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma compra pendente de conferência.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {pendentes.map((c) => (
            <CompraRow key={c.id} c={c} />
          ))}
        </div>
      )}

      {confirmadas.length > 0 && (
        <>
          <SectionTitle icon={Check}>Conferidas</SectionTitle>
          <div className="flex flex-col gap-2">
            {confirmadas.map((c) => (
              <CompraRow key={c.id} c={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Estoque Tab                                                            */
/* ---------------------------------------------------------------------- */
const MOTIVOS_PERDA = ["Deterioração", "Quebra/Dano", "Vencido", "Outro"];

function EstoqueTab({ estoquePorProduto, cadastros, transacoes, persistTransacoes, showToast }) {
  const [view, setView] = useState("estoque");
  const [q, setQ] = useState("");
  const filtered = estoquePorProduto.filter((p) =>
    p.nome.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: "estoque", label: "Estoque", icon: Package },
          { id: "perdas", label: "Perdas", icon: AlertTriangle },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold"
            style={{
              background: view === v.id ? C.green700 : "#fff",
              color: view === v.id ? "#fff" : C.green900,
              border: `1px solid ${view === v.id ? C.green700 : C.line}`,
              fontFamily: displayFont,
              fontWeight: 800,
            }}
          >
            <v.icon size={16} />
            {v.label}
          </button>
        ))}
      </div>

      {view === "estoque" && (
        <div>
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: C.inkSoft }}
            />
            <TextInput
              placeholder="Buscar produto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <div className="flex flex-col gap-2">
            {filtered.map((p) => {
              const baixo = p.saldo < p.estoqueMinimo;
              return (
                <Card key={p.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{p.nome}</div>
                      <div className="text-xs" style={{ color: C.inkSoft }}>
                        Mínimo: {p.estoqueMinimo} {p.unidade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-bold"
                        style={{ fontFamily: monoFont, color: baixo ? C.rust : C.green700 }}
                      >
                        {p.saldo}
                      </div>
                      <Badge tone={baixo ? "danger" : "ok"}>{baixo ? "abaixo do mínimo" : "ok"}</Badge>
                    </div>
                  </div>
                  <div
                    className="flex justify-between text-xs mt-2 pt-2 border-t"
                    style={{ color: C.inkSoft, borderColor: C.line }}
                  >
                    <span>Entradas: {p.entradas}</span>
                    <span>Saídas: {p.saidas}</span>
                    <span>Perdas: {p.perdas || 0}</span>
                    <span>Custo méd.: {fmtMoney(p.custoMedio)}</span>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <Card>
                <p className="text-sm" style={{ color: C.inkSoft }}>
                  Nenhum produto encontrado.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {view === "perdas" && (
        <PerdasTab
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Perdas — lançamento de perda diária por produto                        */
/* ---------------------------------------------------------------------- */
function PerdasTab({ cadastros, transacoes, persistTransacoes, showToast }) {
  const [aberto, setAberto] = useState(false);
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS_PERDA[0]);

  const perdas = transacoes.perdas || [];
  const hoje = todayISO();
  const perdasHoje = perdas.filter((p) => p.data === hoje);
  const totalHojeRS = perdasHoje.reduce((s, p) => s + Number(p.valorPerdido), 0);
  const totalGeralRS = perdas.reduce((s, p) => s + Number(p.valorPerdido), 0);

  const custoDoProduto = (nome) =>
    cadastros.produtos.find((p) => p.nome === nome)?.custoMedio || 0;
  const valorEstimado = (Number(quantidade) || 0) * custoDoProduto(produto);

  const resumoPorProduto = useMemo(() => {
    const map = {};
    perdas.forEach((p) => {
      if (!map[p.produto]) map[p.produto] = { produto: p.produto, quantidade: 0, valor: 0 };
      map[p.produto].quantidade += Number(p.quantidade);
      map[p.produto].valor += Number(p.valorPerdido);
    });
    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [perdas]);

  const salvar = async () => {
    if (!produto || !quantidade) return;
    const nova = {
      id: uid(),
      data: todayISO(),
      produto,
      quantidade: Number(quantidade),
      motivo,
      valorPerdido: valorEstimado,
    };
    await persistTransacoes({ ...transacoes, perdas: [nova, ...perdas] });
    setQuantidade("");
    setAberto(false);
    showToast("Perda registrada");
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <CrateTag label="Perda Hoje" value={fmtMoney(totalHojeRS)} tone="rust" />
        <CrateTag label="Perda Total" value={fmtMoney(totalGeralRS)} tone="rust" />
      </div>

      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-4"
          style={{
            background: C.amber500,
            color: C.green900,
            fontFamily: displayFont,
            fontWeight: 800,
          }}
        >
          <PlusCircle size={16} />
          Registrar Perda
        </button>
      ) : (
        <Card className="mb-4">
          <Field label="Produto">
            <Select value={produto} onChange={(e) => setProduto(e.target.value)}>
              {cadastros.produtos.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade Perdida">
              <TextInput
                type="number"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </Field>
            <Field label="Motivo">
              <Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS_PERDA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="text-sm font-bold mb-3" style={{ color: C.rust }}>
            Valor perdido (estimado):{" "}
            <span style={{ fontFamily: monoFont }}>{fmtMoney(valorEstimado)}</span>
          </div>
          <div className="flex gap-2">
            <PrimaryButton onClick={salvar} icon={AlertTriangle}>
              Salvar Perda
            </PrimaryButton>
          </div>
          <button
            onClick={() => setAberto(false)}
            className="w-full text-center text-xs font-bold mt-3"
            style={{ color: C.inkSoft }}
          >
            Cancelar
          </button>
        </Card>
      )}

      <SectionTitle icon={AlertTriangle}>Perdas de hoje</SectionTitle>
      {perdasHoje.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma perda registrada hoje.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {perdasHoje.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{p.produto}</div>
                <div className="text-xs" style={{ color: C.inkSoft }}>
                  {p.quantidade} un · {p.motivo}
                </div>
              </div>
              <div className="text-sm font-bold" style={{ fontFamily: monoFont, color: C.rust }}>
                {fmtMoney(p.valorPerdido)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle icon={Package}>Perda total por produto</SectionTitle>
      {resumoPorProduto.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma perda registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {resumoPorProduto.map((r) => (
            <Card key={r.produto} className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{r.produto}</div>
                <div className="text-xs" style={{ color: C.inkSoft }}>
                  {r.quantidade} un perdidas no total
                </div>
              </div>
              <div className="text-sm font-bold" style={{ fontFamily: monoFont, color: C.rust }}>
                {fmtMoney(r.valor)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Gerenciar Acesso — lista de Compradores/Vendedores autorizados         */
/* ---------------------------------------------------------------------- */
function GerenciarAcessoView({ cadastros, persistCadastros, showToast }) {
  const [novoNome, setNovoNome] = useState("");
  const lista = cadastros.compradoresVendedores || [];

  const adicionar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    const jaExiste = lista.some((n) => n.trim().toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
      showToast("Esse nome já está na lista");
      return;
    }
    await persistCadastros({ ...cadastros, compradoresVendedores: [...lista, nome] });
    setNovoNome("");
    showToast("Adicionado à lista de autorizados");
  };

  const remover = async (nome) => {
    await persistCadastros({
      ...cadastros,
      compradoresVendedores: lista.filter((n) => n !== nome),
    });
    showToast("Removido da lista");
  };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        Só nomes cadastrados aqui conseguem entrar como Comprador/Vendedor
        (acesso completo ao app). Conferente e Entregador não precisam estar
        nessa lista.
      </p>
      <Card className="mb-3">
        <Field label="Adicionar nome autorizado">
          <div className="flex gap-2">
            <TextInput
              placeholder="Ex: Marcos"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button
              className="px-3 rounded-lg font-bold text-sm flex-shrink-0"
              style={{ background: C.amber500, color: C.green900 }}
              onClick={adicionar}
            >
              + Add
            </button>
          </div>
        </Field>
      </Card>

      {lista.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhum nome cadastrado ainda — o próximo que entrar como
            Comprador/Vendedor vira o primeiro autorizado automaticamente.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((nome) => (
            <Card key={nome} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: C.green700 }} />
                <span className="font-bold text-sm">{nome}</span>
              </div>
              <button onClick={() => remover(nome)} style={{ color: C.rust }}>
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Conta Corrente Tab                                                     */
/* ---------------------------------------------------------------------- */
function ContaCorrenteTab({ contaClientes, contaProdutores, transacoes, cadastros, persistCadastros, showToast }) {
  const [view, setView] = useState("clientes");
  const [expanded, setExpanded] = useState(null);
  const [novoOpen, setNovoOpen] = useState(false);

  const addCliente = async (dados) => {
    const novo = { id: uid(), codigo: Date.now() % 100000, ...dados };
    const next = { ...cadastros, clientes: [...cadastros.clientes, novo] };
    await persistCadastros(next);
    setNovoOpen(false);
    if (showToast) showToast("Cliente cadastrado");
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {[
          { id: "clientes", label: "Clientes", icon: ShoppingBasket },
          { id: "produtores", label: "Produtores", icon: Package },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold"
            style={{
              background: view === v.id ? C.green700 : "#fff",
              color: view === v.id ? "#fff" : C.green900,
              border: `1px solid ${view === v.id ? C.green700 : C.line}`,
              fontFamily: displayFont,
              fontWeight: 800,
            }}
          >
            <v.icon size={16} />
            {v.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setView("acesso")}
        className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold mb-4"
        style={{
          background: view === "acesso" ? C.green700 : "#fff",
          color: view === "acesso" ? "#fff" : C.green900,
          border: `1px solid ${view === "acesso" ? C.green700 : C.line}`,
          fontFamily: displayFont,
          fontWeight: 800,
        }}
      >
        <Shield size={14} />
        Gerenciar Acesso (Comprador/Vendedor)
      </button>

      {view === "acesso" && (
        <GerenciarAcessoView cadastros={cadastros} persistCadastros={persistCadastros} showToast={showToast} />
      )}

      {view === "clientes" && (
        <div className="flex flex-col gap-2">
          {!novoOpen ? (
            <button
              onClick={() => setNovoOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-1"
              style={{
                background: C.amber500,
                color: C.green900,
                fontFamily: displayFont,
                fontWeight: 800,
              }}
            >
              <PlusCircle size={16} />
              Novo Cliente
            </button>
          ) : (
            <Card>
              <QuickAddCliente onAdd={addCliente} standalone />
              <button
                className="text-xs font-bold mt-1"
                style={{ color: C.inkSoft }}
                onClick={() => setNovoOpen(false)}
              >
                Cancelar
              </button>
            </Card>
          )}
          {contaClientes.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{c.nome}</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>
                    Limite: {c.limiteCredito ? fmtMoney(c.limiteCredito) : "não definido"}
                  </div>
                </div>
                <div className="text-right flex items-center gap-1">
                  <div>
                    <div
                      className="text-lg font-bold"
                      style={{ fontFamily: monoFont, color: c.acima ? C.rust : C.green700 }}
                    >
                      {fmtMoney(c.saldo)}
                    </div>
                    <Badge tone={c.acima ? "danger" : "ok"}>
                      {c.acima ? "acima do limite" : "ok"}
                    </Badge>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{
                      color: C.inkSoft,
                      transform: expanded === c.id ? "rotate(90deg)" : "none",
                    }}
                  />
                </div>
              </div>
              {expanded === c.id && (
                <ExtratoCliente clienteId={c.id} transacoes={transacoes} />
              )}
            </Card>
          ))}
        </div>
      )}

      {view === "produtores" && (
        <div className="flex flex-col gap-2">
          {contaProdutores.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{p.nome}</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>
                    {p.cidade || "—"}
                  </div>
                </div>
                <div className="text-right flex items-center gap-1">
                  <div>
                    <div
                      className="text-lg font-bold"
                      style={{ fontFamily: monoFont, color: p.pendente ? C.amber600 : C.green700 }}
                    >
                      {fmtMoney(p.saldo)}
                    </div>
                    <Badge tone={p.pendente ? "warn" : "ok"}>
                      {p.pendente ? "a pagar" : "quitado"}
                    </Badge>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{
                      color: C.inkSoft,
                      transform: expanded === p.id ? "rotate(90deg)" : "none",
                    }}
                  />
                </div>
              </div>
              {expanded === p.id && (
                <ExtratoProdutor produtorId={p.id} transacoes={transacoes} />
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ExtratoCliente({ clienteId, transacoes }) {
  const lancamentos = [
    ...transacoes.vendas
      .filter((v) => v.clienteId === clienteId)
      .map((v) => ({ data: v.data, tipo: "Venda", valor: v.valorTotal, sinal: 1 })),
    ...transacoes.recebimentos
      .filter((r) => r.clienteId === clienteId)
      .map((r) => ({ data: r.data, tipo: "Recebimento", valor: r.valor, sinal: -1 })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1));

  return <Extrato lancamentos={lancamentos} />;
}

function ExtratoProdutor({ produtorId, transacoes }) {
  const lancamentos = [
    ...transacoes.compras
      .filter((c) => c.produtorId === produtorId)
      .map((c) => ({ data: c.data, tipo: "Compra", valor: c.valorTotal, sinal: 1 })),
    ...transacoes.pagamentos
      .filter((p) => p.produtorId === produtorId)
      .map((p) => ({ data: p.data, tipo: "Pagamento", valor: p.valor, sinal: -1 })),
  ].sort((a, b) => (a.data < b.data ? 1 : -1));

  return <Extrato lancamentos={lancamentos} />;
}

function Extrato({ lancamentos }) {
  if (lancamentos.length === 0)
    return (
      <p className="text-xs mt-2 pt-2 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>
        Sem lançamentos.
      </p>
    );
  return (
    <div className="mt-2 pt-2 border-t flex flex-col gap-1.5" style={{ borderColor: C.line }}>
      {lancamentos.map((l, i) => (
        <div key={i} className="flex justify-between text-xs">
          <span style={{ color: C.inkSoft }}>
            {fmtDate(l.data)} · {l.tipo}
          </span>
          <span
            style={{
              fontFamily: monoFont,
              fontWeight: 700,
              color: l.sinal > 0 ? C.rust : C.green700,
            }}
          >
            {l.sinal > 0 ? "+" : "−"}
            {fmtMoney(l.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}
