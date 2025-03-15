import { Inter, EB_Garamond } from 'next/font/google';
import type { Metadata } from "next";
import "./globals.css";
import { start } from 'repl';

const appUrl = process.env.NEXT_PUBLIC_HOST

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
      splashBackgroundColor: "#eeccff",
    },
  },
};

export const metadata: Metadata = {
  title: "APL Daily 2",
  openGraph: {
    title: "APL Daily 3",
    description: "Daily patterns from Christopher Alexander's A Pattern Language"
  },
  other: {
    "fc:frame": JSON.stringify(frameEmbed)
  },
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
