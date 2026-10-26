// HTTP Basic Auth check for the admin (ADMIN_USER / ADMIN_PASSWORD).
// Used by the middleware and again inside every admin server action.
// No Node APIs here: the middleware runs on the edge runtime.

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** False when the admin is disabled (either variable empty). */
export function adminEnabled(): boolean {
  return !!process.env.ADMIN_USER && !!process.env.ADMIN_PASSWORD;
}

export function isAuthorized(authorization: string | null): boolean {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass || !authorization?.startsWith("Basic ")) return false;
  try {
    const [u, ...rest] = atob(authorization.slice(6)).split(":");
    return safeEqual(u, user) && safeEqual(rest.join(":"), pass);
  } catch {
    return false; // malformed header
  }
}
