import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Berber Randevu Sistemi",
  description: "Berber randevu sistemi ile kolayca randevu alın",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <Navbar />
        <Toaster position="top-center" />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
