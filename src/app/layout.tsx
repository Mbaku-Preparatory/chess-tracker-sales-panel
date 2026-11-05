import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthGate } from "@/components/AuthGate";
import { GlobalLoader } from "@/components/GlobalLoader";
import { AppShell } from "@/components/AppShell";
import { THEME_SCRIPT } from "@/lib/theme";
import { ReduxProvider } from "@/redux/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Preparatory — Sales Panel",
  description: "Internal admin panel for managing Chess Preparatory users.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // suppressHydrationWarning: THEME_SCRIPT adds the `dark` class to <html>
  // before React hydrates, and browser extensions inject attributes there too
  // (e.g. data-scribe-recorder-ready); the server HTML can't match either. This
  // suppresses attribute mismatches on this element only — it does not hide
  // mismatches anywhere below.
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ReduxProvider>
          <GlobalLoader />
          <AppShell>
            <AuthGate>{children}</AuthGate>
          </AppShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
