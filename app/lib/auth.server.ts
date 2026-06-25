/**
 * Server-only authentication helpers. In a real application this would query a
 * database; here we use a hardcoded demo user so the exercise works without any
 * external infrastructure.
 *
 * To add a real backend: replace `DEMO_USERS` with a DB query and swap the
 * plain-text password comparison for a bcrypt/argon2 verification call.
 */

import { redirect } from "@remix-run/node";

import { commitSession, destroySession, getSession, requireUserId } from "~/lib/session.server";

export interface User {
  id: string;
  email: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Demo user store — swap this out for a real DB call when adding a backend.
// ---------------------------------------------------------------------------
const DEMO_USERS: Array<User & { password: string }> = [
  { id: "1", email: "demo@example.com", name: "Demo User", password: "password" },
];

export function findUserByEmail(email: string) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

/** Returns the user if credentials are valid, otherwise null. */
export function validateCredentials(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) return null;
  // Return the User shape without the password field.
  return { id: user.id, email: user.email, name: user.name };
}

// ---------------------------------------------------------------------------
// Session-backed auth actions
// ---------------------------------------------------------------------------

/** Creates a session for the user and returns a Set-Cookie redirect response. */
export async function createUserSession({
  request,
  userId,
  redirectTo,
}: {
  request: Request;
  userId: string;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

/** Destroys the session and redirects to /login. */
export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

/** Returns the current user from the session, or null. */
export async function getUser(request: Request): Promise<User | null> {
  let userId: string;
  try {
    userId = await requireUserId(request);
  } catch {
    return null;
  }
  const user = DEMO_USERS.find((u) => u.id === userId);
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}
