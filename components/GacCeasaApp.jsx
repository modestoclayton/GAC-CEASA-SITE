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
  canvas: "#060B11",      // Preto azulado profundo oficial do fundo da logo
  canvasGlow: "#0F1922",  // Tom intermediário estilo neon para destaques
  card: "#0F1922",        // Fundo dos blocos internos (base da logo)
  cardAlt: "#16222F",     // Variação de card ligeiramente mais clara
  ink: "#E2E8F0",         // Prata/Cinza claro oficial da letra 'A' para textos principais
  inkSoft: "#94A3B8",     // Cinza suave para descrições secundárias
  green900: "#041C06",    // Verde escuro para fundos muito profundos
  green800: "#09330D",    // Verde folha fechado
  green700: "#3D7A00",    // Verde intermediário
  green600: "#66CC00",    // Verde limão vivo oficial da letra 'C' e detalhes
  amber500: "#E0A526",    // Mantido original
  amber600: "#C48A16",    // Mantido original
  amberSoft: "#3A2E12",   // Mantido original
  rust: "#E0632E",        // Mantido original
  rustSoft: "#3A1C12",    // Mantido original
  twine: "#1E293B",       // Divisores neutros modernos
  line: "#1F2937",        // Linhas de grade e bordas sutis
  blue600: "#0076FF",     // Azul vibrante oficial da letra 'G' para a seção de clientes
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

const PRAZO_VENCIMENTO_DIAS = 35;

// A "equipe" (compradoresVendedores) guarda nome + função + empresa que atende
// (só relevante pra Conferente/Entregador). Entradas antigas eram só texto puro
// (nome do gestor autorizado) — aqui a gente trata os dois formatos.
function normalizarEquipe(lista) {
  return (lista || []).map((item) => {
    if (typeof item === "string") {
      return { id: item, nome: item, funcao: "gestor", clienteId: "" };
    }
    return {
      id: item.id || item.nome,
      nome: item.nome || "",
      funcao: item.funcao || "gestor",
      clienteId: item.clienteId || "",
    };
  });
}

// Calcula o status de cada débito (compra ou venda) contra os pagamentos/recebimentos
// já lançados, usando FIFO: o total pago vai quitando os débitos mais antigos primeiro.
// "ajuste" (desconto) conta igual pagamento pra fins de quitação, mas é sinalizado à parte.
function calcularStatusPagamentos(debitos, pagamentos, hojeISO) {
  const debitosOrdenados = [...debitos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  const pagamentosOrdenados = [...pagamentos]
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))
    .map((p) => ({ ...p, restante: Number(p.valor) || 0 }));

  let idxPagamento = 0;
  const hoje = new Date(hojeISO + "T00:00:00");

  return debitosOrdenados.map((d) => {
    let faltaAlocar = Number(d.valor) || 0;
    let dataQuitacao = null;
    let tipoQuitacao = null; // "pagamento" | "ajuste" | "misto"

    while (faltaAlocar > 0.009 && idxPagamento < pagamentosOrdenados.length) {
      const pag = pagamentosOrdenados[idxPagamento];
      if (pag.restante <= 0.009) {
        idxPagamento++;
        continue;
      }
      const usar = Math.min(pag.restante, faltaAlocar);
      pag.restante -= usar;
      faltaAlocar -= usar;
      dataQuitacao = pag.data;
      tipoQuitacao = tipoQuitacao && tipoQuitacao !== (pag.tipo || "pagamento") ? "misto" : pag.tipo || "pagamento";
      if (pag.restante <= 0.009) idxPagamento++;
    }

    const pago = faltaAlocar <= 0.009;
    const dataDebito = new Date(d.data + "T00:00:00");
    const diasDesde = Math.floor((hoje - dataDebito) / 86400000);
    let status;
    if (pago) status = "pago";
    else if (diasDesde > PRAZO_VENCIMENTO_DIAS) status = "vencido";
    else status = "a_vencer";

    return {
      ...d,
      pago,
      status,
      dataQuitacao,
      tipoQuitacao,
      diasDesde,
      diasParaVencer: PRAZO_VENCIMENTO_DIAS - diasDesde,
      saldoAberto: Math.max(faltaAlocar, 0),
    };
  });
}

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
      pagamento: "PIX",
      chavePix: "44998942726",
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
  diasFinalizados: [], // datas (YYYY-MM-DD) já finalizadas na Conferência — Finalizar não roda 2x no mesmo dia
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

