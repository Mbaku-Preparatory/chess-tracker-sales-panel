import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

/**
 * Brings Clerk's sign-in and account menu into the app's look. The colours are
 * CSS variables (globals.css) so they follow the `dark` class by themselves.
 */
export const clerkAppearance: ComponentProps<typeof ClerkProvider>["appearance"] = {
  variables: {
    colorPrimary: "#5c7a33",
    colorPrimaryForeground: "#ffffff",
    colorDanger: "#dc2626",
    colorBackground: "var(--clerk-background)",
    colorForeground: "var(--clerk-foreground)",
    colorMuted: "var(--clerk-muted)",
    colorMutedForeground: "var(--clerk-muted-foreground)",
    colorInput: "var(--clerk-input)",
    colorInputForeground: "var(--clerk-input-foreground)",
    colorBorder: "var(--clerk-border)",
    colorNeutral: "var(--clerk-neutral)",
    colorRing: "#7cac42",
    fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    userButtonAvatarBox: "h-9 w-9",
    //  throughout: Clerk's own styles outrank a plain utility.
    // Flat, like the app's buttons; Clerk's sheen is a gradient on ::after.
    formButtonPrimary: "shadow-none! after:hidden!",
    // colorPrimary is the button green, too dim to read as text on dark.
    footerActionLink: "text-brand-700! dark:text-brand-400!",
  },
};

/** Overrides the app name set in the Clerk dashboard, which is the default. */
export const clerkLocalization: ComponentProps<typeof ClerkProvider>["localization"] = {
  signIn: { start: { title: "Sign in to the Sales Panel" } },
};
