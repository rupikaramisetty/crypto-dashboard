import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

import { createUserSession, validateCredentials } from "~/lib/auth.server";
import { getUserId } from "~/lib/session.server";

export const meta: MetaFunction = () => [{ title: "Sign In — Crypto Dashboard" }];

/** Already signed in → go straight to the dashboard. */
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) throw redirect("/");
  return null;
}

interface ActionData {
  errors?: { email?: string; password?: string; form?: string };
  fields?: { email: string };
}

export async function action({ request }: ActionFunctionArgs): Promise<ActionData | Response> {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  const errors: ActionData["errors"] = {};

  if (!email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";

  if (Object.keys(errors).length > 0) return { errors, fields: { email } };

  const user = validateCredentials(email, password);
  if (!user) {
    return {
      errors: { form: "Invalid email or password." },
      fields: { email },
    };
  }

  return createUserSession({ request, userId: user.id, redirectTo });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Preserve redirectTo across renders
  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirectTo") ?? "/"
      : "/";

  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const fields = actionData && "fields" in actionData ? actionData.fields : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg">
            ₿
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Crypto Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to view live exchange rates
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-900/50 dark:bg-indigo-950/40">
          <p className="font-semibold text-indigo-700 dark:text-indigo-300">Demo credentials</p>
          <p className="mt-0.5 font-mono text-indigo-600 dark:text-indigo-400">
            demo@example.com / password
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Form method="post" noValidate>
            <input type="hidden" name="redirectTo" value={redirectTo} />

            {errors?.form && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400"
              >
                {errors.form}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={fields?.email}
                  aria-invalid={errors?.email ? true : undefined}
                  aria-describedby={errors?.email ? "email-error" : undefined}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {errors?.email && (
                  <p id="email-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors?.password ? true : undefined}
                  aria-describedby={errors?.password ? "password-error" : undefined}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {errors?.password && (
                  <p id="password-error" className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
