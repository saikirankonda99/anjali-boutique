import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anjali Boutique | Tradition meets Style",
  description: "Premium Indian ethnic wear — sarees, lehengas, kurtas and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-stone-50 text-stone-900`}>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="bg-stone-800 text-stone-300 text-center py-6 mt-16 text-sm">
            © 2026 Anjali Boutique. Made with 🌸 in India.
          </footer>
        </Providers>
      </body>
    </html>
  );
}