"use client";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";
import { useTheme } from "next-themes";

interface BotShieldProps {
    onVerify: (token: string) => void;
}

export function BotShield({ onVerify }: BotShieldProps) {
    const ref = useRef<TurnstileInstance>(null);
    const { theme } = useTheme();

    // Provide a safe fallback if the site key is missing in dev
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
        if (process.env.NODE_ENV === "development") {
            return (
                <div className="text-xs text-yellow-500 border border-yellow-500/20 bg-yellow-500/10 p-2 rounded">
                    ⚠️ Turnstile missing site key.
                </div>
            );
        }
        return null;
    }

    return (
        <div className="my-4 flex justify-center">
            <Turnstile
                ref={ref}
                siteKey={siteKey}
                onSuccess={(token) => onVerify(token)}
                options={{
                    theme: theme === "dark" ? "dark" : theme === "light" ? "light" : "auto",
                }}
            />
        </div>
    );
}
