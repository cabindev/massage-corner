import type { Metadata } from "next";
// ฟอนต์เก็บไว้ในโปรเจกต์ (fontsource) — ไม่ดึงจาก Google ตอน build
// next/font/google ของ Turbopack พังบน build server ("queries have exactly one entry")
import "@fontsource-variable/inter";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "./globals.css";
import Providers from "./components/Providers";
import I18nProvider from "./components/I18nProvider";

export const metadata: Metadata = {
  title: "Massage Corner Sofia | Authentic Thai Massage & Spa",
  description:
    "Massage Corner Sofia – Professional Thai massage, aromatherapy, and spa services in the heart of Sofia, Bulgaria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <I18nProvider>{children}</I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
