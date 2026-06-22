import type { Metadata } from "next";
import { ReactNode } from "react";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Platform", template: "%s | Platform" },
  description: "A modern SaaS platform built with Next.js, Supabase, and Stripe.",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 5 },
  icons: { icon: "/favicon.ico" },
};

interface RootLayoutProps { children: ReactNode; }

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#004080" />
      </head>
      <body>{children}</body>
    </html>
  );
}
