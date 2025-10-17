"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { login as loginAction } from "../../lib/auth";
import { useAuth } from "../providers";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await loginAction({ email, password });
      login(token, user);
      router.replace("/");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Password</label>
          <input
            className="w-full border rounded px-3 py-2 bg-transparent"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button
          disabled={loading}
          className="w-full h-10 rounded bg-foreground text-background disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-sm">
          No account? <Link className="underline" href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}


