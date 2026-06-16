"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email is required.";
    if (!username) e.username = "Username is required.";
    else if (username.length < 3) e.username = "Username must be at least 3 characters.";
    else if (!/^[a-z0-9_]+$/.test(username)) e.username = "Only lowercase letters, numbers, and underscores.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setLoading(true);
    const supabase = createClient();

    const { error: signupError, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (signupError) {
      setErrors({ form: signupError.message });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        bio: null,
      });
      if (profileError) {
        setErrors({ form: profileError.message });
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">ScreenShare</h1>
          <p className="text-sm text-[#888]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-white mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-1.5">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="your name"
            />
            {errors.username && <p className="text-xs text-white mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-white mt-1">{errors.password}</p>}
          </div>

          {errors.form && (
            <p className="text-sm text-white bg-[#111] border border-[#222] px-3 py-2">
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white text-black text-sm font-medium hover:bg-[#ddd] disabled:opacity-50 transition-colors mt-1"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#888] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
