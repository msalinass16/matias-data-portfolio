import type { Metadata, Viewport } from "next";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import TabBar from "@/components/TabBar";
import { StoreProvider } from "@/lib/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fit",
  description: "Registro diario de peso, macros y entrenos",
  appleWebApp: {
    capable: true,
    title: "Fit",
    statusBarStyle: "black-translucent",
  },
  manifest: "/manifest.webmanifest",
  // Un solo juego de iconos en public/, generado por scripts/gen-icons.mjs.
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Necesario para que el contenido llegue bajo la barra de gestos del iPhone
  // y podamos compensarla con env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-bg text-fg">
        <StoreProvider>
          <main
            className="mx-auto w-full max-w-[520px] px-4 pt-3"
            style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}
          >
            {children}
          </main>
          <TabBar />
          <ServiceWorkerRegistrar />
        </StoreProvider>
      </body>
    </html>
  );
}
