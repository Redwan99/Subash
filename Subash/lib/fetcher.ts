// lib/fetcher.ts
// Generic SWR fetcher - throws on non-ok responses for proper error handling.

export const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error(`API error: ${res.status} ${res.statusText}`);
        throw error;
    }
    return res.json();
};
