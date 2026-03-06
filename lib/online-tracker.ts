// lib/online-tracker.ts
// Lightweight in-memory active-user tracker.
// Clients send a heartbeat every 30s. Any session not heard from in 90s is pruned.

const EXPIRY_MS = 90_000; // 90 seconds

// Map<sessionId, lastSeen timestamp>
const sessions = new Map<string, number>();

/** Record a heartbeat for a session. */
export function heartbeat(sessionId: string) {
  sessions.set(sessionId, Date.now());
}

/** Return count of currently active sessions. */
export function getOnlineCount(): number {
  const cutoff = Date.now() - EXPIRY_MS;
  let count = 0;
  for (const [id, ts] of sessions) {
    if (ts < cutoff) {
      sessions.delete(id);
    } else {
      count++;
    }
  }
  return count;
}
