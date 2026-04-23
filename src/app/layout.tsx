import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exur - Collaborative Code Editor",
  description: "Real-time collaborative code editor with AI assistance, live cursors, team chat, and 30+ programming languages. Code together, build faster.",
  keywords: ["collaborative code editor", "real-time coding", "pair programming", "team coding", "live collaboration", "AI code assistant", "online IDE"],
  authors: [{ name: "Taizun", url: "https://t4z.in" }],
  creator: "Taizun",
  publisher: "Exur",
  openGraph: {
    title: "Exur - Collaborative Code Editor",
    description: "Real-time collaborative code editor with AI assistance, live cursors, team chat, and 30+ programming languages.",
    url: "https://exur.in",
    siteName: "Exur",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Exur - Collaborative Code Editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Exur - Collaborative Code Editor",
    description: "Real-time collaborative code editor with AI assistance, live cursors, team chat, and 30+ programming languages.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9VJWHZMQFS"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-9VJWHZMQFS');
            `,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased h-full`}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
