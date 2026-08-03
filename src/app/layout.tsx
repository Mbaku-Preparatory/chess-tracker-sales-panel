import type { Metadata } from "next";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ReduxProvider } from "@/redux/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mbaku Preparatory — Sales Panel",
  description: "Internal admin panel for managing Mbaku Preparatory users.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
          {/* proxy.ts already enforces auth.protect() on every route, so by
              the time we render here the user is guaranteed signed in. */}
          <ReduxProvider>
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
              <span className="text-sm font-semibold tracking-tight">
                Mbaku Preparatory — Sales Panel
              </span>
              <UserButton />
            </header>
            <main className="flex-1 p-6">{children}</main>
          </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
