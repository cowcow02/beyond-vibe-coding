import type { Metadata } from "next";
import "./globals.css";
import { Cormorant_Garamond, Space_Mono } from "next/font/google";

const cormorant = Cormorant_Garamond({
  weight: ['400', '600', '700'],
  subsets: ["latin"],
  variable: '--font-cormorant',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Vibe Coding Explorer",
  description: "Explore the vast landscape of software engineering beyond vibe coding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${spaceMono.variable} antialiased`}>
        {children}
        <div className="grain-overlay" />
      </body>
    </html>
  );
}
