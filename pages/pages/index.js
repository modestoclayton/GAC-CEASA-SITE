import Head from 'next/head'
import { useState } from 'react'
import { Package, ShoppingCart, TrendingUp, ClipboardCheck } from 'lucide-react'

// Objeto de cores oficial atualizado com a paleta da sua logo GAC-CEASA
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
  amber500: "#E0A526",    
  amber600: "#C48A16",    
  amberSoft: "#3A2E12",   
  rust: "#E0632E",        
  rustSoft: "#3A1C12",    
  twine: "#1E293B",       
  line: "#1F2937",        
  blue600: "#0076FF",     // Azul vibrante oficial da letra 'G' para a seção de clientes
};

const displayFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const monoFont = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/* ---------------------------------------------------------------------- */
/* Helpers de Formatação e IDs                                            */
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

export default function Home() {
  const [telaAtiva, setTelaAtiva] = useState('painel');

  return (
    <div style={{ backgroundColor: C.canvas, color: C.ink, fontFamily: displayFont }} className="min-h-screen flex flex-col justify-between antialiased">
      <Head>
        <title>GAC - CEASA</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOPO: Logotipo Oficial Baseado na sua Identidade */}
      <header className="w-full text-center pt-8 select-none">
        <div className="text-5xl font-black tracking-wider uppercase mb-1">
          <span style={{ color: C.blue600 }}>G</span>
          <span style={{ color: C.ink }}>A</span>
          <span style={{ color: C.green600 }}>C</span>
        </div>
        <div style={{ color: C.inkSoft }} className="text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
          <span style={{ color: C.green600 }}>—</span> CEASA <span style={{ color: C.green600 }}>—</span>
        </div>
      </header>

      {/* CENTRO: Bloco Principal Prontinho para o seu Visual Novo */}
      <main className="w-full max-w-4xl mx-auto px-6 py-6 flex-grow flex flex-col justify-center">
        <div style={{ backgroundColor: C.card, borderColor: C.line }} className="w-full border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Linha com o degradê oficial da marca */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundImage: `linear-gradient(to right, ${C.blue600}, ${C.ink}, ${C.green600})` }}></div>
          
          <div className="flex justify-between items-center border-b pb-4 mb-6" style={{ borderColor: C.line }}>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide">Painel de Controle</h2>
              <p style={{ color: C.inkSoft }} className="text-xs">Gerenciamento Logístico de Hortifrúti</p>
            </div>
            <span style={{ backgroundColor: `${C.blue600}20`, color: C.blue600, borderColor: `${C.blue600}40` }} className="px-2.5 py-0.5 border text-[10px] font-semibold rounded-full uppercase tracking-wider animate-pulse">
              Sistema Ativo
            </span>
          </div>

          <p style={{ color: C.inkSoft }} className="text-sm text-center py-12">
            A pasta <span className="font-mono text-white">pages/</span> foi reconstruída com sucesso! Use o menu inferior para navegar.
          </p>
        </div>
      </main>

      {/* MENU INFERIOR: Os 4 Ícones Funcionais Mapeados */}
      <footer style={{ backgroundColor: C.card, borderColor: C.line }} className="w-full border-t py-4 px-4">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <button onClick={() => setTelaAtiva('estoque')} className="flex flex-col items-center justify-center p-2 rounded-xl transition-all" style={{ color: telaAtiva === 'estoque' ? C.green600 : C.inkSoft }}>
            <Package className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[9px] uppercase font-bold mt-1">Estoque</span>
          </button>
          <button onClick={() => setTelaAtiva('vendas')} className="flex flex-col items-center justify-center p-2 rounded-xl transition-all" style={{ color: telaAtiva === 'vendas' ? C.blue600 : C.inkSoft }}>
            <ShoppingCart className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[9px] uppercase font-bold mt-1">Vendas</span>
          </button>
          <button onClick={() => setTelaAtiva('painel')} className="flex flex-col items-center justify-center p-2 rounded-xl transition-all" style={{ color: telaAtiva === 'painel' ? C.green600 : C.inkSoft }}>
            <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[9px] uppercase font-bold mt-1">Painel</span>
          </button>
          <button onClick={() => setTelaAtiva('pedidos')} className="flex flex-col items-center justify-center p-2 rounded-xl transition-all" style={{ color: telaAtiva === 'pedidos' ? C.ink : C.inkSoft }}>
            <ClipboardCheck className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[9px] uppercase font-bold mt-1">Pedidos</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

