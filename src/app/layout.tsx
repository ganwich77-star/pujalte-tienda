import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fotodetalles y Recordatorios - Tu tienda de premium",
  description: "Tu tienda premium de fotografía y productos personalizados. Cuadros, posters, láminas y más. POWERED BY PUJALTE CREATIVE STUDIO.",
  keywords: ["fotografía", "cuadros", "posters", "láminas", "impresiones", "regalos personalizados"],
  authors: [{ name: "Fotodetalles y Recordatorios" }],
  icons: {
    icon: "/logo_ia.png",
    shortcut: "/logo_ia.png",
    apple: "/logo_ia.png",
  },
  openGraph: {
    title: "Fotodetalles y Recordatorios - Tu tienda de premium",
    description: "Tu tienda premium de fotografía y productos personalizados. Cuadros, posters, láminas y más. POWERED BY PUJALTE CREATIVE STUDIO.",
    images: ["/logo_ia.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fotodetalles y Recordatorios - Tu tienda de premium",
    description: "Tu tienda premium de fotografía y productos personalizados. Cuadros, posters, láminas y más. POWERED BY PUJALTE CREATIVE STUDIO.",
    images: ["/logo_ia.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
