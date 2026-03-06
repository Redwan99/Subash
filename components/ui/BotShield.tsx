"use client";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { AlertTriangle } from "lucide-react";

interface BotShieldProps {
    onVerify: (token: string) => void;
}

export function BotShield({ onVerify }: BotShieldProps) {
    const ref = useRef<TurnstileInstance>(null);
    const { theme } = useTheme();

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Auto-verify in dev when site key is missing
    useEffect(() => {
        if (!siteKey && process.env.NODE_ENV === "development") {
            onVerify("dev-bypass-token");
        }
    }, [siteKey, onVerify]);

    if (!siteKey) {
        if (process.env.NODE_ENV === "development") {
            return (
                <div className="text-xs text-yellow-500 border border-yellow-500/20 bg-yellow-500/10 p-2 rounded">
                    <AlertTriangle className="w-4 h-4 inline mr-1" /> Turnstile bypassed (dev mode).
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