function PerfilHeader({ perfil, titulo, onTrocar, className = "" }) {
  // Estilo inline sempre vence sobre classe CSS. Então quando usamos o banner
  // (classe topo-dashboard), tiramos o gradiente inline pra deixar o
  // background-image do CSS aparecer por baixo do texto.
  const temBanner = className.includes("topo-dashboard");
  return (
    <header
      className={`px-4 pt-6 pb-5 flex items-start gap-3 ${className}`}
      style={{
        ...(temBanner ? {} : { background: `linear-gradient(135deg, ${C.canvasGlow} 0%, ${C.green900} 100%)` }),
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
  // Vale de compra = específico por Fornecedor + Cliente Destino + Data (um vale = um fornecedor, um dia)
  // Pedido de venda = específico por Cliente + Data
  const itens = isVenda
    ? (transacoes?.vendas || []).filter(v => v.clienteId === item.clienteId && v.data === item.data)
    : (transacoes?.compras || []).filter(
        c => c.clienteDestino === item.clienteDestino && c.produtorId === item.produtorId && c.data === item.data
      );

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
    // Vendas: verificar desconto fundo rural do cliente
    const cliente = cadastros.clientes.find(c => c.id === item.clienteId);
    const temDesconto = cliente?.temDescontoFundoRural;
    totalSubtotal = itens.reduce((s, i) => s + Number(i.valorTotal), 0);
    if (temDesconto) {
      totalDesconto = totalSubtotal * 0.0163;
    }
  }

  const totalGeral = totalSubtotal - totalDesconto;

  const titulo = isVenda ? "Pedido de Venda" : "Vale de Compra";
  const rotuloParte = isVenda ? "Cliente" : "Fornecedor";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto recibo-imprimir"
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
          {parte && parte.pagamento && (
            <div className="mt-2 p-2 rounded" style={{ background: "#EDEAE0" }}>
              <div className="text-xs uppercase font-bold" style={{ color: "#6E6650" }}>
                Forma de Pagamento
              </div>
              <div className="text-sm font-bold" style={{ color: "#1F4A30" }}>
                {parte.pagamento}
              </div>
              {parte.pagamento !== "BOLETO" && parte.chavePix && (
                <div className="text-sm mt-1" style={{ color: "#1F4A30" }}>
                  <span className="font-bold">Chave Pix:</span> {parte.chavePix}
                </div>
              )}
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
            {itens.map((i, idx) => {
              const precoUnitario = isVenda ? i.precoUnit : i.valorUnit;
              const totalItem = Number(i.quantidade) * Number(precoUnitario);
              return (
              <tr key={idx} style={{ borderBottom: "1px solid #D8CBA0" }}>
                <td className="py-2">{i.produto}</td>
                <td className="text-right py-2">{i.quantidade}</td>
                <td className="text-right py-2">{fmtMoney(precoUnitario)}</td>
                <td className="text-right py-2 font-bold">{fmtMoney(totalItem)}</td>
              </tr>
            );
            })}
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
        @page {
          margin: 15mm;
        }
        @media print {
          nav,
          header {
            display: none !important;
          }
          body {
            margin: 0;
          }
          .recibo-imprimir {
            position: static !important;
            inset: auto !important;
            overflow: visible !important;
            height: auto !important;
            background: #fff !important;
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
        const equipe = normalizarEquipe(cadastros.compradoresVendedores);
        const gestores = equipe.filter((e) => e.funcao === "gestor");
        const jaAutorizado = gestores.some((e) => e.nome.trim().toLowerCase() === nomeNorm);

        if (gestores.length === 0) {
          // ninguém cadastrado ainda como gestor: este nome vira a base da lista de autorizados
          await persistCadastros({
            ...cadastros,
            compradoresVendedores: [
              ...equipe,
              { id: uid(), nome: novoPerfil.nome.trim(), funcao: "gestor", clienteId: "" },
            ],
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
      let storageFalhou = false;
      try {
        localStorage.setItem(PERFIL_KEY, JSON.stringify(novoPerfil));
      } catch (e) {
        storageFalhou = true;
      }
      if (storageFalhou) {
        // Perfil funciona nesta sessão, mas não vai lembrar após fechar o navegador
        // (comum em modo anônimo/privado ou com armazenamento bloqueado).
        setTimeout(
          () =>
            showToast(
              "Atenção: não foi possível salvar o perfil neste aparelho. Você vai precisar escolher de novo ao reabrir."
            ),
          300
        );
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
    return [...cadastros.produtos].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => {
      // Só entra no saldo de estoque a compra marcada "Para Estoque".
      // Compra destinada direto a um cliente (rancho) não deve contar como entrada de estoque.
      const entradas = transacoes.compras
        .filter((c) => c.produto === p.nome && c.clienteDestino === "ESTOQUE")
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
    return [...cadastros.clientes].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((cl) => {
      const debito = transacoes.vendas
        .filter((v) => v.clienteId === cl.id)
        .reduce((s, v) => s + Number(v.valorFinal ?? v.valorTotal), 0);
      const credito = transacoes.recebimentos
        .filter((r) => r.clienteId === cl.id)
        .reduce((s, r) => s + Number(r.valor), 0);
      const saldo = debito - credito;
      const acima = cl.limiteCredito > 0 && saldo > cl.limiteCredito;
      return { ...cl, saldo, acima };
    });
  }, [cadastros.clientes, transacoes.vendas, transacoes.recebimentos]);

  const contaProdutores = useMemo(() => {
    return [...cadastros.produtores].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((pr) => {
      const debito = transacoes.compras
        .filter((c) => c.produtorId === pr.id)
        .reduce((s, c) => s + Number(c.valorFinal ?? c.valorTotal), 0);
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
          {/* Conferente só confere quantidade — sem acesso a impressão/PDF/valores extras */}
          <ConferenciaComprasTab
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
          {/* Entregador só vê pra onde a mercadoria vai — sem valores e sem impressão/PDF */}
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
      <PerfilHeader
        perfil={perfil}
        titulo={
          (tab === "dashboard" && "Hoje no Pátio") ||
          (tab === "registrar" && "Registrar Movimento") ||
          (tab === "estoque" && "Estoque") ||
          (tab === "conta" && "Conta Corrente") ||
          ""
        }
        onTrocar={trocarPerfil}
        className={tab === "dashboard" ? "topo-dashboard" : ""}
      />

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {tab === "dashboard" && (
          <DashboardTab
            dashboard={dashboard}
            estoquePorProduto={estoquePorProduto}
            contaClientes={contaClientes}
            contaProdutores={contaProdutores}
            transacoes={transacoes}
            cadastros={cadastros}
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
            persistTransacoes={persistTransacoes}
            showToast={showToast}
            setRecibo={setRecibo}
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
function DashboardTab({ dashboard, estoquePorProduto, contaClientes, contaProdutores, transacoes, cadastros }) {
  const [dataSelecionada, setDataSelecionada] = useState(todayISO());
  
  // Calcula totais de CX para o dia selecionado
  const comprasDodia = transacoes.compras.filter((c) => c.data === dataSelecionada);
  const vendasDoDia = transacoes.vendas.filter((v) => v.data === dataSelecionada);
  
  const totalCxCompradas = comprasDodia.reduce((s, c) => s + Number(c.quantidade), 0);
  const totalCxVendidas = vendasDoDia.reduce((s, v) => s + Number(v.quantidade), 0);
  const alertas = estoquePorProduto.filter((e) => e.saldo < e.estoqueMinimo);
  const clientesAcima = contaClientes.filter((c) => c.acima);
  const produtoresPendentes = contaProdutores.filter((p) => p.pendente);

  return (
    <div>
      {/* Filtro de Data */}
      <div className="mb-4">
        <Field label="📅 Selecione a Data">
          <TextInput 
            type="date" 
            value={dataSelecionada} 
            onChange={(e) => setDataSelecionada(e.target.value)}
            max={todayISO()}
          />
        </Field>
      </div>

      {/* Cards de CX Compradas e Vendidas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card style={{ background: C.green700, borderLeft: "4px solid " + C.amber500 }}>
          <div className="text-xs" style={{ color: C.inkSoft }}>📦 CX COMPRADAS</div>
          <div className="text-2xl font-bold" style={{ color: C.amber500 }}>{totalCxCompradas}</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>{fmtDate(dataSelecionada)}</div>
        </Card>
        
        <Card style={{ background: C.green700, borderLeft: "4px solid " + C.amber500 }}>
          <div className="text-xs" style={{ color: C.inkSoft }}>🛒 CX VENDIDAS</div>
          <div className="text-2xl font-bold" style={{ color: C.amber500 }}>{totalCxVendidas}</div>
          <div className="text-xs" style={{ color: C.inkSoft }}>{fmtDate(dataSelecionada)}</div>
        </Card>
      </div>

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
  const [temDescontoFundoRural, setTemDescontoFundoRural] = useState(false);

  const reset = () => {
    setNome("");
    setCidade("");
    setLimiteCredito("");
    setPagamento("BOLETO");
    setTemDescontoFundoRural(false);
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
      <div className="mb-3 p-2 rounded" style={{ background: C.amberSoft }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={temDescontoFundoRural}
            onChange={(e) => setTemDescontoFundoRural(e.target.checked)}
          />
          <span style={{ color: C.ink, fontSize: "14px" }}>📋 Aplica Desconto Fundo Rural (1.63%)?</span>
        </label>
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
              temDescontoFundoRural,
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
  const [pagamento, setPagamento] = useState("DINHEIRO");
  const [chavePix, setChavePix] = useState("");

  const reset = () => {
    setNome("");
    setCidade("");
    setTelefone("");
    setTemCNPJ(false);
    setTemDescontoFundoRural(true);
    setPagamento("DINHEIRO");
    setChavePix("");
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
        <Field label="Forma de Pagamento">
          <Select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option value="BOLETO">Boleto</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
          </Select>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
            {pagamento === "BOLETO"
              ? "• Boleto não gera vale de requisição na Finalização"
              : "✓ Gera vale de requisição na Finalização"}
          </div>
        </Field>
        {pagamento !== "BOLETO" && (
          <Field label="Chave Pix">
            <TextInput
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            />
          </Field>
        )}
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
              pagamento,
              chavePix: chavePix.trim(),
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

/* ====================================================================== */
/* Requisição Tab - Mostra compras por produtor com filtro de data       */
/* ====================================================================== */
function RequisicaoTab({ cadastros, transacoes, setRecibo }) {
  const [dataSelecionada, setDataSelecionada] = useState(todayISO());

  // Cada compra vira automaticamente uma requisição: agrupada por cliente destino
  // e, dentro de cada cliente, um vale por fornecedor.
  const comprasHoje = transacoes.compras.filter((c) => c.data === dataSelecionada && c.clienteDestino !== "ESTOQUE");
  const clientesUnicos = [...new Set(comprasHoje.map((c) => c.clienteDestino))];

  return (
    <div>
      <Field label="Data">
        <TextInput type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} />
      </Field>

      <SectionTitle icon={Package}>Requisições por Cliente</SectionTitle>

      {clientesUnicos.length === 0 ? (
        <Card><p className="text-sm" style={{ color: C.inkSoft }}>Nenhuma compra nesta data.</p></Card>
      ) : (
        clientesUnicos.map((clienteId) => {
          const cliente = cadastros.clientes.find((c) => c.id === clienteId);
          const comprasCliente = comprasHoje.filter((c) => c.clienteDestino === clienteId);
          const produtoresUnicos = [...new Set(comprasCliente.map((c) => c.produtorId))];
          const totalClienteQtd = comprasCliente.reduce((s, c) => s + Number(c.quantidade), 0);
          const totalClienteValor = comprasCliente.reduce((s, c) => s + Number(c.valorFinal || c.valorTotal), 0);

          return (
            <Card key={clienteId} style={{ marginBottom: 14 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-sm" style={{ color: C.blue600 }}>👤 {cliente?.nome || clienteId}</div>
                <div className="text-xs" style={{ color: C.inkSoft, fontFamily: monoFont }}>
                  {totalClienteQtd} CX · {fmtMoney(totalClienteValor)}
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {produtoresUnicos.map((produtorId) => {
                  const produtor = cadastros.produtores.find((p) => p.id === produtorId);
                  const comprasProdutor = comprasCliente.filter((c) => c.produtorId === produtorId);
                  const totalQtd = comprasProdutor.reduce((s, c) => s + Number(c.quantidade), 0);
                  const totalValor = comprasProdutor.reduce((s, c) => s + Number(c.valorFinal || c.valorTotal), 0);

                  return (
                    <div key={produtorId} className="rounded-lg p-2.5" style={{ background: C.cardAlt }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="font-bold text-xs">{produtor?.nome || "—"}</div>
                        <div className="text-xs" style={{ fontFamily: monoFont, color: C.inkSoft }}>
                          {totalQtd} CX · {fmtMoney(totalValor)}
                        </div>
                      </div>
                      {comprasProdutor.map((c) => (
                        <div key={c.id} className="text-xs mb-0.5 flex justify-between" style={{ color: C.inkSoft }}>
                          <span>{c.produto} - {c.quantidade} CX</span>
                          <span style={{ fontFamily: monoFont }}>{fmtMoney(c.valorFinal || c.valorTotal)}</span>
                        </div>
                      ))}
                      {setRecibo && (
                        <button
                          onClick={() => setRecibo({ tipo: "compra", item: comprasProdutor[0] })}
                          className="text-xs font-bold mt-1.5"
                          style={{ color: C.amber500 }}
                        >
                          🖨️ Ver vale deste fornecedor
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

/* GERADOR DE PDF - FOLHA PEDIDO */
function gerarPDFFolhaPedido(compras, dataSelecionada, cadastros) {
  const porCliente = {};
  compras.forEach(c => {
    if (!porCliente[c.clienteDestino]) porCliente[c.clienteDestino] = [];
    porCliente[c.clienteDestino].push(c);
  });

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Folha de Pedido</title><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse}th{background:#1E4A30;color:white;padding:10px}td{padding:8px;border-bottom:1px solid #ddd}.cliente-title{background:#276642;color:white;padding:8px;margin:10px 0 10px 0;font-weight:bold}.total{font-weight:bold;text-align:right;padding:10px}.total-geral{font-weight:bold;text-align:right;padding:14px;font-size:16px;border-top:3px solid #1E4A30;margin-top:20px}</style></head><body><h1>📋 FOLHA DE PEDIDO</h1><p>Data: ${new Date(dataSelecionada+'T00:00:00').toLocaleDateString('pt-BR')}</p>`;

  let totalGeral = 0;
  Object.entries(porCliente).forEach(([clienteId, itens]) => {
    const cliente = cadastros.clientes.find(c => c.id === clienteId);
    const itensOrdenados = [...itens].sort((a, b) => a.produto.localeCompare(b.produto));
    html += `<div class="cliente-title">👤 ${cliente?.nome || clienteId}</div><table><tr><th>Produto</th><th>Produtor</th><th>Qtd</th><th>V.Unit</th><th>Total</th></tr>`;
    let total = 0;
    itensOrdenados.forEach(item => {
      const prod = cadastros.produtores.find(p => p.id === item.produtorId);
      const valor = item.valorFinal || item.valorTotal;
      total += valor;
      html += `<tr><td>${item.produto}</td><td>${prod?.nome || '—'}</td><td>${item.quantidade}</td><td>R$ ${(item.valorUnit||0).toFixed(2)}</td><td>R$ ${valor.toFixed(2)}</td></tr>`;
    });
    totalGeral += total;
    html += `</table><div class="total">Total: R$ ${total.toFixed(2)}</div>`;
  });

  if (Object.keys(porCliente).length > 1) {
    html += `<div class="total-geral">Total Geral (todos os clientes): R$ ${totalGeral.toFixed(2)}</div>`;
  }

  html += `<p style="margin-top:40px;border-top:2px solid #1E4A30;padding-top:20px">☐ Conferido | ☐ Divergência</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Folha-Pedido-${dataSelecionada}.html`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/* GERADOR DE PDF - FOLHA CARGA */
function gerarPDFFolhaCarga(compras, dataSelecionada, cadastros) {
  const porCliente = {};
  compras.forEach(c => {
    if (!porCliente[c.clienteDestino]) porCliente[c.clienteDestino] = [];
    porCliente[c.clienteDestino].push(c);
  });

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Folha de Carga</title><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse}th{background:#1E4A30;color:white;padding:10px}td{padding:8px;border-bottom:1px solid #ddd}.cliente-title{background:#276642;color:white;padding:8px;margin:10px 0 10px 0;font-weight:bold}.total{font-weight:bold;text-align:right;padding:10px}</style></head><body><h1>📦 FOLHA DE CARGA</h1><p>Data: ${new Date(dataSelecionada+'T00:00:00').toLocaleDateString('pt-BR')}</p>`;

  Object.entries(porCliente).forEach(([clienteId, itens]) => {
    const cliente = cadastros.clientes.find(c => c.id === clienteId);
    const itensOrdenados = [...itens].sort((a, b) => a.produto.localeCompare(b.produto));
    html += `<div class="cliente-title">👤 ${cliente?.nome || clienteId}</div><table><tr><th>Produto</th><th>Produtor</th><th>Qtd (CX)</th></tr>`;
    let totalCx = 0;
    itensOrdenados.forEach(item => {
      const prod = cadastros.produtores.find(p => p.id === item.produtorId);
      totalCx += Number(item.quantidade);
      html += `<tr><td>${item.produto}</td><td>${prod?.nome || '—'}</td><td>${item.quantidade}</td></tr>`;
    });
    html += `</table><div class="total">Total: ${totalCx} CX</div>`;
  });

  html += `<p style="margin-top:40px;border-top:2px solid #1E4A30;padding-top:20px">☐ Conferido | ☐ Divergência</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Folha-Carga-${dataSelecionada}.html`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/* GERADOR DE PDF - VALES */
function montarHtmlVale(itensGrupo, dataSelecionada, cadastros) {
  const primeiro = itensGrupo[0];
  const produtor = cadastros.produtores.find((p) => p.id === primeiro.produtorId);
  const cliente = cadastros.clientes.find((c) => c.id === primeiro.clienteDestino);
  const itensOrdenados = [...itensGrupo].sort((a, b) => a.produto.localeCompare(b.produto, "pt-BR"));

  const subtotal = itensGrupo.reduce((s, c) => s + Number(c.valorTotal), 0);
  const desconto = produtor?.temDescontoFundoRural ? subtotal * 0.0163 : 0;
  const total = subtotal - desconto;

  const linhasTabela = itensOrdenados
    .map(
      (i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #D8CBA0;">${i.produto}</td>
      <td style="padding:8px;border-bottom:1px solid #D8CBA0;text-align:right;">${i.quantidade}</td>
      <td style="padding:8px;border-bottom:1px solid #D8CBA0;text-align:right;">R$ ${(i.valorUnit || 0).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #D8CBA0;text-align:right;font-weight:bold;">R$ ${Number(i.valorTotal).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const boxPagamento =
    produtor && produtor.pagamento
      ? `<div style="background:#EDEAE0;border-radius:8px;padding:12px;margin-bottom:16px;">
          <div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#6E6650;">Forma de Pagamento</div>
          <div style="font-size:15px;font-weight:bold;color:#1F4A30;">${produtor.pagamento}</div>
          ${
            produtor.pagamento !== "BOLETO" && produtor.chavePix
              ? `<div style="font-size:14px;margin-top:4px;color:#1F4A30;"><b>Chave Pix:</b> ${produtor.chavePix}</div>`
              : ""
          }
        </div>`
      : "";

  const boxCliente = `<div style="background:#EDEAE0;border-radius:8px;padding:12px;margin-bottom:16px;">
    <div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#6E6650;">Para Quem (Cliente Destino)</div>
    <div style="font-size:18px;font-weight:bold;">${cliente?.nome || primeiro.clienteDestino || "—"}</div>
    ${cliente?.cidade ? `<div style="font-size:14px;color:#6E6650;">${cliente.cidade}</div>` : ""}
  </div>`;

  const corpoVale = `
    <div style="max-width:480px;margin:0 auto;padding:24px 24px 40px;color:#1C1B18;">
      <div style="border-bottom:2px solid #1F4A30;padding-bottom:16px;margin-bottom:16px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;color:#6E6650;">GAC CEASA MANAGER</div>
        <div style="font-size:26px;font-weight:bold;color:#1F4A30;">Vale de Compra</div>
        <div style="font-size:12px;color:#6E6650;margin-top:4px;">Emitido em ${new Date(dataSelecionada + "T00:00:00").toLocaleDateString("pt-BR")}</div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#6E6650;">Fornecedor</div>
        <div style="font-size:18px;font-weight:bold;">${produtor?.nome || "—"}</div>
        ${produtor?.cidade ? `<div style="font-size:14px;color:#6E6650;">${produtor.cidade}</div>` : ""}
        ${produtor?.telefone ? `<div style="font-size:14px;color:#6E6650;">Tel: ${produtor.telefone}</div>` : ""}
      </div>

      ${boxPagamento}
      ${boxCliente}

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
        <thead>
          <tr style="border-bottom:2px solid #1F4A30;">
            <th style="text-align:left;padding:8px 8px 8px 0;">Produto</th>
            <th style="text-align:right;padding:8px;">Qtd.</th>
            <th style="text-align:right;padding:8px;">Valor Unit.</th>
            <th style="text-align:right;padding:8px 0 8px 8px;">Total</th>
          </tr>
        </thead>
        <tbody>${linhasTabela}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:24px;">
        <div style="text-align:right;">
          <div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#6E6650;">Subtotal</div>
          <div style="font-size:16px;font-family:monospace;">R$ ${subtotal.toFixed(2)}</div>
          ${
            desconto > 0
              ? `<div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#D9861C;margin-top:8px;">Desconto (-1.63%)</div>
                 <div style="font-size:16px;font-family:monospace;color:#D9861C;">-R$ ${desconto.toFixed(2)}</div>`
              : ""
          }
          <div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#6E6650;margin-top:10px;padding-top:8px;border-top:1px solid #D8CBA0;">Total do Vale</div>
          <div style="font-size:22px;font-weight:bold;color:#1F4A30;">R$ ${total.toFixed(2)}</div>
        </div>
      </div>

      <div style="font-size:11px;text-align:center;margin-top:24px;padding-top:14px;border-top:1px solid #D8CBA0;color:#6E6650;">
        Documento gerado pelo GAC CEASA Manager — ${new Date(dataSelecionada + "T00:00:00").toLocaleDateString("pt-BR")}
      </div>
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Vale de Compra - ${produtor?.nome || ""}</title>
    <style>
      @page { margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; margin: 0; background: #F4F2EA; }
      .barra-topo { position: sticky; top: 0; background: #fff; padding: 12px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: right; }
      .botao-imprimir { background: #1F4A30; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; }
      @media print {
        .barra-topo { display: none !important; }
        body { background: #fff; }
      }
    </style>
    </head><body>
    <div class="barra-topo"><button class="botao-imprimir" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
    ${corpoVale}
    </body></html>`;
}

function baixarHtml(html, nomeArquivo) {
  const blob = new Blob([html], { type: "text/html" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  window.URL.revokeObjectURL(url);
}

function slugify(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function gerarPDFVales(compras, dataSelecionada, cadastros) {
  // Agrupa exatamente como o recibo manual: um vale = um Fornecedor + um Cliente Destino + um Dia.
  // Cada grupo vira um ARQUIVO SEPARADO — não junta vários vales num único PDF.
  const grupos = {};
  compras.forEach((c) => {
    const chave = `${c.produtorId}__${c.clienteDestino}__${c.data}`;
    if (!grupos[chave]) grupos[chave] = [];
    grupos[chave].push(c);
  });

  const listaGrupos = Object.values(grupos);

  listaGrupos.forEach((itensGrupo, idx) => {
    const primeiro = itensGrupo[0];
    const produtor = cadastros.produtores.find((p) => p.id === primeiro.produtorId);
    const cliente = cadastros.clientes.find((c) => c.id === primeiro.clienteDestino);
    const html = montarHtmlVale(itensGrupo, dataSelecionada, cadastros);
    const nomeArquivo = `Vale-${slugify(produtor?.nome)}-${slugify(cliente?.nome || primeiro.clienteDestino)}-${dataSelecionada}.html`;

    // Pequeno atraso entre cada download pra evitar que o navegador bloqueie
    // downloads múltiplos disparados muito rápido um atrás do outro.
    setTimeout(() => baixarHtml(html, nomeArquivo), idx * 350);
  });
}

/* GERADOR DE PDF - RELATÓRIO DE VENDAS DO DIA */
function gerarPDFRelatorioVendas(vendas, dataSelecionada, cadastros) {
  const porCliente = {};
  vendas.forEach(v => {
    if (!porCliente[v.clienteId]) porCliente[v.clienteId] = [];
    porCliente[v.clienteId].push(v);
  });

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Vendas</title><style>body{font-family:Arial;margin:20px}table{width:100%;border-collapse:collapse}th{background:#1E4A30;color:white;padding:10px}td{padding:8px;border-bottom:1px solid #ddd}.cliente-title{background:#276642;color:white;padding:8px;margin:14px 0 10px 0;font-weight:bold}.total{font-weight:bold;text-align:right;padding:10px}.total-geral{font-weight:bold;text-align:right;padding:14px;font-size:18px;border-top:3px solid #1E4A30;margin-top:20px}.resumo{background:#F0ECD8;padding:12px;border-radius:6px;margin-bottom:20px}</style></head><body><h1>🧾 RELATÓRIO DE VENDAS DO DIA</h1><p>Data: ${new Date(dataSelecionada+'T00:00:00').toLocaleDateString('pt-BR')}</p>`;

  const totalQtdGeral = vendas.reduce((s, v) => s + Number(v.quantidade), 0);
  const totalValorGeral = vendas.reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);
  const totalPago = vendas.filter(v => v.status === "Pago").reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);
  const totalPendente = vendas.filter(v => v.status !== "Pago").reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);

  html += `<div class="resumo">
    <b>Total de vendas:</b> ${vendas.length} · <b>Total de itens:</b> ${totalQtdGeral} CX<br>
    <b>Pago:</b> R$ ${totalPago.toFixed(2)} · <b>Pendente:</b> R$ ${totalPendente.toFixed(2)}
  </div>`;

  Object.entries(porCliente).forEach(([clienteId, itens]) => {
    const cliente = cadastros.clientes.find(c => c.id === clienteId);
    const itensOrdenados = [...itens].sort((a, b) => a.produto.localeCompare(b.produto));
    html += `<div class="cliente-title">👤 ${cliente?.nome || clienteId}</div><table><tr><th>Produto</th><th>Qtd</th><th>V.Unit</th><th>Total</th><th>Status</th></tr>`;
    let total = 0;
    itensOrdenados.forEach(item => {
      const valor = item.valorFinal || item.valorTotal;
      total += valor;
      html += `<tr><td>${item.produto}</td><td>${item.quantidade}</td><td>R$ ${(item.precoUnit||0).toFixed(2)}</td><td>R$ ${valor.toFixed(2)}</td><td>${item.status || '—'}</td></tr>`;
    });
    html += `</table><div class="total">Total: R$ ${total.toFixed(2)}</div>`;
  });

  html += `<div class="total-geral">Total Geral do Dia: R$ ${totalValorGeral.toFixed(2)}</div>`;
  html += `</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio-Vendas-${dataSelecionada}.html`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/* ====================================================================== */
/* Folha de Pedido Tab - Mostra compras por cliente com filtro de data   */
/* ====================================================================== */
function FolhaDePedidoTab({ cadastros, transacoes }) {
  const [dataSelecionada, setDataSelecionada] = useState(todayISO());
  const [clienteSelecionado, setClienteSelecionado] = useState("");

  const comprasHoje = transacoes.compras.filter((c) => c.data === dataSelecionada && c.clienteDestino !== "ESTOQUE");
  const clientesUnicos = [...new Set(comprasHoje.map((c) => c.clienteDestino))];
  
  const comprasDoCliente = clienteSelecionado ? comprasHoje.filter((c) => c.clienteDestino === clienteSelecionado) : [];
  const totalQtd = comprasDoCliente.reduce((s, c) => s + Number(c.quantidade), 0);
  const totalValor = comprasDoCliente.reduce((s, c) => s + Number(c.valorFinal || c.valorTotal), 0);

  return (
    <div>
      <Field label="Data">
        <TextInput type="date" value={dataSelecionada} onChange={(e) => { setDataSelecionada(e.target.value); setClienteSelecionado(""); }} />
      </Field>

      <Field label="Cliente">
        <Select value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
          <option value="">Selecione um cliente</option>
          {clientesUnicos.map((clienteId) => {
            const cl = cadastros.clientes.find((c) => c.id === clienteId);
            return <option key={clienteId} value={clienteId}>{cl?.nome}</option>;
          })}
        </Select>
      </Field>

      {clienteSelecionado && (
        <Card style={{ marginTop: 16 }}>
          <div className="flex justify-between items-center mb-3">
            <div className="font-bold" style={{ color: C.green700 }}>Total de Itens: {totalQtd} CX</div>
            <div className="font-bold" style={{ color: C.green700, fontFamily: monoFont }}>{fmtMoney(totalValor)}</div>
          </div>
          {comprasDoCliente
            .slice()
            .sort((a, b) => (a.produto || "").localeCompare(b.produto || "", "pt-BR"))
            .map((c) => {
              const produtor = cadastros.produtores.find((p) => p.id === c.produtorId);
              const valorItem = c.valorFinal || c.valorTotal;
              return (
                <Card key={c.id} style={{ marginBottom: 12, background: C.cardAlt }}>
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{c.produto}</div>
                      <div className="text-xs" style={{ color: C.inkSoft }}>{produtor?.nome}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{c.quantidade} CX</div>
                      <div className="text-xs" style={{ fontFamily: monoFont, color: C.inkSoft }}>
                        {fmtMoney(c.valorUnit)} un · {fmtMoney(valorItem)}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
        </Card>
      )}

      {comprasDoCliente.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={() => gerarPDFFolhaPedido(comprasDoCliente.sort((a, b) => a.produto.localeCompare(b.produto)), dataSelecionada, cadastros)}
            className="w-full px-4 py-3 rounded-lg font-bold text-sm"
            style={{ background: C.amber500, color: C.ink }}
          >
            🖨️ Imprimir Folha Pedido
          </button>
        </div>
      )}
    </div>
  );
}
function FolhaDeCargaTab({ cadastros, transacoes }) {
  const [dataSelecionada, setDataSelecionada] = useState(todayISO());
  const [clienteSelecionado, setClienteSelecionado] = useState("");

  const comprasHoje = transacoes.compras.filter((c) => c.data === dataSelecionada && c.clienteDestino !== "ESTOQUE");
  const clientesUnicos = [...new Set(comprasHoje.map((c) => c.clienteDestino))];
  
  const comprasDoCliente = clienteSelecionado ? comprasHoje.filter((c) => c.clienteDestino === clienteSelecionado) : [];
  const totalQtd = comprasDoCliente.reduce((s, c) => s + Number(c.quantidade), 0);

  return (
    <div>
      <Field label="Data">
        <TextInput type="date" value={dataSelecionada} onChange={(e) => { setDataSelecionada(e.target.value); setClienteSelecionado(""); }} />
      </Field>

      <Field label="Cliente">
        <Select value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)}>
          <option value="">Selecione um cliente</option>
          {clientesUnicos.map((clienteId) => {
            const cl = cadastros.clientes.find((c) => c.id === clienteId);
            return <option key={clienteId} value={clienteId}>{cl?.nome}</option>;
          })}
        </Select>
      </Field>

      {clienteSelecionado && (
        <Card style={{ marginTop: 16 }}>
          <div className="mb-3 font-bold" style={{ color: C.green700 }}>Total de CX: {totalQtd} CX</div>
          {comprasDoCliente.map((c) => {
            const produtor = cadastros.produtores.find((p) => p.id === c.produtorId);
            return (
              <Card key={c.id} style={{ marginBottom: 12, background: C.cardAlt }}>
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-sm">{c.produto}</div>
                    <div className="text-xs" style={{ color: C.inkSoft }}>{produtor?.nome}</div>
                  </div>
                  <div className="text-right"><div className="font-bold">{c.quantidade} CX</div></div>
                </div>
              </Card>
            );
          })}
        </Card>
      )}

      {comprasDoCliente.length > 0 && (
        <button
          onClick={() => gerarPDFFolhaCarga(comprasDoCliente.sort((a, b) => a.produto.localeCompare(b.produto)), dataSelecionada, cadastros)}
          className="w-full px-4 py-3 rounded-lg font-bold text-sm mt-4"
          style={{ background: C.amber500, color: C.ink }}
        >
          📥 Download Folha Carga
        </button>
      )}
    </div>
  );
}

/* ====================================================================== */
/* Relatório de Vendas do Dia - todas as vendas, agrupadas por cliente   */
/* ====================================================================== */
function RelatorioVendasTab({ cadastros, transacoes }) {
  const [dataSelecionada, setDataSelecionada] = useState(todayISO());

  const vendasDoDia = transacoes.vendas.filter((v) => v.data === dataSelecionada);
  const clientesUnicos = [...new Set(vendasDoDia.map((v) => v.clienteId))].sort((a, b) => {
    const nomeA = cadastros.clientes.find((c) => c.id === a)?.nome || "";
    const nomeB = cadastros.clientes.find((c) => c.id === b)?.nome || "";
    return nomeA.localeCompare(nomeB, "pt-BR");
  });

  const totalQtd = vendasDoDia.reduce((s, v) => s + Number(v.quantidade), 0);
  const totalValor = vendasDoDia.reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);
  const totalPago = vendasDoDia.filter((v) => v.status === "Pago").reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);
  const totalPendente = totalValor - totalPago;

  return (
    <div>
      <Field label="Data">
        <TextInput type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} max={todayISO()} />
      </Field>

      {vendasDoDia.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>Nenhuma venda registrada nesta data.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card style={{ background: C.green700 }}>
              <div className="text-xs" style={{ color: C.inkSoft }}>Total do Dia</div>
              <div className="text-lg font-bold" style={{ color: C.amber500, fontFamily: monoFont }}>{fmtMoney(totalValor)}</div>
              <div className="text-xs" style={{ color: C.inkSoft }}>{totalQtd} CX · {vendasDoDia.length} venda(s)</div>
            </Card>
            <Card>
              <div className="text-xs" style={{ color: C.inkSoft }}>Pago / Pendente</div>
              <div className="text-sm font-bold" style={{ color: "#6FCF97" }}>{fmtMoney(totalPago)}</div>
              <div className="text-sm font-bold" style={{ color: C.rust }}>{fmtMoney(totalPendente)}</div>
            </Card>
          </div>

          {clientesUnicos.map((clienteId) => {
            const cliente = cadastros.clientes.find((c) => c.id === clienteId);
            const vendasCliente = vendasDoDia
              .filter((v) => v.clienteId === clienteId)
              .sort((a, b) => (a.produto || "").localeCompare(b.produto || "", "pt-BR"));
            const totalCliente = vendasCliente.reduce((s, v) => s + Number(v.valorFinal || v.valorTotal), 0);

            return (
              <Card key={clienteId} style={{ marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm" style={{ color: C.blue600 }}>👤 {cliente?.nome || "—"}</div>
                  <div className="text-xs font-bold" style={{ fontFamily: monoFont, color: C.inkSoft }}>{fmtMoney(totalCliente)}</div>
                </div>
                {vendasCliente.map((v) => (
                  <div key={v.id} className="text-xs mb-1 flex justify-between" style={{ color: C.inkSoft }}>
                    <span>{v.produto} - {v.quantidade} un · {v.status}</span>
                    <span style={{ fontFamily: monoFont }}>{fmtMoney(v.valorFinal || v.valorTotal)}</span>
                  </div>
                ))}
              </Card>
            );
          })}

          <button
            onClick={() => gerarPDFRelatorioVendas(vendasDoDia, dataSelecionada, cadastros)}
            className="w-full px-4 py-3 rounded-lg font-bold text-sm mt-2"
            style={{ background: C.amber500, color: C.ink }}
          >
            🖨️ Imprimir Relatório de Vendas
          </button>
        </>
      )}
    </div>
  );
}

function FormCompra({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast, setRecibo }) {
  const [produtorId, setProdutorId] = useState(cadastros.produtores[0]?.id || "");
  const [clienteDestino, setClienteDestino] = useState(cadastros.clientes[0]?.id || "");
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnit, setValorUnit] = useState("");
  const [cargueiro, setCargueiro] = useState("");
  const [ultimaCompra, setUltimaCompra] = useState(null);
  const [isEstoque, setIsEstoque] = useState(false);
  const [view, setView] = useState("registrar");
  const [editandoId, setEditandoId] = useState(null);
  const [editQtd, setEditQtd] = useState("");
  const [editValor, setEditValor] = useState("");
  const [expandidoDestino, setExpandidoDestino] = useState(null);

  // Conferente fixo por empresa: quando muda o cliente destino, se essa empresa
  // tem um conferente vinculado em Contas → Gerenciar Acesso, já pré-seleciona
  // ele sozinho. Compra Para Estoque não tem empresa, então não auto-preenche.
  useEffect(() => {
    if (isEstoque || !clienteDestino) return;
    const equipe = normalizarEquipe(cadastros.compradoresVendedores);
    const fixo = equipe.find((e) => e.funcao === "conferente" && e.clienteId === clienteDestino);
    if (fixo) setCargueiro(fixo.nome);
  }, [clienteDestino, isEstoque]); // eslint-disable-line react-hooks/exhaustive-deps
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

  // Conferente/cargueiro guarda o NOME direto (não um ID de cadastro separado —
  // isso elimina a dependência de uma coluna nova que não persistia no backend).
  // Cadastrar aqui já vincula a empresa atual (clienteDestino) automaticamente.
  const addCargueiro = async (nome) => {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;
    const equipeAtual = normalizarEquipe(cadastros.compradoresVendedores);
    const novo = {
      id: uid(),
      nome: nomeLimpo,
      funcao: "conferente",
      clienteId: isEstoque ? "" : clienteDestino,
    };
    await persistCadastros({ ...cadastros, compradoresVendedores: [...equipeAtual, novo] });
    setCargueiro(nomeLimpo);
  };

  const salvar = async () => {
    if (!produtorId || !produto || !quantidade || !valorUnit) return;
    if (!isEstoque && !clienteDestino) {
      showToast("Escolha cliente ou marque Para Estoque");
      return;
    }
    const nova = {
      id: uid(),
      data: todayISO(),
      produtorId,
      clienteDestino: isEstoque ? "ESTOQUE" : clienteDestino,
      paraEstoque: isEstoque,
      produto,
      cargueiro,
      quantidade: Number(quantidade),
      valorUnit: Number(valorUnit),
      valorTotal: total,
      desconto: desconto,
      valorFinal: valorFinal,
      entregaConfirmada: false,
      quantidadeRecebida: null,
      divergencia: null,
    };
    await persistTransacoes({ ...transacoes, compras: [nova, ...transacoes.compras] });
    setQuantidade("");
    setValorUnit("");
    setCargueiro("");
    setIsEstoque(false);
    setUltimaCompra(nova);
    showToast("Compra registrada");
  };

  const editarCompra = async (compraId) => {
    if (!editQtd || !editValor) return;
    const novaQtd = Number(editQtd);
    const novoValor = Number(editValor);
    const novoTotal = novaQtd * novoValor;
    const nextCompras = transacoes.compras.map((c) =>
      c.id === compraId 
        ? { ...c, quantidade: novaQtd, valorUnit: novoValor, valorTotal: novoTotal, valorFinal: novoTotal - (c.desconto || 0) }
        : c
    );
    await persistTransacoes({ ...transacoes, compras: nextCompras });
    setEditandoId(null);
    setEditQtd("");
    setEditValor("");
    showToast("✅ Compra atualizada!");
  };

  const excluirCompra = async (compra) => {
    // Excluir aqui remove a compra de tudo que lê dessa mesma lista:
    // Requisição, Conferência, Folha de Pedido/Carga, Estoque e Conta Corrente do fornecedor.
    const jaFinalizado = (transacoes.diasFinalizados || []).includes(compra.data);
    const aviso = compra.entregaConfirmada
      ? `Essa compra já foi conferida${jaFinalizado ? " e o dia já foi finalizado" : ""}. Confirma excluir mesmo assim?\n\n${compra.produto} · ${compra.quantidade} CX`
      : `Excluir esta compra?\n\n${compra.produto} · ${compra.quantidade} CX`;
    const confirmado = window.confirm(aviso);
    if (!confirmado) return;

    const nextCompras = transacoes.compras.filter((c) => c.id !== compra.id);
    await persistTransacoes({ ...transacoes, compras: nextCompras });
    showToast("Compra excluída");
  };

  return (
    <>
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setView("registrar")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "registrar" ? C.green700 : C.cardAlt, color: view === "registrar" ? "#fff" : C.ink }}>➕ Registrar</button>
          <button onClick={() => setView("requisicao")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "requisicao" ? C.green700 : C.cardAlt, color: view === "requisicao" ? "#fff" : C.ink }}>📋 Requisição</button>
          <button onClick={() => setView("folha-pedido")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "folha-pedido" ? C.green700 : C.cardAlt, color: view === "folha-pedido" ? "#fff" : C.ink }}>📄 Folha Pedido</button>
          <button onClick={() => setView("folha-carga")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "folha-carga" ? C.green700 : C.cardAlt, color: view === "folha-carga" ? "#fff" : C.ink }}>📦 Folha Carga</button>
        </div>

        {view === "registrar" && (
          <>
      <Field label="Produtor">
        <Select value={produtorId} onChange={(e) => setProdutorId(e.target.value)}>
          {[...cadastros.produtores].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
        <QuickAddProdutor onAdd={addProdutor} />
      </Field>
      {produtorSelecionado && (
        <div className="mb-3 p-2 rounded-lg" style={{ background: produtorSelecionado.temCNPJ ? "#E8F5E9" : "#FFEBEE" }}>
          <div className="text-xs font-bold" style={{ color: produtorSelecionado.temCNPJ ? "#2E7D32" : "#C62828" }}>
            {produtorSelecionado.temCNPJ ? "✓ Produtor com CNPJ" : "⚠ Produtor sem CNPJ (CPF)"}
          </div>
          {temDesconto && (
            <div className="text-xs mt-1" style={{ color: "#C62828" }}>
              Desconto Fundo Rural de 1.63% será aplicado
            </div>
          )}
          <div className="text-xs mt-1" style={{ color: "#555" }}>
            Pagamento: {produtorSelecionado.pagamento || "não definido"}
            {produtorSelecionado.pagamento === "BOLETO"
              ? " — não gera vale na Finalização"
              : " — gera vale na Finalização"}
          </div>
        </div>
      )}
      <div className="mb-3 p-2 rounded" style={{ background: C.amberSoft }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isEstoque}
            onChange={(e) => setIsEstoque(e.target.checked)}
          />
          <span style={{ color: C.ink }}>📦 Para Estoque?</span>
        </label>
      </div>
      <Field label="Para Quem (Cliente Destino)">
        <Select 
          value={clienteDestino} 
          onChange={(e) => setClienteDestino(e.target.value)}
          disabled={isEstoque}
        >
          {[...cadastros.clientes].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Produto">
        <Select value={produto} onChange={(e) => setProduto(e.target.value)}>
          {[...cadastros.produtos].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => (
            <option key={p.id} value={p.nome}>
              {p.nome}
            </option>
          ))}
        </Select>
        <QuickAddInline placeholder="Nome do produto" onAdd={addProduto} />
      </Field>
      
      <Field label="Cargueiro / Conferente">
        <Select value={cargueiro} onChange={(e) => setCargueiro(e.target.value)}>
          <option value="">Selecione um conferente</option>
          {normalizarEquipe(cadastros.compradoresVendedores)
            .filter((e) => e.funcao === "conferente")
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))
            .map((e) => (
              <option key={e.id} value={e.nome}>
                {e.nome}
              </option>
            ))}
        </Select>
        <QuickAddInline placeholder="Nome do novo conferente" onAdd={addCargueiro} />
        <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
          {!isEstoque &&
          clienteDestino &&
          normalizarEquipe(cadastros.compradoresVendedores).some(
            (e) => e.funcao === "conferente" && e.clienteId === clienteDestino && e.nome === cargueiro
          )
            ? "🔒 Fixo pra esta empresa — pré-selecionado automaticamente."
            : "O conferente selecionado é quem vai conferir essa entrega — quando ele entrar como Conferente com esse mesmo nome, só essa carga aparece pra ele."}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade">
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Valor Unit. (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
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
      <PrimaryButton
        onClick={salvar}
        icon={ArrowDownCircle}
        disabled={!produtorId || !produto || !quantidade || !valorUnit || Number(quantidade) <= 0 || Number(valorUnit) <= 0}
      >
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

      <SectionTitle icon={Package} style={{ marginTop: 20 }}>Minhas Compras do Dia</SectionTitle>

      {transacoes.compras.filter((c) => c.data === todayISO()).length === 0 ? (
        <Card><p className="text-sm" style={{ color: C.inkSoft }}>Nenhuma compra registrada hoje.</p></Card>
      ) : (
        (() => {
          const comprasHojeTodas = transacoes.compras.filter((c) => c.data === todayISO());
          // Agrupa por destino (ESTOQUE fica sempre em primeiro, depois clientes em ordem alfabética)
          const gruposDestino = [...new Set(comprasHojeTodas.map((c) => c.clienteDestino))].sort((a, b) => {
            if (a === "ESTOQUE") return -1;
            if (b === "ESTOQUE") return 1;
            const nomeA = cadastros.clientes.find((cl) => cl.id === a)?.nome || "";
            const nomeB = cadastros.clientes.find((cl) => cl.id === b)?.nome || "";
            return nomeA.localeCompare(nomeB, "pt-BR");
          });

          return (
            <div className="flex flex-col gap-3">
              {gruposDestino.map((destinoId) => {
                const isEstoqueGrupo = destinoId === "ESTOQUE";
                const cliente = isEstoqueGrupo ? null : cadastros.clientes.find((cl) => cl.id === destinoId);
                const comprasDoGrupo = comprasHojeTodas.filter((c) => c.clienteDestino === destinoId);
                // Fornecedores em ordem alfabética também
                const produtoresDoGrupo = [...new Set(comprasDoGrupo.map((c) => c.produtorId))].sort((a, b) => {
                  const nomeA = cadastros.produtores.find((p) => p.id === a)?.nome || "";
                  const nomeB = cadastros.produtores.find((p) => p.id === b)?.nome || "";
                  return nomeA.localeCompare(nomeB, "pt-BR");
                });

                const aberto = expandidoDestino === destinoId || gruposDestino.length === 1;

                return (
                  <div key={destinoId}>
                    <button
                      onClick={() => setExpandidoDestino(aberto && gruposDestino.length > 1 ? null : destinoId)}
                      className="w-full font-bold mb-2 p-2.5 rounded flex items-center justify-between gap-1.5"
                      style={{
                        background: isEstoqueGrupo ? C.green700 : C.blue600,
                        color: isEstoqueGrupo ? C.ink : "white",
                      }}
                    >
                      <span>{isEstoqueGrupo ? "📦 COMPRA PARA ESTOQUE" : `👤 ${cliente?.nome || "—"}`}</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold" style={{ opacity: 0.9 }}>
                        {comprasDoGrupo.length} {comprasDoGrupo.length === 1 ? "item" : "itens"}
                        <ChevronRight
                          size={16}
                          style={{ transform: aberto ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                        />
                      </span>
                    </button>
                    {aberto && (
                    <div className="flex flex-col gap-2">
                      {produtoresDoGrupo.map((produtorId) => {
                        const produtor = cadastros.produtores.find((p) => p.id === produtorId);
                        // Dentro de cada fornecedor, produtos em ordem alfabética (A-Z) pra achar mais fácil
                        const comprasDoFornecedor = comprasDoGrupo
                          .filter((c) => c.produtorId === produtorId)
                          .sort((a, b) => (a.produto || "").localeCompare(b.produto || "", "pt-BR"));

                        return (
                          <Card key={produtorId} style={{ background: C.cardAlt }}>
                            <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.green700 }}>
                              {produtor?.nome || "—"}
                            </div>
                            <div className="flex flex-col gap-2">
                              {comprasDoFornecedor.map((c, idx) => {
                                if (editandoId === c.id) {
                                  return (
                                    <div
                                      key={c.id}
                                      className="p-2 rounded"
                                      style={{ background: C.amberSoft }}
                                    >
                                      <div className="mb-2 font-bold text-xs">Editando: {c.produto}</div>
                                      <Field label="Quantidade">
                                        <TextInput type="number" value={editQtd} onChange={(e) => setEditQtd(e.target.value)} placeholder={c.quantidade} />
                                      </Field>
                                      <Field label="Valor Unit (R$)">
                                        <TextInput type="number" value={editValor} onChange={(e) => setEditValor(e.target.value)} placeholder={c.valorUnit} />
                                      </Field>
                                      <div className="flex gap-3">
                                        <button onClick={() => editarCompra(c.id)} className="text-xs font-bold" style={{ color: C.green700 }}>✓ Salvar</button>
                                        <button onClick={() => setEditandoId(null)} className="text-xs font-bold" style={{ color: C.inkSoft }}>✕ Cancelar</button>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    key={c.id}
                                    className="flex justify-between items-start"
                                    style={{
                                      paddingBottom: 8,
                                      borderBottom: idx < comprasDoFornecedor.length - 1 ? `1px solid ${C.line}` : "none",
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="font-bold text-sm">{c.produto}</div>
                                      <div className="text-xs" style={{ fontFamily: monoFont, color: C.inkSoft }}>
                                        {c.quantidade} CX · {fmtMoney(c.valorFinal || c.valorTotal)}
                                      </div>
                                      <div className="flex gap-3 mt-1">
                                        <button
                                          onClick={() => { setEditandoId(c.id); setEditQtd(String(c.quantidade)); setEditValor(String(c.valorUnit)); }}
                                          className="text-xs font-bold"
                                          style={{ color: C.green700 }}
                                        >
                                          ✏️ Editar
                                        </button>
                                        <button
                                          onClick={() => excluirCompra(c)}
                                          className="text-xs font-bold"
                                          style={{ color: C.rust }}
                                        >
                                          🗑️ Excluir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()
      )}
          </>
        )}
        {view === "requisicao" && <RequisicaoTab cadastros={cadastros} transacoes={transacoes} setRecibo={setRecibo} />}
        {view === "folha-pedido" && <FolhaDePedidoTab cadastros={cadastros} transacoes={transacoes} />}
        {view === "folha-carga" && <FolhaDeCargaTab cadastros={cadastros} transacoes={transacoes} />}
      </Card>
    </>
  );
}

function FormVenda({ cadastros, transacoes, persistCadastros, persistTransacoes, showToast, setRecibo }) {
  const [view, setView] = useState("registrar");
  const [clienteId, setClienteId] = useState(cadastros.clientes[0]?.id || "");
  const [produto, setProduto] = useState(cadastros.produtos[0]?.nome || "");
  const [quantidade, setQuantidade] = useState("");
  const [precoUnit, setPrecoUnit] = useState("");
  const [status, setStatus] = useState("Pendente");
  const [entregaVendaId, setEntregaVendaId] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editQtd, setEditQtd] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const total = (Number(quantidade) || 0) * (Number(precoUnit) || 0);
  
  // Verifica se cliente tem desconto fundo rural
  const clienteSelecionado = cadastros.clientes.find((c) => c.id === clienteId);
  const temDescontoFundoRural = clienteSelecionado?.temDescontoFundoRural;
  const desconto = temDescontoFundoRural ? total * 0.0163 : 0;
  const valorFinal = total - desconto;

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

  const editar = async (vendaId) => {
    if (!editQtd || !editPreco) return;
    const novaQtd = Number(editQtd);
    const novoPreco = Number(editPreco);
    const nextVendas = transacoes.vendas.map((v) =>
      v.id === vendaId 
        ? { ...v, quantidade: novaQtd, precoUnit: novoPreco, valorTotal: novaQtd * novoPreco, valorFinal: (novaQtd * novoPreco) - (v.desconto || 0) }
        : v
    );
    await persistTransacoes({ ...transacoes, vendas: nextVendas });
    setEditandoId(null);
    setEditQtd("");
    setEditPreco("");
    showToast("✅ Venda atualizada!");
  };

  const excluirVenda = async (venda) => {
    // Excluir aqui remove a venda de tudo que lê dessa mesma lista:
    // Entregas, Conta Corrente do cliente e Dashboard.
    const aviso = venda.entrega
      ? `Essa venda já tem dados de entrega preenchidos. Confirma excluir mesmo assim?\n\n${venda.produto} · ${venda.quantidade} un`
      : `Excluir esta venda?\n\n${venda.produto} · ${venda.quantidade} un`;
    const confirmado = window.confirm(aviso);
    if (!confirmado) return;

    const nextVendas = transacoes.vendas.filter((v) => v.id !== venda.id);
    await persistTransacoes({ ...transacoes, vendas: nextVendas });
    showToast("Venda excluída");
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
    <>
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setView("registrar")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "registrar" ? C.green700 : C.cardAlt, color: view === "registrar" ? "#fff" : C.ink }}>➕ Registrar</button>
          <button onClick={() => setView("relatorio")} className="px-3 py-2 rounded text-xs font-bold" style={{ background: view === "relatorio" ? C.green700 : C.cardAlt, color: view === "relatorio" ? "#fff" : C.ink }}>🧾 Relatório do Dia</button>
        </div>

        {view === "registrar" && (
          <>
      <Field label="Cliente">
        <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          {[...cadastros.clientes].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
        <QuickAddCliente onAdd={addCliente} />
      </Field>
      {clienteSelecionado && temDescontoFundoRural && (
        <div className="mb-3 p-2 rounded-lg" style={{ background: "#FFEBEE" }}>
          <div className="text-xs font-bold" style={{ color: "#C62828" }}>
            📋 Cliente com Desconto Fundo Rural (1.63%)
          </div>
        </div>
      )}
      <Field label="Produto">
        <Select value={produto} onChange={(e) => setProduto(e.target.value)}>
          {[...cadastros.produtos].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => (
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
            min="0"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Preço Unit. (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
            min="0"
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
          Total: <span style={{ fontFamily: monoFont }}>{fmtMoney(valorFinal)}</span>
        </div>
      </div>
      <PrimaryButton
        onClick={salvar}
        icon={ArrowUpCircle}
        disabled={!clienteId || !produto || !quantidade || !precoUnit || Number(quantidade) <= 0 || Number(precoUnit) <= 0}
      >
        Registrar Venda
      </PrimaryButton>

      <SectionTitle icon={ShoppingBasket} style={{ marginTop: 20 }}>Minhas Vendas do Dia</SectionTitle>

      {transacoes.vendas.filter((v) => v.data === todayISO()).length === 0 ? (
        <Card><p className="text-sm" style={{ color: C.inkSoft }}>Nenhuma venda registrada hoje.</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {transacoes.vendas.filter((v) => v.data === todayISO()).map((v) => {
            const cliente = cadastros.clientes.find((c) => c.id === v.clienteId);
            if (editandoId === v.id) {
              return (
                <Card key={v.id} style={{ background: C.amberSoft }}>
                  <div className="mb-3 font-bold">Editando Venda</div>
                  <Field label="Quantidade">
                    <TextInput type="number" value={editQtd} onChange={(e) => setEditQtd(e.target.value)} placeholder={v.quantidade} />
                  </Field>
                  <Field label="Preço Unit (R$)">
                    <TextInput type="number" value={editPreco} onChange={(e) => setEditPreco(e.target.value)} placeholder={v.precoUnit} />
                  </Field>
                  <div className="flex gap-2">
                    <button onClick={() => editar(v.id)} className="text-xs font-bold" style={{ color: C.green700 }}>✓ Salvar</button>
                    <button onClick={() => setEditandoId(null)} className="text-xs font-bold" style={{ color: C.inkSoft }}>✕ Cancelar</button>
                  </div>
                </Card>
              );
            }
            return (
              <Card key={v.id} style={{ background: C.cardAlt }}>
                <div className="flex justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-sm">{cliente?.nome || "—"}</div>
                    <div className="text-xs" style={{ color: C.inkSoft }}>{v.produto} • {v.quantidade} un</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ fontFamily: monoFont }}>{fmtMoney(v.valorFinal ?? v.valorTotal)}</div>
                    <div className="text-xs" style={{ color: C.inkSoft }}>{v.status}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditandoId(v.id); setEditQtd(String(v.quantidade)); setEditPreco(String(v.precoUnit)); }} className="text-xs font-bold" style={{ color: C.green700 }}>✏️ Editar</button>
                  {setRecibo && (
                    <button onClick={() => setRecibo({ tipo: "venda", item: v, quemVe: "vendedor" })} className="text-xs font-bold" style={{ color: C.amber500 }}>🖨️ Vale</button>
                  )}
                  <button onClick={() => excluirVenda(v)} className="text-xs font-bold" style={{ color: C.rust }}>🗑️ Excluir</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
          </>
        )}
        {view === "relatorio" && <RelatorioVendasTab cadastros={cadastros} transacoes={transacoes} />}
      </Card>
    </>
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
  const [data, setData] = useState(todayISO());
  const [tipo, setTipo] = useState("pagamento"); // "pagamento" | "ajuste"
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");

  const salvar = async () => {
    if (!clienteId || !valor) return;
    const novo = {
      id: uid(),
      data,
      clienteId,
      valor: Number(valor),
      tipo,
      formaPagamento: tipo === "pagamento" ? formaPagamento : null,
      obs,
    };
    await persistTransacoes({
      ...transacoes,
      recebimentos: [novo, ...transacoes.recebimentos],
    });
    setValor("");
    setObs("");
    showToast(tipo === "pagamento" ? "Recebimento registrado" : "Desconto/Ajuste registrado");
  };

  return (
    <Card>
      <Field label="Cliente">
        <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          {[...cadastros.clientes].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Data">
        <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} max={todayISO()} />
      </Field>
      <Field label="Tipo de Lançamento">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="pagamento">Recebimento (dinheiro entrou de verdade)</option>
          <option value="ajuste">Desconto / Ajuste (abate a dívida, sem receber)</option>
        </Select>
      </Field>
      {tipo === "pagamento" && (
        <Field label="Forma de Pagamento">
          <Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="BOLETO">Boleto</option>
            <option value="CHEQUE">Cheque</option>
          </Select>
        </Field>
      )}
      <Field label={tipo === "pagamento" ? "Valor Recebido (R$)" : "Valor do Desconto (R$)"}>
        <TextInput
          type="number"
          inputMode="decimal"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label="Observação (opcional)">
        <TextInput
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder={tipo === "pagamento" ? "Ex: referente a boleto nº..." : "Ex: motivo do desconto"}
        />
      </Field>
      <PrimaryButton
        onClick={salvar}
        icon={HandCoins}
        disabled={!clienteId || !valor || Number(valor) <= 0}
      >
        {tipo === "pagamento" ? "Registrar Recebimento" : "Registrar Desconto/Ajuste"}
      </PrimaryButton>
    </Card>
  );
}

function FormPagamento({ cadastros, transacoes, persistTransacoes, showToast }) {
  const [produtorId, setProdutorId] = useState(cadastros.produtores[0]?.id || "");
  const [data, setData] = useState(todayISO());
  const [tipo, setTipo] = useState("pagamento"); // "pagamento" | "ajuste"
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");

  const salvar = async () => {
    if (!produtorId || !valor) return;
    const novo = {
      id: uid(),
      data,
      produtorId,
      valor: Number(valor),
      tipo,
      formaPagamento: tipo === "pagamento" ? formaPagamento : null,
      obs,
    };
    await persistTransacoes({
      ...transacoes,
      pagamentos: [novo, ...transacoes.pagamentos],
    });
    setValor("");
    setObs("");
    showToast(tipo === "pagamento" ? "Pagamento registrado" : "Desconto/Ajuste registrado");
  };

  return (
    <Card>
      <Field label="Produtor">
        <Select value={produtorId} onChange={(e) => setProdutorId(e.target.value)}>
          {[...cadastros.produtores].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Data">
        <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} max={todayISO()} />
      </Field>
      <Field label="Tipo de Lançamento">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="pagamento">Pagamento (dinheiro saiu de verdade)</option>
          <option value="ajuste">Desconto / Ajuste (abate a dívida, sem pagar)</option>
        </Select>
      </Field>
      {tipo === "pagamento" && (
        <Field label="Forma de Pagamento">
          <Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="BOLETO">Boleto</option>
            <option value="CHEQUE">Cheque</option>
          </Select>
        </Field>
      )}
      <Field label={tipo === "pagamento" ? "Valor Pago (R$)" : "Valor do Desconto (R$)"}>
        <TextInput
          type="number"
          inputMode="decimal"
          min="0"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
        />
      </Field>
      <Field label="Observação (opcional)">
        <TextInput
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder={tipo === "pagamento" ? "Ex: referente a nota nº..." : "Ex: mercadoria com problema"}
        />
      </Field>
      <PrimaryButton
        onClick={salvar}
        icon={Landmark}
        disabled={!produtorId || !valor || Number(valor) <= 0}
      >
        {tipo === "pagamento" ? "Registrar Pagamento" : "Registrar Desconto/Ajuste"}
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
  const [dataConfirmadas, setDataConfirmadas] = useState(todayISO()); // Entregas confirmadas só mostra o dia selecionado

  const norm = (s) => (s || "").trim().toLowerCase();
  const ehMinha = (v) => !soMeuNome || norm(v.entrega?.carregador) === norm(soMeuNome);

  const comEntrega = transacoes.vendas.filter((v) => v.entrega && ehMinha(v));
  const pendentes = comEntrega.filter((v) => !v.entrega.confirmada);
  // "Entregas confirmadas" só mostra o dia selecionado — não acumula pra sempre.
  const confirmadas = comEntrega.filter((v) => v.entrega.confirmada && v.data === dataConfirmadas);
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

      {comEntrega.length > 0 && (
        <>
          <SectionTitle icon={Check}>Entregas confirmadas</SectionTitle>
          <Field label="Ver entregas confirmadas do dia">
            <TextInput
              type="date"
              value={dataConfirmadas}
              onChange={(e) => setDataConfirmadas(e.target.value)}
              max={todayISO()}
            />
          </Field>
          {confirmadas.length === 0 ? (
            <Card>
              <p className="text-sm" style={{ color: C.inkSoft }}>
                Nenhuma entrega confirmada em {fmtDate(dataConfirmadas)}.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {confirmadas.map((v) => (
                <EntregaCard key={v.id} v={v} />
              ))}
            </div>
          )}
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
function ConferenciaComprasTab({ cadastros, transacoes, persistTransacoes, showToast, setRecibo, soMeuNome }) {
  const produtorNome = (id) => cadastros.produtores.find((p) => p.id === id)?.nome || "—";
  const [conferindoId, setConferindoId] = useState(null);
  const [filtroCliente, setFiltroCliente] = useState(""); // "" = mostrar todas as empresas
  const [expandidoPendente, setExpandidoPendente] = useState(null); // id do cliente aberto em "A conferir"
  const [expandidoConferida, setExpandidoConferida] = useState(null); // id do cliente aberto em "Conferidas"
  const [dataConferidas, setDataConferidas] = useState(todayISO()); // Conferidas só mostra o dia selecionado, começando em hoje

  const norm = (s) => (s || "").trim().toLowerCase();
  // O cargueiro/conferente da compra agora guarda o NOME direto (não mais um ID
  // de um cadastro separado que dependia do backend persistir "cargueiros").
  const ehMinha = (c) => !soMeuNome || !c.cargueiro || norm(c.cargueiro) === norm(soMeuNome);

  const nomeCliente = (id) =>
    id === "ESTOQUE" ? "Estoque" : cadastros.clientes.find((cl) => cl.id === id)?.nome || "—";

  const ordenarClientes = (ids) =>
    [...ids].sort((a, b) => {
      if (a === "ESTOQUE") return -1;
      if (b === "ESTOQUE") return 1;
      return nomeCliente(a).localeCompare(nomeCliente(b), "pt-BR");
    });

  const todasMinhas = transacoes.compras.filter(ehMinha);
  const pendentesTodas = todasMinhas.filter((c) => !c.entregaConfirmada);
  // "Conferidas" só mostra o dia selecionado — o que já foi finalizado não fica
  // acumulando aqui pra sempre; pra revisar um dia anterior, é só trocar a data.
  const confirmadasTodas = todasMinhas.filter((c) => c.entregaConfirmada && c.data === dataConferidas);

  // Empresas/clientes disponíveis pra filtrar (a partir do que está pendente pra este conferente)
  const empresasDisponiveis = ordenarClientes([...new Set(pendentesTodas.map((c) => c.clienteDestino))]);

  const pendentes = filtroCliente ? pendentesTodas.filter((c) => c.clienteDestino === filtroCliente) : pendentesTodas;
  const confirmadas = filtroCliente ? confirmadasTodas.filter((c) => c.clienteDestino === filtroCliente) : confirmadasTodas;

  const agruparPorCliente = (lista) =>
    ordenarClientes([...new Set(lista.map((c) => c.clienteDestino))]).map((id) => ({
      id,
      nome: nomeCliente(id),
      itens: lista.filter((c) => c.clienteDestino === id),
    }));

  // Dados de hoje pra liberar o "Finalizar Conferência" (sempre olha tudo, não só o filtrado)
  const hoje = todayISO();
  const comprasHoje = transacoes.compras.filter((c) => c.data === hoje && c.clienteDestino !== "ESTOQUE");
  const pendentesHoje = comprasHoje.filter((c) => !c.entregaConfirmada);
  const diasFinalizados = transacoes.diasFinalizados || [];
  const jaFinalizadoHoje = diasFinalizados.includes(hoje);
  const podeFinalizarHoje = comprasHoje.length > 0 && pendentesHoje.length === 0 && !jaFinalizadoHoje;

  const finalizarConferencia = async () => {
    if (jaFinalizadoHoje) {
      showToast("A conferência de hoje já foi finalizada");
      return;
    }
    if (comprasHoje.length === 0) {
      showToast("Nenhuma compra hoje pra finalizar");
      return;
    }
    if (pendentesHoje.length > 0) {
      showToast("Ainda tem compra pendente de conferência hoje");
      return;
    }
    // 1) Folha de Pedido — todos os clientes do dia, agrupados
    gerarPDFFolhaPedido(comprasHoje, hoje, cadastros);
    // 2) Vales só das compras cujo FORNECEDOR (produtor) paga PIX ou Dinheiro (sem boleto).
    // Produtor sem forma de pagamento definida (cadastro antigo) continua gerando vale, por segurança.
    const comprasSemBoleto = comprasHoje.filter((c) => {
      const produtor = cadastros.produtores.find((p) => p.id === c.produtorId);
      return !produtor?.pagamento || produtor.pagamento !== "BOLETO";
    });
    if (comprasSemBoleto.length > 0) {
      gerarPDFVales(comprasSemBoleto, hoje, cadastros);
    }
    // Trava: marca o dia como finalizado pra não gerar os documentos de novo
    await persistTransacoes({ ...transacoes, diasFinalizados: [...diasFinalizados, hoje] });
    showToast("Conferência finalizada — documentos gerados");
  };

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
            {c.cargueiro && (
              <div className="text-xs" style={{ color: C.inkSoft }}>
                Cargueiro: {c.cargueiro || "—"}
              </div>
            )}
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

  const GrupoClienteBloco = ({ grupo, expandido, onToggle }) => {
    const aberto = expandido === grupo.id;
    const qtdItens = grupo.itens.length;
    return (
      <div key={grupo.id} className="mb-2">
        <button
          onClick={() => onToggle(aberto ? null : grupo.id)}
          className="w-full font-bold text-xs uppercase tracking-wide px-3 py-2.5 rounded-lg flex items-center justify-between gap-1.5"
          style={{
            background: grupo.id === "ESTOQUE" ? C.green700 : C.blue600,
            color: "#fff",
          }}
        >
          <span className="flex items-center gap-1.5">
            {grupo.id === "ESTOQUE" ? "📦" : "👤"} {grupo.nome}
          </span>
          <span className="flex items-center gap-1.5 normal-case font-bold" style={{ opacity: 0.9 }}>
            {qtdItens} {qtdItens === 1 ? "item" : "itens"}
            <ChevronRight
              size={16}
              style={{ transform: aberto ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
            />
          </span>
        </button>
        {aberto && (
          <div className="flex flex-col gap-2 mt-2">
            {grupo.itens.map((c) => (
              <CompraRow key={c.id} c={c} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        {soMeuNome
          ? "Suas compras pra conferir, separadas por empresa/cliente."
          : "Lista de compras pra o cargueiro conferir a quantidade recebida e marcar quando a mercadoria chegar no pátio."}
      </p>

      {soMeuNome && empresasDisponiveis.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
          <button
            onClick={() => setFiltroCliente("")}
            className="px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0"
            style={{
              background: !filtroCliente ? C.green700 : C.cardAlt,
              color: !filtroCliente ? "#fff" : C.ink,
              border: `1px solid ${!filtroCliente ? C.green700 : C.line}`,
            }}
          >
            Todas as empresas
          </button>
          {empresasDisponiveis.map((id) => (
            <button
              key={id}
              onClick={() => setFiltroCliente(id)}
              className="px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0"
              style={{
                background: filtroCliente === id ? C.green700 : C.cardAlt,
                color: filtroCliente === id ? "#fff" : C.ink,
                border: `1px solid ${filtroCliente === id ? C.green700 : C.line}`,
              }}
            >
              {nomeCliente(id)}
            </button>
          ))}
        </div>
      )}

      {setRecibo && (
        <Card
          className="mb-4"
          style={{ background: jaFinalizadoHoje ? C.cardAlt : podeFinalizarHoje ? C.green700 : C.cardAlt }}
        >
          <div
            className="text-sm font-bold mb-1"
            style={{ color: jaFinalizadoHoje ? C.green700 : podeFinalizarHoje ? "#fff" : C.ink }}
          >
            {jaFinalizadoHoje ? "✅ Conferência de Hoje Finalizada" : "Finalizar Conferência de Hoje"}
          </div>
          <div
            className="text-xs mb-3"
            style={{ color: podeFinalizarHoje ? "rgba(255,255,255,0.75)" : C.inkSoft }}
          >
            {jaFinalizadoHoje
              ? "Os documentos já foram gerados hoje. Se excluir ou adicionar compras depois disso, baixe de novo manualmente pela Requisição."
              : comprasHoje.length === 0
              ? "Nenhuma compra registrada hoje ainda."
              : podeFinalizarHoje
              ? `${comprasHoje.length} compra(s) já conferida(s). Pronto pra finalizar.`
              : `Faltam ${pendentesHoje.length} compra(s) pra conferir hoje.`}
          </div>
          {!jaFinalizadoHoje && (
            <button
              onClick={finalizarConferencia}
              disabled={!podeFinalizarHoje}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm"
              style={{
                background: podeFinalizarHoje ? C.amber500 : "#3A4A41",
                color: podeFinalizarHoje ? C.green900 : C.inkSoft,
              }}
            >
              <ClipboardCheck size={16} />
              Finalizar e Gerar Documentos
            </button>
          )}
          {!jaFinalizadoHoje && (
            <div className="text-xs mt-2" style={{ color: podeFinalizarHoje ? "rgba(255,255,255,0.6)" : C.inkSoft }}>
              Gera a Folha de Pedido de todos os clientes do dia + os Vales dos clientes que pagam PIX ou Dinheiro (sem boleto). Só funciona quando tudo estiver conferido, e só roda uma vez por dia.
            </div>
          )}
        </Card>
      )}

      <SectionTitle icon={ClipboardCheck}>A conferir</SectionTitle>
      {pendentes.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            {soMeuNome
              ? "Nenhuma compra pendente atribuída a você."
              : "Nenhuma compra pendente de conferência."}
          </p>
        </Card>
      ) : (
        (() => {
          const gruposPendentes = agruparPorCliente(pendentes);
          const forcarUnico = gruposPendentes.length === 1 ? gruposPendentes[0].id : null;
          return gruposPendentes.map((grupo) => (
            <GrupoClienteBloco
              key={grupo.id}
              grupo={grupo}
              expandido={forcarUnico || expandidoPendente}
              onToggle={setExpandidoPendente}
            />
          ));
        })()
      )}

      <SectionTitle icon={Check}>Conferidas</SectionTitle>
      <Field label="Ver conferidas do dia">
        <TextInput
          type="date"
          value={dataConferidas}
          onChange={(e) => setDataConferidas(e.target.value)}
          max={todayISO()}
        />
      </Field>
      {confirmadas.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Nenhuma compra conferida em {fmtDate(dataConferidas)}.
          </p>
        </Card>
      ) : (
        (() => {
          const gruposConferidas = agruparPorCliente(confirmadas);
          const forcarUnico = gruposConferidas.length === 1 ? gruposConferidas[0].id : null;
          return gruposConferidas.map((grupo) => (
            <GrupoClienteBloco
              key={grupo.id}
              grupo={grupo}
              expandido={forcarUnico || expandidoConferida}
              onToggle={setExpandidoConferida}
            />
          ));
        })()
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
              {[...cadastros.produtos].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR")).map((p) => (
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
                min="0"
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
            <PrimaryButton onClick={salvar} icon={AlertTriangle} disabled={!produto || !quantidade || Number(quantidade) <= 0}>
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
function DiagnosticoPlanilha({ cadastros, persistCadastros, transacoes, persistTransacoes }) {
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const rodarTesteGenerico = async ({ tipo, campo, montarValor }) => {
    setRodando(true);
    setResultado(null);
    const linhas = [];
    const marcador = "DIAG_" + Date.now();

    try {
      linhas.push(`1) Enviando gravação de teste em "${tipo}.${campo}"...`);
      const resPost = await fetch("/api/dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tipo,
          data: montarValor(marcador),
        }),
      });
      const jsonPost = await resPost.json().catch(() => null);
      linhas.push(`   Status HTTP: ${resPost.status}`);
      linhas.push(`   Resposta: ${JSON.stringify(jsonPost)}`);

      linhas.push("");
      linhas.push("2) Lendo de volta pra conferir se gravou...");
      const resGet = await fetch("/api/dados");
      const jsonGet = await resGet.json().catch(() => null);
      const achou = jsonGet?.[tipo]?.[campo]?.some((p) => p.id === marcador);
      linhas.push(`   Status HTTP: ${resGet.status}`);
      linhas.push(`   Marcador de teste encontrado na leitura? ${achou ? "SIM ✅" : "NÃO ❌"}`);

      if (achou) {
        linhas.push("");
        linhas.push(`Tudo funcionando! A gravação em "${tipo}.${campo}" chegou na planilha.`);
      } else {
        linhas.push("");
        linhas.push(
          `A gravação em "${tipo}.${campo}" NÃO chegou na planilha. Se o teste de "produtos" funcionar mas este falhar, é sinal de que o backend (/api/dados) ainda não tem uma coluna/aba mapeada pra "${campo}" dentro de "${tipo}" — precisa adicionar isso no código do servidor, não dá pra corrigir só pelo app.`
        );
      }
    } catch (e) {
      linhas.push(`ERRO durante o teste: ${(e && e.message) || String(e)}`);
    }

    setResultado(linhas.join("\n"));
    setRodando(false);
  };

  const testarProdutos = () =>
    rodarTesteGenerico({
      tipo: "cadastros",
      campo: "produtos",
      montarValor: (marcador) => ({
        ...cadastros,
        produtos: [...cadastros.produtos, { id: marcador, nome: marcador }],
      }),
    });

  const testarEquipe = () =>
    rodarTesteGenerico({
      tipo: "cadastros",
      campo: "compradoresVendedores",
      montarValor: (marcador) => ({
        ...cadastros,
        compradoresVendedores: [
          ...normalizarEquipe(cadastros.compradoresVendedores),
          { id: marcador, nome: marcador, funcao: "conferente", clienteId: "" },
        ],
      }),
    });

  const testarPagamentos = () =>
    rodarTesteGenerico({
      tipo: "transacoes",
      campo: "pagamentos",
      montarValor: (marcador) => ({
        ...transacoes,
        pagamentos: [
          ...transacoes.pagamentos,
          { id: marcador, data: todayISO(), produtorId: "DIAG", valor: 1, tipo: "pagamento", formaPagamento: "PIX", obs: "" },
        ],
      }),
    });

  return (
    <div>
      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
        Testa se o app consegue escrever e reler da planilha, sem depender de
        cadastrar nada de verdade.
      </p>
      <button
        onClick={testarProdutos}
        disabled={rodando}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-2"
        style={{ background: C.amber500, color: C.green900, fontFamily: displayFont, fontWeight: 800 }}
      >
        {rodando ? "Testando…" : "Testar Gravação de Produtos"}
      </button>
      <button
        onClick={testarEquipe}
        disabled={rodando}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-2"
        style={{ background: C.blue600, color: "#fff", fontFamily: displayFont, fontWeight: 800 }}
      >
        {rodando ? "Testando…" : "Testar Gravação de Equipe (conferente/cargueiro)"}
      </button>
      <button
        onClick={testarPagamentos}
        disabled={rodando}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-bold text-sm mb-3"
        style={{ background: C.rust, color: "#fff", fontFamily: displayFont, fontWeight: 800 }}
      >
        {rodando ? "Testando…" : "Testar Gravação de Pagamentos"}
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

function GerenciarAcessoView({ cadastros, persistCadastros, transacoes, persistTransacoes, showToast }) {
  const [novoNome, setNovoNome] = useState("");
  const [novaFuncao, setNovaFuncao] = useState("gestor");
  const [novaEmpresa, setNovaEmpresa] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("acesso");
  const equipe = normalizarEquipe(cadastros.compradoresVendedores);

  const rotuloFuncao = { gestor: "Comprador/Vendedor", conferente: "Conferente", entregador: "Entregador" };
  const nomeEmpresa = (clienteId) => cadastros.clientes.find((c) => c.id === clienteId)?.nome || "";

  const adicionar = async () => {
    const nome = novoNome.trim();
    if (!nome) return;
    const jaExiste = equipe.some(
      (e) => e.nome.trim().toLowerCase() === nome.toLowerCase() && e.funcao === novaFuncao
    );
    if (jaExiste) {
      showToast("Essa pessoa já está cadastrada nessa função");
      return;
    }
    const novo = {
      id: uid(),
      nome,
      funcao: novaFuncao,
      clienteId: novaFuncao === "gestor" ? "" : novaEmpresa,
    };
    await persistCadastros({ ...cadastros, compradoresVendedores: [...equipe, novo] });
    setNovoNome("");
    setNovaEmpresa("");
    showToast("Adicionado à equipe");
  };

  const remover = async (id) => {
    await persistCadastros({
      ...cadastros,
      compradoresVendedores: equipe.filter((e) => e.id !== id),
    });
    showToast("Removido da equipe");
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
        <DiagnosticoPlanilha
          cadastros={cadastros}
          persistCadastros={persistCadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
        />
      )}

      {abaAtiva === "acesso" && (
        <>
          <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
            Cadastre aqui todo mundo que usa o app: Comprador/Vendedor (acesso
            completo), Conferente e Entregador. Só o Comprador/Vendedor precisa
            estar na lista pra conseguir entrar — Conferente e Entregador
            digitam o nome livremente, mas cadastrar eles aqui já vincula a
            empresa que atendem, pra não precisar escolher toda vez na compra.
          </p>
          <Card className="mb-3">
            <Field label="Nome">
              <TextInput
                placeholder="Ex: Marcos"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
            </Field>
            <Field label="Função">
              <Select value={novaFuncao} onChange={(e) => { setNovaFuncao(e.target.value); setNovaEmpresa(""); }}>
                <option value="gestor">Comprador/Vendedor</option>
                <option value="conferente">Conferente</option>
                <option value="entregador">Entregador</option>
              </Select>
            </Field>
            {(novaFuncao === "conferente" || novaFuncao === "entregador") && (
              <Field label="Empresa que atende (opcional)">
                <Select value={novaEmpresa} onChange={(e) => setNovaEmpresa(e.target.value)}>
                  <option value="">Nenhuma fixa — escolher toda vez</option>
                  {[...cadastros.clientes]
                    .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                </Select>
                <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
                  Vinculando uma empresa, esse conferente já aparece automático nas
                  compras feitas pra ela — sem precisar clicar toda vez.
                </div>
              </Field>
            )}
            <button
              className="w-full px-3 py-2.5 rounded-lg font-bold text-sm mt-1"
              style={{ background: C.amber500, color: C.green900 }}
              onClick={adicionar}
            >
              + Adicionar à Equipe
            </button>
          </Card>

          {equipe.length === 0 ? (
            <Card>
              <p className="text-sm" style={{ color: C.inkSoft }}>
                Ninguém cadastrado ainda — o próximo que entrar como
                Comprador/Vendedor vira o primeiro autorizado automaticamente.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {equipe.map((e) => (
                <Card key={e.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} style={{ color: C.green700 }} />
                    <div>
                      <span className="font-bold text-sm">{e.nome}</span>
                      <div className="text-xs" style={{ color: C.inkSoft }}>
                        {rotuloFuncao[e.funcao] || e.funcao}
                        {e.clienteId ? ` · ${nomeEmpresa(e.clienteId)}` : ""}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => remover(e.id)} style={{ color: C.rust }}>
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
/* ---------------------------------------------------------------------- */
/* Edição de cadastro existente — Cliente e Produtor                      */
/* ---------------------------------------------------------------------- */
function EditarCliente({ cliente, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(cliente.nome || "");
  const [cidade, setCidade] = useState(cliente.cidade || "");
  const [limiteCredito, setLimiteCredito] = useState(String(cliente.limiteCredito || ""));
  const [pagamento, setPagamento] = useState(cliente.pagamento || "BOLETO");
  const [temDescontoFundoRural, setTemDescontoFundoRural] = useState(!!cliente.temDescontoFundoRural);

  return (
    <div className="mt-2 rounded-lg p-3" style={{ background: C.cardAlt, border: `1px solid ${C.line}` }} onClick={(e) => e.stopPropagation()}>
      <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.amber500 }}>
        Editando Cliente
      </div>
      <Field label="Nome do cliente">
        <TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
      </Field>
      <Field label="Cidade">
        <TextInput value={cidade} onChange={(e) => setCidade(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Limite de Crédito (R$)">
          <TextInput
            type="number"
            inputMode="decimal"
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
      <div className="mb-3 p-2 rounded" style={{ background: C.amberSoft }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={temDescontoFundoRural}
            onChange={(e) => setTemDescontoFundoRural(e.target.checked)}
          />
          <span style={{ color: C.ink, fontSize: "14px" }}>📋 Aplica Desconto Fundo Rural (1.63%)?</span>
        </label>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm"
          style={{ background: C.amber500, color: C.green900 }}
          onClick={() => {
            if (!nome.trim()) return;
            onSalvar({
              id: cliente.id,
              codigo: cliente.codigo,
              nome: nome.trim(),
              cidade: cidade.trim(),
              limiteCredito: Number(limiteCredito) || 0,
              pagamento,
              temDescontoFundoRural,
            });
          }}
        >
          Salvar Alterações
        </button>
        <button className="px-3 rounded-lg" style={{ color: C.inkSoft }} onClick={onCancelar}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

function EditarProdutor({ produtor, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(produtor.nome || "");
  const [cidade, setCidade] = useState(produtor.cidade || "");
  const [telefone, setTelefone] = useState(produtor.telefone || "");
  const [temCNPJ, setTemCNPJ] = useState(!!produtor.temCNPJ);
  const [temDescontoFundoRural, setTemDescontoFundoRural] = useState(!!produtor.temDescontoFundoRural);
  const [pagamento, setPagamento] = useState(produtor.pagamento || "DINHEIRO");
  const [chavePix, setChavePix] = useState(produtor.chavePix || "");

  return (
    <Card style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
      <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: C.amber500 }}>
        Editando Produtor
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Field label="Nome do Produtor">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </Field>
        <Field label="Cidade">
          <TextInput value={cidade} onChange={(e) => setCidade(e.target.value)} />
        </Field>
        <Field label="Telefone">
          <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} />
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
        </div>
        <Field label="Forma de Pagamento">
          <Select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
            <option value="BOLETO">Boleto</option>
            <option value="PIX">PIX</option>
            <option value="DINHEIRO">Dinheiro</option>
          </Select>
        </Field>
        {pagamento !== "BOLETO" && (
          <Field label="Chave Pix">
            <TextInput
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
            />
          </Field>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 px-3 py-2.5 rounded-lg font-bold text-sm"
          style={{ background: C.amber500, color: C.green900 }}
          onClick={() => {
            if (!nome.trim()) return;
            onSalvar({
              id: produtor.id,
              codigo: produtor.codigo,
              nome: nome.trim(),
              cidade: cidade.trim(),
              telefone: telefone.trim(),
              temCNPJ,
              temDescontoFundoRural,
              pagamento,
              chavePix: chavePix.trim(),
            });
          }}
        >
          Salvar Alterações
        </button>
        <button onClick={onCancelar} style={{ color: C.inkSoft }}>
          <X size={18} />
        </button>
      </div>
    </Card>
  );
}

function ContaCorrenteTab({ contaClientes, contaProdutores, transacoes, cadastros, persistCadastros, persistTransacoes, showToast, setRecibo }) {
  const [view, setView] = useState("clientes");
  const [expanded, setExpanded] = useState(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [editandoProdutorId, setEditandoProdutorId] = useState(null);

  const addCliente = async (dados) => {
    const novo = { id: uid(), codigo: Date.now() % 100000, ...dados };
    const next = { ...cadastros, clientes: [...cadastros.clientes, novo] };
    await persistCadastros(next);
    setNovoOpen(false);
    if (showToast) showToast("Cliente cadastrado");
  };

  const editarCliente = async (dadosAtualizados) => {
    const next = {
      ...cadastros,
      clientes: cadastros.clientes.map((c) => (c.id === dadosAtualizados.id ? dadosAtualizados : c)),
    };
    await persistCadastros(next);
    setEditandoClienteId(null);
    if (showToast) showToast("Cliente atualizado");
  };

  const editarProdutor = async (dadosAtualizados) => {
    const next = {
      ...cadastros,
      produtores: cadastros.produtores.map((p) => (p.id === dadosAtualizados.id ? dadosAtualizados : p)),
    };
    await persistCadastros(next);
    setEditandoProdutorId(null);
    if (showToast) showToast("Produtor atualizado");
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
        <GerenciarAcessoView
          cadastros={cadastros}
          persistCadastros={persistCadastros}
          transacoes={transacoes}
          persistTransacoes={persistTransacoes}
          showToast={showToast}
        />
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
                <>
                  <ExtratoCliente clienteId={c.id} transacoes={transacoes} setRecibo={setRecibo} />
                  {editandoClienteId === c.id ? (
                    <EditarCliente
                      cliente={c}
                      onSalvar={editarCliente}
                      onCancelar={(e) => {
                        e?.stopPropagation?.();
                        setEditandoClienteId(null);
                      }}
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditandoClienteId(c.id);
                      }}
                      className="text-xs font-bold mt-2"
                      style={{ color: C.amber500 }}
                    >
                      ✏️ Editar Cadastro
                    </button>
                  )}
                </>
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
                <>
                  <ExtratoProdutor produtorId={p.id} transacoes={transacoes} setRecibo={setRecibo} />
                  {editandoProdutorId === p.id ? (
                    <EditarProdutor
                      produtor={p}
                      onSalvar={editarProdutor}
                      onCancelar={(e) => {
                        e?.stopPropagation?.();
                        setEditandoProdutorId(null);
                      }}
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditandoProdutorId(p.id);
                      }}
                      className="text-xs font-bold mt-2"
                      style={{ color: C.amber500 }}
                    >
                      ✏️ Editar Cadastro
                    </button>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function badgeStatusInfo(status) {
  if (status === "pago") return { label: "Pago", bg: C.green700, fg: "#fff" };
  if (status === "vencido") return { label: "Vencido", bg: C.rust, fg: "#fff" };
  return { label: "A vencer", bg: C.amber500, fg: "#1a1a1a" };
}

function LinhaDebito({ d, rotuloTipo, tipoRecibo, setRecibo }) {
  const info = badgeStatusInfo(d.status);
  const clicavel = Boolean(setRecibo && d.id && tipoRecibo);
  return (
    <div
      className="rounded-lg p-2 mb-1.5"
      style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
      onClick={
        clicavel
          ? (e) => {
              e.stopPropagation();
              setRecibo({ tipo: tipoRecibo, item: d });
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs" style={{ color: C.inkSoft, textDecoration: clicavel ? "underline" : "none" }}>
          {fmtDate(d.data)} · {rotuloTipo}
          {clicavel && " (ver vale)"}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full uppercase"
          style={{ background: info.bg, color: info.fg, flexShrink: 0 }}
        >
          {info.label}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs" style={{ color: C.inkSoft }}>
          {d.status === "pago"
            ? d.dataQuitacao
              ? `Quitado em ${fmtDate(d.dataQuitacao)}${d.tipoQuitacao === "ajuste" ? " (via desconto)" : d.tipoQuitacao === "misto" ? " (pgto + desconto)" : ""}`
              : "Quitado"
            : d.status === "vencido"
            ? `Vencido há ${d.diasDesde - PRAZO_VENCIMENTO_DIAS} dia(s)`
            : `Vence em ${d.diasParaVencer} dia(s)`}
        </span>
        <span style={{ fontFamily: monoFont, fontWeight: 700, color: C.ink }}>{fmtMoney(d.valor)}</span>
      </div>
      {!d.pago && d.saldoAberto < d.valor && (
        <div className="text-xs mt-0.5" style={{ color: C.amber500 }}>
          Parcialmente coberto — falta {fmtMoney(d.saldoAberto)}
        </div>
      )}
    </div>
  );
}

function ListaPagamentos({ pagamentos, rotuloPagamento }) {
  if (pagamentos.length === 0) return null;
  const ordenados = [...pagamentos].sort((a, b) => (a.data < b.data ? 1 : -1));
  return (
    <div className="mt-3 pt-2 border-t" style={{ borderColor: C.line }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
        Histórico de {rotuloPagamento}
      </div>
      {ordenados.map((p, i) => (
        <div key={p.id || i} className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: C.inkSoft }}>
            {fmtDate(p.data)} ·{" "}
            {p.tipo === "ajuste" ? "Desconto/Ajuste" : p.formaPagamento || "Pagamento"}
            {p.obs ? ` · ${p.obs}` : ""}
          </span>
          <span style={{ fontFamily: monoFont, fontWeight: 700, color: p.tipo === "ajuste" ? C.amber500 : C.green700 }}>
            −{fmtMoney(p.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ExtratoCliente({ clienteId, transacoes, setRecibo }) {
  const vendasCliente = transacoes.vendas
    .filter((v) => v.clienteId === clienteId)
    .map((v) => ({ ...v, valor: v.valorFinal ?? v.valorTotal }));
  const recebimentosCliente = transacoes.recebimentos.filter((r) => r.clienteId === clienteId);

  if (vendasCliente.length === 0 && recebimentosCliente.length === 0) {
    return (
      <p className="text-xs mt-2 pt-2 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>
        Sem lançamentos.
      </p>
    );
  }

  const debitosComStatus = calcularStatusPagamentos(vendasCliente, recebimentosCliente, todayISO()).sort(
    (a, b) => (a.data < b.data ? 1 : -1)
  );

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: C.line }}>
      {debitosComStatus.map((d) => (
        <LinhaDebito key={d.id} d={d} rotuloTipo="Venda" tipoRecibo="venda" setRecibo={setRecibo} />
      ))}
      <ListaPagamentos pagamentos={recebimentosCliente} rotuloPagamento="Recebimentos" />
    </div>
  );
}

function ExtratoProdutor({ produtorId, transacoes, setRecibo }) {
  const comprasProdutor = transacoes.compras
    .filter((c) => c.produtorId === produtorId)
    .map((c) => ({ ...c, valor: c.valorFinal ?? c.valorTotal }));
  const pagamentosProdutor = transacoes.pagamentos.filter((p) => p.produtorId === produtorId);

  if (comprasProdutor.length === 0 && pagamentosProdutor.length === 0) {
    return (
      <p className="text-xs mt-2 pt-2 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>
        Sem lançamentos.
      </p>
    );
  }

  const debitosComStatus = calcularStatusPagamentos(comprasProdutor, pagamentosProdutor, todayISO()).sort(
    (a, b) => (a.data < b.data ? 1 : -1)
  );

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: C.line }}>
      {debitosComStatus.map((d) => (
        <LinhaDebito key={d.id} d={d} rotuloTipo="Compra" tipoRecibo="compra" setRecibo={setRecibo} />
      ))}
      <ListaPagamentos pagamentos={pagamentosProdutor} rotuloPagamento="Pagamentos" />
    </div>
  );
}
