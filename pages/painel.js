import Head from 'next/head'
import { Package, ShoppingCart, TrendingUp, ClipboardCheck } from 'lucide-react'

export default function PainelGac() {
  return (
    <div className="min-h-screen bg-gac-fundo text-gac-prata font-sans antialiased flex flex-col justify-between">
      <Head>
        <title>Painel GAC - CEASA</title>
        {/* Como os arquivos estão na raiz no seu GitHub, chamamos com o caminho relativo correto */}
        <link rel="icon" href="../favicon.ico" />
        <link rel="stylesheet" href="../gac-colors.css" />
      </Head>

      {/* 1. TOPO: Cabeçalho com a Identidade Visual da sua Logo */}
      <header className="w-full max-w-6xl mx-auto pt-12 px-6 text-center select-none">
        <div className="flex items-center justify-center text-5xl md:text-7xl font-black tracking-wider uppercase mb-2">
          <span className="text-gac-azul">G</span>
          <span className="text-gac-prata">A</span>
          <span className="text-gac-verde">C</span>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-xl md:text-2xl font-bold tracking-widest text-gac-prata uppercase">
          <span className="text-gac-verde">—</span>
          <span>CEASA</span>
          <span className="text-gac-verde">—</span>
        </div>
      </header>

      {/* 2. CENTRO: Conteúdo Principal / Grid de Informações */}
      <main className="w-full max-w-5xl mx-auto px-6 py-8 flex-grow flex flex-col items-center justify-center">
        <div className="w-full bg-gac-card border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-gac-neon transition-all duration-500">
          
          {/* Linha com efeito degradê no topo do painel baseado na logo */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gac-azul via-gac-prata to-gac-verde"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Painel Operacional</h2>
              <p className="text-sm text-gray-400">Visão geral do fluxo logístico de hortifrúti</p>
            </div>
            <span className="mt-2 md:mt-0 px-3 py-1 bg-gac-azul/10 text-gac-azul border border-gac-azul/20 text-xs font-semibold rounded-full uppercase tracking-wider animate-pulse">
              Sistema Online
            </span>
          </div>

          {/* Cards internos que vão consumir os dados da sua API futuramente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#060B11]/50 p-4 rounded-xl border border-gray-900">
              <span className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Entrada de Cargas</span>
              <span className="text-2xl font-bold text-white">14 Caminhões</span>
            </div>
            <div className="bg-[#060B11]/50 p-4 rounded-xl border border-gray-900">
              <span className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Giro de Estoque</span>
              <span className="text-2xl font-bold text-gac-verde">84.2%</span>
            </div>
            <div className="bg-[#060B11]/50 p-4 rounded-xl border border-gray-900">
              <span className="text-xs text-gray-400 block mb-1 uppercase tracking-wider">Pedidos Hoje</span>
              <span className="text-2xl font-bold text-gac-azul">192 Atendidos</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RODAPÉ: Menu com os 4 Ícones oficiais da base da sua Logo */}
      <footer className="w-full bg-gac-card border-t border-gray-900 py-6 px-4">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          
          {/* Ícone 1: Caixa (Estoque / Logística) */}
          <button className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-[#060B11] text-gray-400 hover:text-gac-verde transition-all duration-300 group">
            <Package className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5 opacity-60 group-hover:opacity-100">Estoque</span>
          </button>

          {/* Ícone 2: Carrinho (Vendas / Mercado) */}
          <button className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-[#060B11] text-gray-400 hover:text-gac-azul transition-all duration-300 group">
            <ShoppingCart className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5 opacity-60 group-hover:opacity-100">Vendas</span>
          </button>

          {/* Ícone 3: Gráfico (Estatísticas e Gráficos de Crescimento) */}
          <button className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-[#060B11] text-gray-400 hover:text-gac-verde transition-all duration-300 group">
            <TrendingUp className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5 opacity-60 group-hover:opacity-100">Painel</span>
          </button>

          {/* Ícone 4: Relatório Prancheta (Pedidos / Notas Fiscais) */}
          <button className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-[#060B11] text-gray-400 hover:text-gac-prata transition-all duration-300 group">
            <ClipboardCheck className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            <span className="text-[10px] uppercase font-bold tracking-wider mt-1.5 opacity-60 group-hover:opacity-100">Pedidos</span>
          </button>

        </div>
      </footer>
    </div>
  )
}
