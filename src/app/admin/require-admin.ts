import "server-only";
import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";

/** First line of every admin server action: re-checks Basic Auth instead of relying only on the middleware. */
export async function requireAdmin(): Promise<void> {
  if (!isAuthorized((await headers()).get("authorization"))) throw new Error("Unauthorized");
}
