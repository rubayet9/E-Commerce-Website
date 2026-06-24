"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/context/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Please enter both email and password.");
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand Hero */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#4f46e5] items-center justify-center p-12">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-600/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-500/15 to-cyan-400/10 blur-3xl" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-indigo-400/10 blur-2xl" style={{ animation: "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-md text-center flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-indigo-300" size={28} />
            <span className="text-white/60 text-sm font-semibold tracking-widest uppercase">Premium Experience</span>
          </div>

          <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
            Welcome to<br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
              Zendora
            </span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Your premium destination for high-quality apparel, streetwear, and exclusive fan editions. Sign in to access your personalized dashboard.
          </p>

          <div className="flex gap-3 mt-4">
            {["Premium Quality", "Fast Delivery", "Exclusive Drops"].map((item) => (
              <span key={item} className="px-3 py-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-[11px] text-white/50 font-medium backdrop-blur-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 bg-white relative">
        {/* Subtle background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-full blur-3xl -z-0" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile brand */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-black text-primary">Zendora</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Sign In</h2>
            <p className="text-sm text-foreground/50 mt-2">
              Welcome back! Enter your credentials to access your account.
            </p>
          </div>

          {/* Error display */}
          {(formError || error) && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200/60 rounded-xl text-xs font-semibold text-red-600 animate-slide-up">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-10 pr-12 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border-custom" />
            <span className="text-xs font-medium text-foreground/30 uppercase tracking-wider">New here?</span>
            <div className="flex-1 h-px bg-border-custom" />
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="w-full h-12 border-2 border-border-custom hover:border-accent/30 text-primary hover:text-accent font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
