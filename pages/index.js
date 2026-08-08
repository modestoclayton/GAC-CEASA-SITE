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
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Menu,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Design tokens — dark modern identity, same green/amber palette         */
/* ---------------------------------------------------------------------- */
const C = {
  canvas: "#0B2417", // deep green base
  canvasGlow: "#173A26", // gradient highlight
  card: "#12301F",
  cardAlt: "#1B4230",
  ink: "#F3F1E8",
  inkSoft: "#9FB8A9",
  green900: "#081C11",
  green800: "#123324",
  green700: "#1E4A30",
  green600: "#276642",
  amber500: "#E0A526",
  amber600: "#C48A16",
  amberSoft: "#3A2E12",
  rust: "#E0632E",
  rustSoft: "#3A1C12",
  twine: "#2A4C39",
  line: "#254A36",
};

const displayFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
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
      temCNPJ: true,
      temDescontoFundoRural: false,
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
function CrateTag({ label, value, sub, tone = "amber", icon: Icon }) {
  const bg = tone === "amber" ? C.amber500 : tone === "rust" ? C.rust : C.green700;
  const fg = "#FFFFFF";
  return (
    <div
      className="relative rounded-2xl p-3.5 overflow-hidden"
      style={{
        background: bg,
        color: fg,
        boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
      }}
    >
      {Icon && (
        <div
          className="flex items-center justify-center rounded-xl mb-2"
          style={{
            width: 30,
            height: 30,
            background: "rgba(255,255,255,0.18)",
          }}
        >
          <Icon size={16} strokeWidth={2.25} />
        </div>
      )}
      <div
        className="text-xs uppercase tracking-wide font-bold opacity-90 leading-tight"
        style={{ fontFamily: displayFont }}
      >
        {label}
      </div>
      <div
        className="text-lg font-bold leading-tight mt-0.5"
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
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        background: C.card,
        borderColor: C.line,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
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
      style={{ color: C.ink }}
    >
      {Icon && <Icon size={16} style={{ color: C.amber500 }} />}
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
    tone === "ok" ? "#6FCF97" : tone === "warn" ? C.amber500 : C.rust;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap uppercase"
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
  background: C.cardAlt,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
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
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm active:scale-95 transition-transform"
      style={{
        background: disabled ? "#3A4A41" : C.amber500,
        color: disabled ? C.inkSoft : C.green900,
        fontFamily: displayFont,
        fontWeight: 800,
        letterSpacing: 0.3,
        boxShadow: disabled ? "none" : "0 4px 14px rgba(224,165,38,0.35)",
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
      className="px-4 pt-6 pb-5 flex items-start gap-3"
      style={{
        background: `linear-gradient(135deg, ${C.canvasGlow} 0%, ${C.green900} 100%)`,
        color: "#fff",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div
        className="rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          width: 42,
          height: 42,
          background: `linear-gradient(135deg, ${C.amber500}, ${C.green600})`,
          color: "#fff",
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 0.5,
          marginTop: 2,
          boxShadow: `0 0 16px rgba(224,165,38,0.4)`,
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
          style={{ fontFamily: displayFont, letterSpacing: 0.2 }}
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

/* ---------------------------------------------------------------------- */
/* Recibo / Pedido — tela dedicada pra imprimir ou salvar como PDF        */
/* (Ctrl+P no navegador → "Salvar como PDF" — funciona sem internet)      */
/* ---------------------------------------------------------------------- */
function ReciboView({ tipo, item, cadastros, onFechar, transacoes }) {
  const isVenda = tipo === "venda";
  
  // Para vendas: agrupa TODAS as vendas do mesmo cliente
  // Para compras: agrupa TODAS as compras do mesmo clienteDestino
  const parte = isVenda
    ? cadastros.clientes.find((c) => c.id === item.clienteId)
    : cadastros.produtores.find((p) => p.id === item.produtorId);

  const clienteDestino = !isVenda && item.clienteDestino
    ? cadastros.clientes.find((c) => c.id === item.clienteDestino)
    : null;

  // Agregar vendas/compras do mesmo destino
  const itens = isVenda
    ? (transacoes?.vendas || []).filter(v => v.clienteId === item.clienteId)
    : (transacoes?.compras || []).filter(c => c.clienteDestino === item.clienteDestino);

  // Para compras: agrupar por fornecedor e calcular desconto individual
  let itensAgrupados = itens;
  let totalSubtotal = 0;
  let totalDesconto = 0;

  if (!isVenda) {
    // Compras: calcular desconto de cada fornecedor individualmente
    itensAgrupados = itens.map(comp => {
      const produtor = cadastros.produtores.find(p => p.id === comp.produtorId);
      const desconto = produtor?.temDescontoFundoRural ? comp.valorTotal * 0.0163 : 0;
      totalSubtotal += Number(comp.valorTotal);
      totalDesconto += desconto;
      return { ...comp, desconto, produtor };
    });
  } else {
    // Vendas: sem desconto
    totalSubtotal = itens.reduce((s, i) => s + Number(i.valorTotal), 0);
  }

  const totalGeral = totalSubtotal - totalDesconto;

  const titulo = isVenda ? "Pedido de Venda" : "Vale de Compra";
  const rotuloParte = isVenda ? "Cliente" : "Fornecedor";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "#F4F2EA" }}
    >
      <div className="mx-auto max-w-md py-6 px-6" style={{ color: "#1C1B18" }}>
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={onFechar}
            className="text-sm font-bold flex items-center gap-1"
            style={{ color: "#1F4A30" }}
          >
            <X size={16} /> Fechar
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl font-bold text-sm text-white"
            style={{ background: "#1F4A30" }}
          >
            Imprimir / Salvar PDF
          </button>
        </div>

        <div className="border-b-2 pb-4 mb-4" style={{ borderColor: "#1F4A30" }}>
          <div className="text-xs uppercase tracking-widest font-bold" style={{ color: "#6E6650" }}>
            GAC CEASA Manager
          </div>
          <div className="text-2xl font-bold" style={{ color: "#1F4A30" }}>
            {titulo}
          </div>
          <div className="text-xs mt-1" style={{ color: "#6E6650" }}>
            Emitido em {fmtDate(todayISO())}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase font-bold mb-1" style={{ color: "#6E6650" }}>
            {rotuloParte}
          </div>
          <div className="text-lg font-bold">{parte ? parte.nome : "—"}</div>
          {parte && parte.cidade && (
            <div className="text-sm" style={{ color: "#6E6650" }}>
              {parte.cidade}
            </div>
          )}
          {parte && parte.telefone && (
            <div className="text-sm" style={{ color: "#6E6650" }}>
              Tel: {parte.telefone}
            </div>
          )}
        </div>

        {!isVenda && clienteDestino && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: "#EDEAE0" }}>
            <div className="text-xs uppercase font-bold mb-1" style={{ color: "#6E6650" }}>
              Para Quem (Cliente Destino)
            </div>
            <div className="text-lg font-bold">{clienteDestino.nome}</div>
            {clienteDestino.cidade && (
              <div className="text-sm" style={{ color: "#6E6650" }}>
                {clienteDestino.cidade}
              </div>
            )}
            {clienteDestino.telefone && (
              <div className="text-sm" style={{ color: "#6E6650" }}>
                Tel: {clienteDestino.telefone}
              </div>
            )}
          </div>
        )}

        <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #1F4A30" }}>
              <th className="text-left py-2">Produto</th>
              <th className="text-right py-2">Qtd.</th>
              <th className="text-right py-2">Valor Unit.</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #D8CBA0" }}>
                <td className="py-2">{i.produto}</td>
                <td className="text-right py-2">{i.quantidade}</td>
                <td className="text-right py-2">{fmtMoney(isVenda ? i.precoUnit : i.valorUnit)}</td>
                <td className="text-right py-2 font-bold">{fmtMoney(i.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="text-right">
            <div className="text-xs uppercase font-bold mb-1" style={{ color: "#6E6650" }}>
              Subtotal
            </div>
            <div className="text-lg" style={{ fontFamily: "monospace" }}>
              {fmtMoney(totalSubtotal)}
            </div>
            {totalDesconto > 0 && (
              <>
                <div className="text-xs uppercase font-bold mt-2 mb-1" style={{ color: "#D9861C" }}>
                  Desconto (-1.63%)
                </div>
                <div className="text-lg" style={{ fontFamily: "monospace", color: "#D9861C" }}>
                  -{fmtMoney(totalDesconto)}
                </div>
              </>
            )}
            <div className="text-xs uppercase font-bold mt-3 mb-1 pt-2 border-t" style={{ color: "#6E6650", borderColor: "#D8CBA0" }}>
              Total {isVenda ? "do Pedido" : "do Vale"}
            </div>
            <div className="text-2xl font-bold" style={{ color: "#1F4A30" }}>
              {fmtMoney(totalGeral)}
            </div>
          </div>
        </div>

        {isVenda && (
          <div className="mb-4 text-sm">
            <span className="font-bold">Status do pagamento: </span>
            {item.status || "—"}
          </div>
        )}

        {isVenda && item.entrega && (
          <div className="mb-6 p-3 rounded-lg" style={{ background: "#EDEAE0" }}>
            <div className="text-xs uppercase font-bold mb-1" style={{ color: "#6E6650" }}>
              Dados de Entrega
            </div>
            <div className="text-sm">Placa: {item.entrega.placa || "—"}</div>
            <div className="text-sm">Local: {item.entrega.localEntrega || "—"}</div>
            <div className="text-sm">Carregador: {item.entrega.carregador || "—"}</div>
            <div className="text-sm">Telefone: {item.entrega.telefone || "—"}</div>
          </div>
        )}

        <div className="text-xs text-center mt-8 pt-4 border-t" style={{ color: "#6E6650", borderColor: "#D8CBA0" }}>
          Documento gerado pelo GAC CEASA Manager — {fmtDate(todayISO())}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          nav,
          header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

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
      className="mx-auto max-w-md lg:max-w-2xl flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #173A26 0%, #0B2417 55%, #081C11 100%)", minHeight: "100vh", boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}
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
        style={{ fontFamily: displayFont, color: C.ink }}
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
                className="text-left rounded-xl p-3"
                style={{
                  border: `2px solid ${funcao === f.id ? C.amber500 : C.line}`,
                  background: funcao === f.id ? C.cardAlt : "transparent",
                }}
              >
                <div className="font-bold text-sm" style={{ color: C.ink }}>
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
  const [recibo, setRecibo] = useState(null); // { tipo: 'venda'|'compra', item } | null
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
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cadastros", data: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || !json.ok) {
        setErroCarregamento(
          (json && json.erro) || `Falha ao salvar na planilha (HTTP ${res.status})`
        );
      }
    } catch (e) {
      setErroCarregamento((e && e.message) || String(e));
    }
  }, []);

  const persistTransacoes = useCallback(async (next) => {
    setTransacoes(next);
    try {
      const res = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "transacoes", data: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || !json.ok) {
        setErroCarregamento(
          (json && json.erro) || `Falha ao salvar na planilha (HTTP ${res.status})`
        );
      }
    } catch (e) {
      setErroCarregamento((e && e.message) || String(e));
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
        style={{ background: "linear-gradient(160deg, #173A26 0%, #0B2417 55%, #081C11 100%)", minHeight: 520 }}
      >
        <div className="flex flex-col items-center gap-3" style={{ color: C.ink }}>
          <Loader2 className="animate-spin" size={28} />
          <div className="text-sm font-bold" style={{ fontFamily: displayFont }}>
            Carregando GAC CEASA…
          </div>
        </div>
      </div>
    );
  }

  const bannerErro = erroCarregamento ? (
    <div className="px-4 pt-3 mx-auto max-w-md lg:max-w-2xl">
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

  /* ---------------- recibo/pedido em modo impressão ---------------- */
  if (recibo) {
    return (
      <ReciboView
        tipo={recibo.tipo}
        item={recibo.item}
        cadastros={cadastros}
        transacoes={transacoes}
        onFechar={() => setRecibo(null)}
      />
    );
  }

  /* ---------------- acesso restrito: Conferente ---------------- */
  if (perfil.funcao === "conferente") {
    return (
      <div
        className="mx-auto max-w-md lg:max-w-2xl flex flex-col"
        style={{
          background: "linear-gradient(160deg, #173A26 0%, #0B2417 55%, #081C11 100%)",
          minHeight: "100vh",
          boxShadow: "0 0 60px rgba(0,0,0,0.15)",
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
            setRecibo={setRecibo}
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
        className="mx-auto max-w-md lg:max-w-2xl flex flex-col"
        style={{
          background: "linear-gradient(160deg, #173A26 0%, #0B2417 55%, #081C11 100%)",
          minHeight: "100vh",
          boxShadow: "0 0 60px rgba(0,0,0,0.15)",
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
            setRecibo={setRecibo}
          />
        </main>
        {toast && <ToastBanner toast={toast} />}
      </div>
    );
  }

  /* ---------------- acesso completo: Comprador/Vendedor ---------------- */
  return (
    <div
      className="mx-auto max-w-md lg:max-w-2xl flex flex-col"
      style={{
        background: "linear-gradient(160deg, #173A26 0%, #0B2417 55%, #081C11 100%)",
        minHeight: "100vh",
        boxShadow: "0 0 60px rgba(0,0,0,0.15)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {bannerErro}
      {/* Header */}
      <header
        className="px-4 pt-6 pb-5 flex items-start gap-3"
        style={{
          background: `linear-gradient(135deg, ${C.canvasGlow} 0%, ${C.green900} 100%)`,
          color: "#fff",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          className="rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            width: 42,
            height: 42,
            background: `linear-gradient(135deg, ${C.amber500}, ${C.green600})`,
            color: "#fff",
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 0.5,
            marginTop: 2,
            boxShadow: `0 0 16px rgba(224,165,38,0.4)`,
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
            setRecibo={setRecibo}
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
        className="fixed bottom-3 left-1/2 -translate-x-1/2 max-w-md lg:max-w-2xl flex rounded-2xl border"
        style={{
          width: "calc(100% - 24px)",
          background: "rgba(11,36,23,0.92)",
          borderColor: C.line,
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
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
      className="relative flex-1 flex flex-col items-center gap-1 py-2"
      style={{ color: active ? C.amber500 : "#5F8270" }}
    >
      <span
        className="flex items-center justify-center rounded-xl transition-colors"
        style={{
          width: 40,
          height: 30,
          background: active ? "rgba(224,165,38,0.15)" : "transparent",
        }}
      >
        <Icon size={19} strokeWidth={active ? 2.5 : 2} />
      </span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CrateTag
          label="Faturamento Hoje"
          value={fmtMoney(dashboard.faturamentoHoje)}
          icon={TrendingUp}
        />
        <CrateTag
          label="Compras Hoje"
          value={fmtMoney(dashboard.comprasHoje)}
          tone="green"
          icon={ShoppingCart}
        />
        <CrateTag
          label="Lucro Bruto Hoje"
          value={fmtMoney(dashboard.lucroHoje)}
          icon={TrendingUp}
        />
        <CrateTag
          label="A Receber"
          value={fmtMoney(dashboard.contasReceber)}
          tone={dashboard.contasReceber > 0 ? "rust" : "green"}
          icon={Wallet}
        />
        <CrateTag
          label="Perda Hoje"
          value={fmtMoney(dashboard.perdaHoje)}
          tone={dashboard.perdaHoje > 0 ? "rust" : "green"}
          icon={TrendingDown}
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

function FolhaDePedidoTab({ cadastros, transacoes }) {
  const [clienteSelecionado, setClienteSelecionado] = useState("");

  // Lista de clientes únicos nas compras
  const clientes = [...new Set(transacoes.compras.map((c) => c.clienteDestino).filter(Boolean))].sort();

  // Filtra compras do cliente selecionado
  const comprasDoCliente = transacoes.compras.filter(
    (c) => c.clienteDestino === clienteSelecionado
  );

  // Calcula totais
  const totalSubtotal = comprasDoCliente.reduce((s, c) => s + Number(c.valorTotal), 0);
  const totalDesconto = comprasDoCliente.reduce((s, c) => s + (c.desconto || 0), 0);
  const totalFinal = totalSubtotal - totalDesconto;

  // Função para gerar e baixar PDF limpo (branco e preto) - REDUZIDO
  const gerarPDF = () => {
    const cliente = cadastros.clientes.find((c) => c.id === clienteSelecionado);
    if (!cliente) return;

    // Criar HTML limpo (branco e preto) - COMPACTO
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Folha de Pedido - ${cliente.nome}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 10px;
      padding: 0;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid black;
      padding-bottom: 8px;
    }
    .header h1 {
      margin: 0;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }
    th {
      background-color: #f0f0f0;
      border: 1px solid black;
      padding: 6px;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid black;
      padding: 5px;
      text-align: left;
    }
    td.number {
      text-align: right;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .totals {
      width: 100%;
      margin-top: 12px;
      border-top: 2px solid black;
      padding-top: 8px;
      font-size: 11px;
    }
    .total-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 4px;
    }
    .total-row .label {
      margin-right: 15px;
    }
    .total-row .value {
      min-width: 80px;
      text-align: right;
      font-weight: bold;
    }
    .final-total {
      display: flex;
      justify-content: flex-end;
      font-size: 12px;
      font-weight: bold;
      border-top: 2px solid black;
      padding-top: 6px;
      margin-top: 6px;
    }
    .final-total .label {
      margin-right: 15px;
    }
    .final-total .value {
      min-width: 80px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Folha de Pedido</h1>
  </div>
  
  <div class="info">
    <div><strong>Cliente:</strong> ${cliente.nome}</div>
    <div><strong>Data:</strong> ${fmtDate(todayISO())}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Fornecedor</th>
        <th>Produto</th>
        <th>Qtd</th>
        <th>Valor Unit</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${comprasDoCliente.map((comp) => {
        const produtor = cadastros.produtores.find((p) => p.id === comp.produtorId);
        return `
        <tr>
          <td>${produtor?.nome || "—"}</td>
          <td>${comp.produto}</td>
          <td class="number">${comp.quantidade}</td>
          <td class="number">${fmtMoney(comp.valorUnit)}</td>
          <td class="number">${fmtMoney(comp.valorTotal)}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span class="label">Subtotal:</span>
      <span class="value">${fmtMoney(totalSubtotal)}</span>
    </div>
    ${totalDesconto > 0 ? `
    <div class="total-row">
      <span class="label">Desconto (-1.63%):</span>
      <span class="value">-${fmtMoney(totalDesconto)}</span>
    </div>
    ` : ''}
    <div class="final-total">
      <span class="label">Total a Pagar:</span>
      <span class="value">${fmtMoney(totalFinal)}</span>
    </div>
  </div>
</body>
</html>
    `;

    // Criar blob e baixar como HTML
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Folha_Pedido_${cliente.nome}_${todayISO()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="folha-pedido-container">
      <Field label="Selecione o Cliente">
        <Select value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
          <option value="">-- Escolha um cliente --</option>
          {clientes.map((cId) => {
            const cliente = cadastros.clientes.find((c) => c.id === cId);
            return (
              <option key={cId} value={cId}>
                {cliente?.nome || "—"}
              </option>
            );
          })}
        </Select>
      </Field>

      {clienteSelecionado && comprasDoCliente.length === 0 && (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma compra atribuída a este cliente.
          </p>
        </Card>
      )}

      {clienteSelecionado && comprasDoCliente.length > 0 && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm"
              style={{ background: C.green700, color: "#fff", fontFamily: displayFont }}
            >
              Imprimir
            </button>
            <button
              onClick={gerarPDF}
              className="flex-1 px-4 py-2.5 rounded-lg font-bold text-sm"
              style={{ background: C.amber500, color: C.green900, fontFamily: displayFont }}
            >
              Baixar PDF
            </button>
          </div>

          <Card>
            <div className="font-bold text-lg mb-3" style={{ color: C.ink }}>
              Folha de Pedido
            </div>
            <div className="text-sm mb-4" style={{ color: C.inkSoft }}>
              Cliente: <span style={{ color: C.ink, fontWeight: 'bold' }}>
                {cadastros.clientes.find((c) => c.id === clienteSelecionado)?.nome || "—"}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="w-full text-xs mb-4" style={{ borderCollapse: "collapse", minWidth: "100%" }}>
                <thead>
                  <tr style={{ backgroundColor: C.cardAlt, borderBottom: `2px solid ${C.line}` }}>
                    <th className="text-left p-1.5" style={{ color: C.ink, fontSize: "11px" }}>Fornecedor</th>
                    <th className="text-left p-1.5" style={{ color: C.ink, fontSize: "11px" }}>Produto</th>
                    <th className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>Qtd</th>
                    <th className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>Valor Unit</th>
                    <th className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasDoCliente.map((comp, idx) => {
                    const produtor = cadastros.produtores.find((p) => p.id === comp.produtorId);
                    return (
                      <tr key={idx} style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td className="p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{produtor?.nome || "—"}</td>
                        <td className="p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{comp.produto}</td>
                        <td className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{comp.quantidade}</td>
                        <td className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{fmtMoney(comp.valorUnit)}</td>
                        <td className="text-right p-1.5 font-bold" style={{ color: C.ink, fontSize: "11px" }}>{fmtMoney(comp.valorTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: `2px solid ${C.line}`, paddingTop: "12px" }}>
              <div className="text-sm mb-2 flex justify-end gap-4">
                <span style={{ color: C.inkSoft }}>Subtotal:</span>
                <span style={{ fontWeight: 'bold', fontFamily: monoFont }}>
                  {fmtMoney(totalSubtotal)}
                </span>
              </div>
              {totalDesconto > 0 && (
                <div className="text-sm mb-2 flex justify-end gap-4">
                  <span style={{ color: C.amber500 }}>Desconto (-1.63%):</span>
                  <span style={{ color: C.amber500, fontWeight: 'bold', fontFamily: monoFont }}>
                    {fmtMoney(totalDesconto)}
                  </span>
                </div>
              )}
              <div className="text-sm font-bold flex justify-end gap-4" style={{ color: C.green700 }}>
                <span>Total a Pagar:</span>
                <span style={{ fontFamily: monoFont }}>{fmtMoney(totalFinal)}</span>
              </div>
            </div>
          </Card>
        </>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            background: white !important;
            color: black !important;
            border-color: black !important;
          }
          
          nav, header, main > div:first-child {
            display: none !important;
          }
          
          #folha-pedido-container {
            background: white !important;
            padding: 20px !important;
            margin: 0 !important;
          }
          
          #folha-pedido-container button {
            display: none !important;
          }
          
          #folha-pedido-container select,
          #folha-pedido-container label,
          #folha-pedido-container .flex {
            display: none !important;
          }
          
          #folha-pedido-container Card,
          #folha-pedido-container > div {
            background: white !important;
            border: 1px solid black !important;
            color: black !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 20px 0 !important;
          }
          
          th, td {
            border: 1px solid black !important;
            padding: 8px !important;
            color: black !important;
            background: white !important;
            text-align: left !important;
          }
          
          th {
            background-color: #f0f0f0 !important;
            font-weight: bold !important;
          }
          
          tr:nth-child(even) {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}

function RegistrarTab({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast, setRecibo }) {
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
              background: tipo === t.id ? C.green700 : C.cardAlt,
              color: tipo === t.id ? "#fff" : C.ink,
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
          setRecibo={setRecibo}
        />
      )}
      {tipo === "venda" && (
        <FormVenda
          cadastros={cadastros}
          transacoes={transacoes}
          persistCadastros={persistCadastros}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
          setRecibo={setRecibo}
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
          setRecibo={setRecibo}
        />
      )}
      {tipo === "conferencia" && (
        <ConferenciaComprasTab
          cadastros={cadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
          setRecibo={setRecibo}
        />
      )}

      <button
        onClick={() => setTipo("folha-pedido")}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mt-4"
        style={{
          background: tipo === "folha-pedido" ? C.green700 : C.cardAlt,
          color: tipo === "folha-pedido" ? "#fff" : C.ink,
          border: `1px solid ${C.line}`,
          fontFamily: displayFont,
          fontWeight: 800,
        }}
      >
        📋 Folha de Pedido por Cliente
      </button>

      {tipo === "folha-pedido" && (
        <div className="mt-4">
          <FolhaDePedidoTab cadastros={cadastros} transacoes={transacoes} />
        </div>
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

function QuickAddProdutor({ onAdd, standalone = false }) {
  const [open, setOpen] = useState(standalone);
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [temCNPJ, setTemCNPJ] = useState(false);
  const [temDescontoFundoRural, setTemDescontoFundoRural] = useState(true);

  const reset = () => {
    setNome("");
    setCidade("");
    setTelefone("");
    setTemCNPJ(false);
    setTemDescontoFundoRural(true);
  };

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
    <Card>
      <div className="grid grid-cols-1 gap-3">
        <Field label="Nome do Produtor">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus placeholder="João" />
        </Field>
        <Field label="Cidade">
          <TextInput value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Londrina PR" />
        </Field>
        <Field label="Telefone">
          <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="44 99999-9999" />
        </Field>
        <div>
          <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={temCNPJ}
              onChange={(e) => setTemCNPJ(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span className="text-sm" style={{ color: C.ink }}>
              Tem CNPJ
            </span>
          </label>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
            {temCNPJ ? "✓ Produtor pessoa jurídica" : "• Produtor pessoa física (CPF)"}
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={temDescontoFundoRural}
              onChange={(e) => setTemDescontoFundoRural(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span className="text-sm" style={{ color: C.ink }}>
              Desconto Fundo Rural (1.63%)
            </span>
          </label>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
            {temDescontoFundoRural ? "✓ Aplica desconto de 1.63%" : "• Sem desconto"}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm"
          style={{ background: C.amber500, color: C.green900 }}
          onClick={() => {
            if (!nome.trim()) return;
            onAdd({
              nome: nome.trim(),
              cidade: cidade.trim(),
              telefone: telefone.trim(),
              temCNPJ,
              temDescontoFundoRural,
            });
            reset();
            if (!standalone) setOpen(false);
          }}
        >
          Salvar Produtor
        </button>
        {!standalone && (
          <button
            onClick={() => {
              reset();
              setOpen(false);
            }}
            style={{ color: C.inkSoft }}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </Card>
  );
}

function FormCompra({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast, setRecibo }) {
  const [produtorId, setProdutorId] = useState(cadastros.produtores[0]?.id || "");
  const [clienteDestino, setClienteDestino] = useState(cadastros.clientes[0]?.id || "");
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnit, setValorUnit] = useState("");
  const [cargueiro, setCargueiro] = useState(""); // Cargueiro/Motorista que confere
  const [ultimaCompra, setUltimaCompra] = useState(null);
  const total = (Number(quantidade) || 0) * (Number(valorUnit) || 0);

  // Calcula desconto de 1.63% se produtor tem marcado desconto de fundo rural
  const produtorSelecionado = cadastros.produtores.find((p) => p.id === produtorId);
  const temDesconto = produtorSelecionado?.temDescontoFundoRural; // Desconto conforme configuração
  const desconto = temDesconto ? total * 0.0163 : 0;
  const valorFinal = total - desconto;

  const addProdutor = async (dados) => {
    const novo = { id: uid(), codigo: Date.now() % 100000, ...dados };
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
    if (!produtorId || !clienteDestino || !produto || !quantidade || !valorUnit || !cargueiro.trim()) return;
    const nova = {
      id: uid(),
      data: todayISO(),
      produtorId,
      clienteDestino,
      produto,
      quantidade: Number(quantidade),
      valorUnit: Number(valorUnit),
      valorTotal: total,
      desconto: desconto,
      valorFinal: valorFinal,
      cargueiro: cargueiro.trim(), // Cargueiro/Motorista que confere a carga
      entregaConfirmada: false,
      quantidadeRecebida: null,
      divergencia: null,
    };
    await persistTransacoes({ ...transacoes, compras: [nova, ...transacoes.compras] });
    setQuantidade("");
    setValorUnit("");
    setCargueiro("");
    setUltimaCompra(nova);
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
        <QuickAddProdutor onAdd={addProdutor} />
      </Field>
      {produtorSelecionado && (
        <div className="mb-3 p-2 rounded-lg" style={{ background: temDesconto ? "#FFEBEE" : "#E8F5E9" }}>
          <div className="text-xs font-bold" style={{ color: temDesconto ? "#C62828" : "#2E7D32" }}>
            {temDesconto ? "⚠ Produtor sem CNPJ (CPF)" : "✓ Produtor com CNPJ"}
          </div>
          {temDesconto && (
            <div className="text-xs mt-1" style={{ color: "#C62828" }}>
              Desconto de 1.63% será aplicado
            </div>
          )}
        </div>
      )}
      <Field label="Para Quem (Cliente Destino)">
        <Select value={clienteDestino} onChange={(e) => setClienteDestino(e.target.value)}>
          {cadastros.clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
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
      <div style={{ backgroundColor: C.cardAlt, padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
        <div className="text-sm font-bold mb-2" style={{ color: C.ink }}>
          Subtotal: <span style={{ fontFamily: monoFont }}>{fmtMoney(total)}</span>
        </div>
        {desconto > 0 && (
          <div className="text-sm mb-2" style={{ color: C.amber500 }}>
            Desconto (-1.63%): <span style={{ fontFamily: monoFont }}>{fmtMoney(desconto)}</span>
          </div>
        )}
        <div className="text-sm font-bold" style={{ color: C.green700 }}>
          Total a Pagar: <span style={{ fontFamily: monoFont }}>{fmtMoney(valorFinal)}</span>
        </div>
      </div>
      <Field label="Cargueiro (quem faz a carga)">
        <TextInput
          placeholder="Ex: Arnaldo, Leandro, João..."
          value={cargueiro}
          onChange={(e) => setCargueiro(e.target.value)}
        />
      </Field>
      <PrimaryButton onClick={salvar} icon={ArrowDownCircle}>
        Registrar Compra
      </PrimaryButton>
      {ultimaCompra && setRecibo && (
        <button
          onClick={() => setRecibo({ tipo: "compra", item: ultimaCompra })}
          className="w-full text-center text-xs font-bold mt-3"
          style={{ color: C.amber500 }}
        >
          Imprimir pedido desta compra
        </button>
      )}
    </Card>
  );
}

function FormVenda({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast, setRecibo }) {
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
      desconto: desconto,
      valorFinal: valorFinal,
      status,
      entrega: null,
    };
    await persistTransacoes({ ...transacoes, vendas: [nova, ...transacoes.vendas] });
    setQuantidade("");
    showToast("Venda registrada");
    setEntregaVendaId(novaId);
  };

  if (entregaVendaId) {
    const vendaSalva = transacoes.vendas.find((v) => v.id === entregaVendaId);
    return (
      <EntregaVendaForm
        vendaId={entregaVendaId}
        venda={vendaSalva}
        transacoes={transacoes}
        persistTransacoes={persistTransacoes}
        showToast={showToast}
        setRecibo={setRecibo}
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

function EntregaVendaForm({ vendaId, initial, venda, transacoes, persistTransacoes, showToast, setRecibo, onDone }) {
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
          style={{ color: C.ink, fontFamily: displayFont, fontWeight: 800 }}
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
      {venda && setRecibo && (
        <button
          onClick={() => setRecibo({ tipo: "venda", item: venda })}
          className="w-full text-center text-xs font-bold mt-3"
          style={{ color: C.amber500 }}
        >
          Imprimir pedido desta venda
        </button>
      )}
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
function EntregasTab({ cadastros, transacoes, persistTransacoes, showToast, soMeuNome, setRecibo }) {
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
          {setRecibo && (
            <button
              onClick={() => setRecibo({ tipo: "venda", item: v })}
              className="text-xs font-bold mt-1.5 ml-3"
              style={{ color: C.amber500 }}
            >
              Imprimir pedido
            </button>
          )}
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
              background: v.entrega.confirmada ? C.green700 : C.cardAlt,
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
function FolhaDeCargaTab({ cadastros, transacoes }) {
  const [cargueirSelecionado, setCargueirSelecionado] = useState("");

  // Lista de cargueiros únicos
  const cargueiros = [...new Set(transacoes.compras.map((c) => c.cargueiro).filter(Boolean))].sort();

  // Filtra compras do cargueiro selecionado
  const comprasDoCargueiro = transacoes.compras.filter(
    (c) => c.cargueiro === cargueirSelecionado
  );

  // Agrupa por cliente destino
  const agrupadoPorCliente = {};
  comprasDoCargueiro.forEach((compra) => {
    if (!agrupadoPorCliente[compra.clienteDestino]) {
      agrupadoPorCliente[compra.clienteDestino] = [];
    }
    agrupadoPorCliente[compra.clienteDestino].push(compra);
  });

  return (
    <div>
      <Field label="Selecione o Cargueiro">
        <Select value={cargueirSelecionado} onChange={(e) => setCargueirSelecionado(e.target.value)}>
          <option value="">-- Escolha um cargueiro --</option>
          {cargueiros.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      {cargueirSelecionado && comprasDoCargueiro.length === 0 && (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma carga atribuída a {cargueirSelecionado}.
          </p>
        </Card>
      )}

      {cargueirSelecionado && comprasDoCargueiro.length > 0 && (
        <>
          <button
            onClick={() => window.print()}
            className="w-full px-4 py-2.5 rounded-lg font-bold text-sm mb-4"
            style={{ background: C.green700, color: "#fff" }}
          >
            📋 Imprimir Folha de Carga
          </button>

          {Object.entries(agrupadoPorCliente).map(([clienteId, compras]) => {
            const cliente = cadastros.clientes.find((c) => c.id === clienteId);
            return (
              <Card key={clienteId} className="mb-4">
                <div className="font-bold text-sm mb-3" style={{ color: C.ink }}>
                  Cliente: {cliente?.nome || "—"}
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="w-full text-xs" style={{ borderCollapse: "collapse", minWidth: "100%" }}>
                    <thead>
                      <tr style={{ backgroundColor: C.cardAlt, borderBottom: `2px solid ${C.line}` }}>
                        <th className="text-left p-1.5" style={{ color: C.ink }}>Fornecedor</th>
                        <th className="text-left p-1.5" style={{ color: C.ink }}>Produto</th>
                        <th className="text-right p-1.5" style={{ color: C.ink }}>Qtd</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((comp, idx) => {
                        const produtor = cadastros.produtores.find((p) => p.id === comp.produtorId);
                        return (
                          <tr key={idx} style={{ borderBottom: `1px solid ${C.line}` }}>
                            <td className="p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{produtor?.nome || "—"}</td>
                            <td className="p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{comp.produto}</td>
                            <td className="text-right p-1.5" style={{ color: C.ink, fontSize: "11px" }}>{comp.quantidade}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}

          <style jsx global>{`
            @media print {
              nav, header, button, select, label {
                display: none !important;
              }
              body {
                background: white;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid black;
                padding: 6px;
                color: black;
                background: white;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

function ConferenciaComprasTab({ cadastros, transacoes, persistTransacoes, showToast, setRecibo }) {
  const produtorNome = (id) => cadastros.produtores.find((p) => p.id === id)?.nome || "—";
  const [conferindoId, setConferindoId] = useState(null);
  const [view, setView] = useState("conferencia"); // "conferencia" ou "folha-carga"
  const [cargueirFiltro, setCargueirFiltro] = useState(""); // Filtro por cargueiro

  // Lista de cargueiros únicos
  const cargueiros = [...new Set(transacoes.compras.map((c) => c.cargueiro).filter(Boolean))].sort();

  // Filtra por cargueiro se selecionado
  const comprasFiltradas = cargueirFiltro
    ? transacoes.compras.filter((c) => c.cargueiro === cargueirFiltro)
    : transacoes.compras;

  const pendentes = comprasFiltradas.filter((c) => !c.entregaConfirmada);
  const confirmadas = comprasFiltradas.filter((c) => c.entregaConfirmada);

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
            {setRecibo && (
              <button
                onClick={() => setRecibo({ tipo: "compra", item: c })}
                className="text-xs font-bold mt-1.5"
                style={{ color: C.amber500 }}
              >
                Imprimir pedido
              </button>
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
                background: c.entregaConfirmada ? C.green700 : C.cardAlt,
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
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView("conferencia")}
          className="flex-1 py-2 rounded-lg font-bold text-sm"
          style={{
            background: view === "conferencia" ? C.green700 : C.cardAlt,
            color: view === "conferencia" ? "#fff" : C.ink,
            border: `1px solid ${view === "conferencia" ? C.green700 : C.line}`,
          }}
        >
          Conferência
        </button>
        <button
          onClick={() => setView("folha-carga")}
          className="flex-1 py-2 rounded-lg font-bold text-sm"
          style={{
            background: view === "folha-carga" ? C.green700 : C.cardAlt,
            color: view === "folha-carga" ? "#fff" : C.ink,
            border: `1px solid ${view === "folha-carga" ? C.green700 : C.line}`,
          }}
        >
          Folha de Carga
        </button>
      </div>

      {view === "conferencia" && (
        <>
          <Field label="Filtrar por Cargueiro (quem vai conferir a carga)">
            <Select value={cargueirFiltro} onChange={(e) => setCargueirFiltro(e.target.value)}>
              <option value="">-- Todas as compras --</option>
              {cargueiros.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

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
        </>
      )}

      {view === "folha-carga" && (
        <FolhaDeCargaTab cadastros={cadastros} transacoes={transacoes} />
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
    (p.nome || "").toLowerCase().includes(q.toLowerCase())
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
              background: view === v.id ? C.green700 : C.cardAlt,
              color: view === v.id ? "#fff" : C.ink,
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
        <CrateTag label="Perda Hoje" value={fmtMoney(totalHojeRS)} tone="rust" icon={TrendingDown} />
        <CrateTag label="Perda Total" value={fmtMoney(totalGeralRS)} tone="rust" icon={TrendingDown} />
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
function DiagnosticoPlanilha({ cadastros, persistCadastros }) {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const rodarTeste = async () => {
    setRodando(true);
    setResultado(null);
    const linhas = [];
    const marcador = "DIAG_" + Date.now();

    try {
      linhas.push("1) Enviando gravação de teste...");
      const resPost = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cadastros",
          data: { ...cadastros, produtos: [...cadastros.produtos, { id: marcador, nome: marcador }] },
        }),
      });
      const jsonPost = await resPost.json().catch(() => null);
      linhas.push(`   Status HTTP: ${resPost.status}`);
      linhas.push(`   Resposta: ${JSON.stringify(jsonPost)}`);

      linhas.push("");
      linhas.push("2) Lendo de volta pra conferir se gravou...");
      const resGet = await fetch("/api/dados");
      const jsonGet = await resGet.json().catch(() => null);
      const achou = jsonGet?.cadastros?.produtos?.some((p) => p.id === marcador);
      linhas.push(`   Status HTTP: ${resGet.status}`);
      linhas.push(`   Marcador de teste encontrado na leitura? ${achou ? "SIM ✅" : "NÃO ❌"}`);

      if (achou) {
        linhas.push("");
        linhas.push("Tudo funcionando! A gravação chegou na planilha.");
      } else {
        linhas.push("");
        linhas.push(
          "A gravação NÃO chegou na planilha. O problema está na escrita (aba errada, permissão da conta de serviço, ou nome da aba não bate)."
        );
      }
    } catch (e) {
      linhas.push(`ERRO durante o teste: ${(e && e.message) || String(e)}`);
    }

    setResultado(linhas.join("\n"));
    setRodando(false);
  };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        Testa se o app consegue escrever e reler da planilha, sem depender de
        cadastrar nada de verdade.
      </p>
      <button
        onClick={rodarTeste}
        disabled={rodando}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-3"
        style={{ background: C.amber500, color: C.green900, fontFamily: displayFont, fontWeight: 800 }}
      >
        {rodando ? "Testando…" : "Testar Gravação na Planilha"}
      </button>
      {resultado && (
        <Card>
          <pre
            className="text-xs whitespace-pre-wrap"
            style={{ fontFamily: monoFont, color: C.ink }}
          >
            {resultado}
          </pre>
        </Card>
      )}
    </div>
  );
}

function GerenciarAcessoView({ cadastros, persistCadastros, showToast }) {
  const [novoNome, setNovoNome] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("acesso");
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: "acesso", label: "Acesso", icon: Shield },
          { id: "diagnostico", label: "Diagnóstico", icon: AlertTriangle },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setAbaAtiva(v.id)}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold"
            style={{
              background: abaAtiva === v.id ? C.green700 : C.cardAlt,
              color: abaAtiva === v.id ? "#fff" : C.ink,
              border: `1px solid ${abaAtiva === v.id ? C.green700 : C.line}`,
              fontFamily: displayFont,
              fontWeight: 800,
            }}
          >
            <v.icon size={16} />
            {v.label}
          </button>
        ))}
      </div>

      {abaAtiva === "diagnostico" && (
        <DiagnosticoPlanilha cadastros={cadastros} persistCadastros={persistCadastros} />
      )}

      {abaAtiva === "acesso" && (
        <>
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
        </>
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
              background: view === v.id ? C.green700 : C.cardAlt,
              color: view === v.id ? "#fff" : C.ink,
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
          background: view === "acesso" ? C.green700 : C.cardAlt,
          color: view === "acesso" ? "#fff" : C.ink,
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
