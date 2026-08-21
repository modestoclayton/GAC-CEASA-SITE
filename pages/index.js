import dynamic from "next/dynamic";

// Carrega o app só no navegador (client-side), sem SSR.
// Necessário porque o componente usa localStorage, window.print()
// e outras APIs que não existem durante a renderização no servidor.
const GacCeasaApp = dynamic(() => import("../components/GacCeasaApp"), {
  ssr: false,
});

export default function Home() {
  return <GacCeasaApp />;
}
