import "server-only";

export async function verifyTurnstile(token: string): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === "development") return true;
        console.error("TURNSTILE_SECRET_KEY is missing in production.");
        return false;
    }

    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
        });

        const data = await res.json();
        return data.success === true;
    } catch (error) {
        console.error("Turnstile verification failed:", error);
        return false;
    }
}
