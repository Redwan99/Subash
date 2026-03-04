"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type FeatureMap = Record<string, boolean>;

interface FeatureToggleContextValue {
  features: FeatureMap;
  isEnabled: (key: string) => boolean;
}

const FeatureToggleContext = createContext<FeatureToggleContextValue>({
  features: {},
  isEnabled: () => true,
});

export function useFeatureToggles() {
  return useContext(FeatureToggleContext);
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function FeatureToggleProvider({
  initial,
  children,
}: {
  initial: FeatureMap;
  children: ReactNode;
}) {
  const [features, setFeatures] = useState<FeatureMap>(initial);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/features", { cache: "no-store" });
      if (res.ok) {
        const data: FeatureMap = await res.json();
        // Only update if something actually changed — avoids unnecessary re-renders
        setFeatures((prev) => {
          const keys = new Set([...Object.keys(prev), ...Object.keys(data)]);
          for (const k of keys) {
            if (prev[k] !== data[k]) return data;
          }
          return prev;
        });
      }
    } catch {
      // Silently ignore — keep the last known state
    }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll]);

  const isEnabled = useCallback(
    (key: string) => features[key] !== false,
    [features]
  );

  return (
    <FeatureToggleContext.Provider value={{ features, isEnabled }}>
      {children}
    </FeatureToggleContext.Provider>
  );
}
