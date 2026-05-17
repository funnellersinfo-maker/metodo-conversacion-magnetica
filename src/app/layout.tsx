import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Método Conversación Magnética | Dante",
  description: "El cortocircuito biológico para hackear su atención de inmediato.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Método Conversación Magnética",
    description: "El cortocircuito biológico para hackear su atención de inmediato.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" href="/videos/dante-llamando.mp4" as="video" />
        <link rel="preload" href="/audio/call-audio.mp3" as="audio" />
      </head>
      <body className="antialiased bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
