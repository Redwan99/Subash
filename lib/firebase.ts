// lib/firebase.ts
// Firebase client-side initialisation for Phone OTP (Step 2.2)
// This file is imported ONLY from Client Components.
// Initialization is guarded so the module is safe to import on the server
// during Next.js static prerendering (it is never CALLED server-side).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

const firebaseConfig = {
  apiKey,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// On the server (during build prerendering) or when env vars are missing,
// we export a null placeholder. Firebase SDK is never actually called
// server-side — all usage is inside useEffect / event handlers.
const canInit = typeof window !== "undefined" && apiKey.length > 0;

export const firebaseAuth: Auth | null = canInit
  ? getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
