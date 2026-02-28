// lib/analytics.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trackEvent = (eventName: string, data?: any) => {
    if (process.env.NODE_ENV === "production") {
        // In production, sync to PostHog, Vercel Analytics, or Mixpanel
        console.log("[Analytics]", eventName, data);
    } else {
        // Silently log during local development
        console.log("[Analytics Local]", eventName, data);
    }
};
