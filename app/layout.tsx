import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { APP_TITLE, APP_DESCRIPTION, APP_URL } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
  keywords: ["ai", "ai platform", "ai interviewer", "open-source"],
  
  alternates: {
    canonical: "/",
  },

  authors: [
    {
      name: "Ibrohim Abdivokhidov",
      url: "https://github.com/abdibrokhim",
    },
  ],

  openGraph: {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: APP_TITLE,
    type: "website",
    url: "/",
    images: [
      {
        url: "/jobstry.png",
        width: 1200,
        height: 630,
        alt: APP_TITLE,
      },
    ],
  },
  
  icons: {
    icon: '/favicon.ico',
  },

  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ['/jobstry.png'],
    site: '@abdibrokhim',
    creator: '@abdibrokhim',
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },

  appleWebApp: {
    title: APP_TITLE,
    statusBarStyle: 'black-translucent',
  },
  
  appLinks: {
    web: {
      url: APP_URL,
      should_fallback: true,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === "development"
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-screen bg-background`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="top-center" theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
