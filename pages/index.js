import dynamic from "next/dynamic";
import Head from "next/head";

// Carrega o app só no navegador (client-side), sem SSR.
// Necessário porque o componente usa localStorage, window.print()
// e outras APIs que não existem durante a renderização no servidor.
const GacCeasaApp = dynamic(() => import("../components/GacCeasaApp"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head>
        <title>GAC CEASA Manager — Gestão completa do seu pátio</title>
        <meta
          name="description"
          content="Compras, vendas, estoque e conta corrente num só lugar. 30 dias de teste grátis, sem cartão de crédito."
        />

        {/* Open Graph — usado pelo WhatsApp, Facebook, Instagram etc. */}
        <meta property="og:title" content="GAC CEASA Manager" />
        <meta
          property="og:description"
          content="Gestão completa do seu pátio: compras, vendas, estoque e conta corrente. 30 dias de teste grátis."
        />
        <meta property="og:image" content="https://gacceasa.com.br/og-image-square.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content="https://gacceasa.com.br" />
        <meta property="og:type" content="website" />

        {/* Twitter/X, caso alguém compartilhe lá também */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GAC CEASA Manager" />
        <meta
          name="twitter:description"
          content="Gestão completa do seu pátio: compras, vendas, estoque e conta corrente."
        />
        <meta name="twitter:image" content="https://gacceasa.com.br/og-image-square.jpg" />
      </Head>
      <GacCeasaApp />
    </>
  );
}
