import { Inter, EB_Garamond } from 'next/font/google';
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
});

export const metadata: Metadata = {
  title: "A Pattern Language",
  description: "Daily patterns from Christopher Alexander's A Pattern Language",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable} antialiased`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
