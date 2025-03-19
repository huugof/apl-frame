import { Inter, EB_Garamond } from 'next/font/google';
import type { Metadata } from "next";
import "./globals.css";
import { start } from 'repl';

const appUrl = process.env.NEXT_PUBLIC_URL

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
});

/**
 * Frame embed configuration following Farcaster Frame v2 specification
 */
const frameEmbed = {
  version: "next",
  imageUrl: `${appUrl}/start.png`,
  button: {
    title: "Launch Today's Pattern",
    action: {
      type: "launch_frame",
      name: "APL Daily",
      url: `${appUrl}`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#e2e2e2",
    },
  },
};

export const metadata: Metadata = {
  title: "APL Daily",
  openGraph: {
    title: "APL Daily",
    description: "Daily patterns from Christopher Alexander's A Pattern Language"
  },
  other: {
    "fc:frame": JSON.stringify(frameEmbed),
    "viewport": "width=device-width, initial-scale=1, viewport-fit=cover",
    "theme-color": "#ffffff"
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable} antialiased h-full`}>
      <body className={`${inter.className} min-h-full bg-white`}>{children}</body>
    </html>
  );
}
