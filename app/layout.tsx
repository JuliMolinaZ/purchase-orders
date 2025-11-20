import type { Metadata } from 'next';
import { Inter, Rubik } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Orden de Autorización y Compra | RUN Solutions',
  description:
    'Sistema profesional de órdenes de autorización y compra para RUN Solutions y Grupo Nearlink 360',
  keywords: [
    'orden de compra',
    'autorización',
    'RUN Solutions',
    'Nearlink 360',
    'gestión empresarial',
  ],
  authors: [{ name: 'RUN Solutions' }],
  creator: 'RUN Solutions',
  publisher: 'Grupo Nearlink 360',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    title: 'Orden de Autorización y Compra | RUN Solutions',
    description:
      'Sistema profesional de órdenes de autorización y compra para RUN Solutions y Grupo Nearlink 360',
    siteName: 'RUN Solutions',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${rubik.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
