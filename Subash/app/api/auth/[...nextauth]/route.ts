// app/api/auth/[...nextauth]/route.ts
// Auth.js v5 — single route handler for all auth endpoints
// GET  /api/auth/session, /api/auth/providers, /api/auth/csrf
// POST /api/auth/signin/*, /api/auth/signout, /api/auth/callback/*

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
