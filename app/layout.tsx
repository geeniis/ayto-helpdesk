import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ayto-HelpDesk | Caldes d'Estrac",
  description: "Plataforma de Soporte Técnico y Gestión de Incidencias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased selection:bg-blue-200 selection:text-blue-900`}>
        {children}
      </body>
    </html>
  );
}
