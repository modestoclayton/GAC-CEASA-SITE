import Head from 'next/head';
import '../styles/gac-colors.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/GAC_CEASA.ico" type="image/x-icon" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
