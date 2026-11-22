import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RestoRappel Sherbrooke — Réservations en ligne & rappels SMS automatiques",
  description:
    "Réduisez vos no-show à Sherbrooke grâce aux réservations en ligne simples et aux rappels SMS automatiques. 14 jours d'essai gratuit, sans commission.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-zinc-950 antialiased selection:bg-brand-100 selection:text-brand-900">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
