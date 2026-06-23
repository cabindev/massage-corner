"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.replace(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-xl bg-cream-50 px-4 py-3 text-bark ring-1 ring-leaf-100 outline-none transition placeholder:text-bark/40 focus:ring-2 focus:ring-leaf-500";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-leaf-50 to-cream px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-leaf-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-bark">Admin Sign In</h1>
          <p className="mt-1 text-sm text-bark/55">
            For Massage Corner Sofia staff
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-bark">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-bark"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-leaf-600 px-6 py-3 font-medium text-white shadow-md shadow-leaf-600/30 transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-bark/50 hover:text-leaf-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
