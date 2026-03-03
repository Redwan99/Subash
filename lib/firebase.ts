// lib/firebase.ts
// Firebase client-side initialisation for Phone OTP (Step 2.2)
// This file is imported ONLY from Client Components.
// Initialization is guarded so the module is safe to import on the server
// during Next.js static prerendering (it is never CALLED server-side).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// On the server (during build prerendering) we export a null placeholder.
// Firebase SDK is never actually called server-side — all usage is inside
// useEffect / event handlers that only execute in the browser.
export const firebaseAuth: Auth =
  typeof window === "undefined"
    ? (null as unknown as Auth)
    : getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig));
