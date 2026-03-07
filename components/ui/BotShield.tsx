"use client";
import { useEffect } from "react";

interface BotShieldProps {
    onVerify: (token: string) => void;
}

export function BotShield({ onVerify }: BotShieldProps) {
    // Turnstile disabled — auto-verify immediately
    useEffect(() => {
        onVerify("disabled");
    }, [onVerify]);

    return null;
}
