import Head from 'next/head'
import { useState } from 'react'
import { LayoutGrid, PlusCircle, Package, Wallet, ArrowDownCircle, ArrowUpCircle, UserCheck, Receipt, Truck, Clipboard, Landmark, Calendar, FileText } from 'lucide-react'

// Paleta oficial de cores extraída diretamente do seu guia de design
const C = {
  bg: "#0B1F17",           // Fundo base profundo
  bgElev: "#112E24",       // Fundo elevado
  card: "#153B2D",         // Cor oficial dos cards
  verde: "#00E676",        // Verde vibrante de sucesso / compras
  verdeEscuro: "#009E5A",  // Variação de verde para títulos
  azul: "#00B0FF",         // Azul vibrante de faturamento / ações
  amarelo: "#FFC107",      // Amarelo para caixas compradas
  laranja: "#FF8A00",      // Laranja para a receber / alertas
  vermelho: "#FF5252",     // Vermelho para perda
  texto: "#E8F5E9",        // Cor do texto principal
  textoSec: "#A5D6A7",     // Cor do texto secundário
  borda: "rgba(255,255,255,0.06)" // Borda fina oficial
}

const fontStack = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState('hoje')
  const [tipoRegistro, setTipoRegistro] = useState('compra')

  return (
    <div 
      style={{ 
        backgroundImage: `radial-gradient(120% 100% at 10% -10%, #113327 0%, ${C.bg} 60%)`,
        color: C.texto, 
        fontFamily: fontStack 
      }} 
      className="min-h-screen flex flex-col justify-between antialiased pb-24"
    >
      <Head>
        <title>GAC CEASA</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ----------------- HEADER (Design Oficial) ----------------- */}
      <header 
        style={{ 
          background: "linear-gradient(90deg, rgba(21,59,45,0.85), rgba(11,31,23,0.95))",
          borderColor: C.borda,
          backdropFilter: "blur(6px)",
          position: "sticky",
          top: 0,
          zIndex: 10
        }} 
        className="p-4 border-b flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          {/* Logo Container com gradiente oficial */}
          <div 
            style={{ 
              background: "linear-gradient(145deg, #145deg, #1E2D22, #0D1C14)",
              borderColor: C.borda,
              boxShadow: "0 0 3px rgba(0,0,0,0.3)"
            }} 
            className="w-12 h-12 rounded-xl border flex flex-col items-center justify-center leading-none select-none"
          >
            <span className="text-[14px] font-black tracking-tighter" style={{ color: C.azul }}>GAC</span>
            <span className="text-[9px] font-black tracking-widest" style={{ color: C.verde }}>CEASA</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white m-0 uppercase">GAC CEASA</h1>
            <span className="text-[10px] block font-semibold tracking-wider uppercase" style={{ color: C.textoSec }}>
              CEASA MANAGER • PÁTIO
            </span>
          </div>
        </div>

        {/* Bloco Usuário Oficial */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <strong className="text-xs block text-white">CLAYTON 05564849914</strong>
            <span className="text-[10px] font-bold uppercase cursor-pointer" style={{ color: C.verde }}>Trocar</span>
          </div>
          <div 
            style={{ 
              background: "linear-gradient(135deg, var(--verde), var(--azul))",
              backgroundColor: C.verde,
              boxShadow: "0 0 0 3px rgba(0,230,118,0.15)"
            }} 
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-black"
          >
            CM
          </div>
        </div>
      </header>

      {/* ----------------- CONTEÚDO (Telas Pretendidas) ----------------- */}
      <main className="p-4 flex-grow max-w-md mx-auto w-full">

        {/* TELA: HOJE */}
        {abaAtiva === 'hoje' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Hoje no Pátio</h2>
            <p className="text-xs -mt-3 opacity-60">16/08/2026</p>

            {/* Seletor de Data */}
            <div style={{ backgroundColor: C.card, borderColor: C.borda }} className="p-3 rounded-xl border flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 opacity-80"><Calendar className="w-4 h-4" /> SELECIONE A DATA</span>
              <span className="text-white">16 de ago. de 2026</span>
            </div>

            {/* Caixa Compradas / Vendidas */}
            <div className="grid grid-cols-2 gap-3">
              <div style={{ backgroundColor: C.card, borderColor: C.borda }} className="p-4 rounded-2xl border relative overflow-hidden shadow-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: C.textoSec }}>📦 CX COMPRADAS</span>
                <span className="text-3xl font-black block my-1" style={{ color: C.amarelo }}>139</span>
                <span className="text-[9px]" style={{ color: C.textoSec }}>16/08/2026</span>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: C.amarelo }}></div>
              </div>
              <div style={{ backgroundColor: C.card, borderColor: C.borda }} className="p-4 rounded-2xl border relative overflow-hidden shadow-lg">
                <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: C.textoSec }}>🛒 CX VENDIDAS</span>
                <span className="text-3xl font-black block my-1" style={{ color: C.verde }}>20</span>
                <span className="text-[9px]" style={{ color: C.textoSec }}>16/08/2026</span>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: C.verde }}></div>
              </div>
            </div>

            {/* Indicadores Financeiros em Grid de Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div style={{ backgroundColor: C.amarelo }} className="p-4 rounded-xl shadow-md text-black flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider block opacity-70">FATURAMENTO HOJE</span>
                  <span className="text-2xl font-black">R$ 120</span>
                </div>
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>

              <div style={{ backgroundColor: C.card, borderColor: C.borda }} className="p-4 rounded-xl border flex justify-between items-center shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: C.textoSec }}>🛒 COMPRAS HOJE</span>
                  <span className="text-xl font-black text-white">R$ 7.950</span>
                </div>
                <PlusCircle className="w-6 h-6" style={{ color: C.textoSec }} />
              </div>

              <div style={{ backgroundColor: C.amarelo }} className="p-4 rounded-xl shadow-md text-black flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider block opacity-70">LUCRO BRUTO HOJE</span>
                  <span className="text-2xl font-black">R$ 120</span>
                </div>
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>

              <div style={{ backgroundColor: C.laranja }} className="p-4 rounded-xl shadow-md text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider block opacity-80">A RECEBER</span>
                  <span className="text-2xl font-black">R$ 122</span>
                </div>
                <Wallet className="w-6 h-6 opacity-80" />
              </div>

              <div style={{ backgroundColor: C.card, borderColor: C.borda }} className="p-4 rounded-xl border relative overflow-hidden shadow-md">
                <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: C.textoSec }}>📉 PERDA HOJE</span>
                <span className="text-lg font-black block mt-1" style={{ color: C.vermelho }}>R$ 0</span>
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: C.vermelho }}></div>
              </div>
            </div>
          </div>
        )}

        {/* TELA: REGISTRAR */}
        {abaAtiva === 'registrar' && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white tracking-tight">REGISTRAR</h2>
            <p className="text-xs -mt-3" style={{ color: C.textoSec }}>Escolha uma opção abaixo</p>

            {/* Menu de Operações Principais */}
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <button onClick={() => setTipoRegistro('compra')} style={{ backgroundColor: C.card, borderColor: tipoRegistro === 'compra' ? C.verde : C.borda }} className="p-4 rounded-xl border flex flex-col gap-2 text-left relative shadow-md">
                <ArrowDownCircle className="w-5 h-5" style={{ color: C.verde }} />
                <span className="text-white text-sm">Compra</span>
              </button>
              <button onClick={() => setTipoRegistro('venda')} style={{ backgroundColor: C.card, borderColor: tipoRegistro === 'venda' ? C.azul : C.borda }} className="p-4 rounded-xl border flex flex-col gap-2 text-left relative shadow-md">
                <ArrowUpCircle className="w-5 h-5" style={{ color: C.azul }} />
                <span className="text-white text-sm">Venda</span>
              </button>