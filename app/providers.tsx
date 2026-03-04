// app/providers.tsx
// Client-side wrapper that supplies the Auth.js SessionProvider
// to all child components in the React tree.
// Must be a Client Component — SessionProvider uses React Context.

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { FeatureToggleProvider } from "@/components/providers/FeatureToggleProvider";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
  featureToggles?: Record<string, boolean>;
}

export function Providers({ children, session, featureToggles }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
      <FeatureToggleProvider initial={featureToggles ?? {}}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </FeatureToggleProvider>
    </ThemeProvider>
  );
}
