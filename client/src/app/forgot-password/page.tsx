"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/context/authStore";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, resetPassword, isLoading, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=email, 2=code+newpass, 3=success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg("Please enter your email.");
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      setResetCode(result.resetCode || null);
      setStep(2);
    } else {
      setErrorMsg(result.message || "Something went wrong.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim() || !newPassword.trim()) {
      setErrorMsg("Please enter the reset code and new password.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const result = await resetPassword(email, code, newPassword);
    if (result.success) {
      setStep(3);
    } else {
      setErrorMsg(result.message || "Invalid or expired code.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-indigo-50/30 to-white px-4 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-100/40 to-transparent rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        {/* Back link */}
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-foreground/40 hover:text-accent font-medium mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="bg-white border border-border-custom rounded-2xl shadow-xl shadow-indigo-100/30 p-8 sm:p-10">
          {/* Step 1: Enter Email */}
          {step === 1 && (
            <>
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-6 mx-auto">
                <KeyRound className="text-accent" size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-primary text-center tracking-tight">Forgot Password?</h2>
              <p className="text-sm text-foreground/50 text-center mt-2 mb-8">
                Enter your email and we'll send you a reset code.
              </p>

              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200/60 rounded-xl text-xs font-semibold text-red-600 animate-slide-up">{errorMsg}</div>
              )}

              <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Send Reset Code <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Enter Code + New Password */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-50 rounded-2xl mb-6 mx-auto">
                <Lock className="text-accent" size={24} />
              </div>
              <h2 className="text-2xl font-extrabold text-primary text-center tracking-tight">Reset Password</h2>
              <p className="text-sm text-foreground/50 text-center mt-2 mb-4">
                Enter the 6-digit code and your new password.
              </p>

              {/* Dev: Show the code */}
              {resetCode && (
                <div className="mb-5 p-3.5 bg-indigo-50 border border-indigo-200/60 rounded-xl text-center animate-slide-up">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Your Reset Code (Dev)</span>
                  <span className="text-2xl font-black text-accent tracking-[0.3em]">{resetCode}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200/60 rounded-xl text-xs font-semibold text-red-600 animate-slide-up">{errorMsg}</div>
              )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Reset Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full h-12 px-4 rounded-xl bg-secondary/60 border border-border-custom text-center text-lg font-black tracking-[0.4em] focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30 placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary/60 border border-border-custom text-sm font-medium focus:outline-none focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-foreground/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 mt-1 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Reset Password <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-primary">Password Reset!</h2>
              <p className="text-sm text-foreground/50 max-w-xs">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="w-full h-12 mt-2 bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 transition-all hover:from-[#4338ca] hover:to-[#4f46e5]"
              >
                Go to Sign In <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
