import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://metodo-dante.pages.dev"),
  title: "Método Magnético | Dante — El Cortocircuito",
  description: "Descubre el sistema biológico que ella no puede ignorar. El método que habla directamente a su instinto.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Método Magnético | Dante",
    description: "Descubre el sistema biológico que ella no puede ignorar. El método que habla directamente a su instinto.",
    url: "https://metodo-dante.pages.dev",
    type: "website",
    images: [{ url: "/images/dante-profile.jpg", width: 400, height: 400 }],
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
