"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/context/authStore";

export default function SignupPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  useEffect(() => {
    clearError();
  }, []);

  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: "", color: "", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "bg-red-400", width: "25%" };
    if (password.length < 8) return { label: "Fair", color: "bg-amber-400", width: "50%" };
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (hasUpper && hasSpecial && password.length >= 8) return { label: "Strong", color: "bg-emerald-500", width: "100%" };
    return { label: "Good", color: "bg-blue-400", width: "75%" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const success = await register(name, email, password);
    if (success) router.push("/dashboard");
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand Hero */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#4f46e5] items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-600/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-500/15 to-cyan-400/10 blur-3xl" style={{ animation: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 max-w-md text-center flex flex-col items-center gap-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-indigo-300" size={28} />
            <span className="text-white/60 text-sm font-semibold tracking-widest uppercase">Join the Movement</span>
          </div>

          <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
            Create Your<br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              Zendora Account
            </span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Get access to exclusive collections, order tracking, wishlists, and a personalized shopping experience.
          </p>

          <div className="flex flex-col gap-3 mt-4 text-left w-full max-w-xs">
            {["Track your orders in real-time", "Save favourites & wishlists", "Exclusive member-only deals"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/40 text-sm">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 bg-white relative">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-violet-50/80 to-transparent rounded-full blur-3xl -z-0" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-black text-primary">Zendora</h2>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Create Account</h2>
            <p className="text-sm text-foreground/50 mt-2">
              Fill in your details to get started with Zendora.
            </p>
          </div>

          {(formError || error) && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200/60 rounded-xl text-xs font-semibold text-red-600 animate-slide-up">
              {formError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
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
              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <span className="text-[10px] font-bold text-foreground/40">{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border text-sm font-medium focus:outline-none focus:ring-2 transition-all placeholder:text-foreground/30 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-border-custom focus:border-accent focus:bg-white focus:ring-accent/10"
                  }`}
                />
              </div>
              {confirmPassword && confirmPassword !== password && (
                <span className="text-[11px] text-red-500 font-medium">Passwords don't match</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border-custom" />
            <span className="text-xs font-medium text-foreground/30 uppercase tracking-wider">Already registered?</span>
            <div className="flex-1 h-px bg-border-custom" />
          </div>

          <Link
            href="/login"
            className="w-full h-12 border-2 border-border-custom hover:border-accent/30 text-primary hover:text-accent font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
