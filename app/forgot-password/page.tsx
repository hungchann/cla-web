"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/api/apiService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password request failed:", err);
      setError(err?.response?.data?.errors?.[0]?.message || err?.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-amber-50/50 via-white to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-black px-4">
      <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-3xl p-8 border border-amber-100/50 dark:border-zinc-800/50 shadow-2xl flex flex-col gap-6">
        <div className="text-center space-y-1.5">
          <span className="text-4xl">🔑</span>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Khôi Phục Mật Khẩu
          </h1>
          <p className="text-xs text-zinc-400 font-bold">Chúng tôi sẽ gửi hướng dẫn khôi phục qua email của bạn</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold leading-relaxed text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold leading-relaxed">
              🎉 Yêu cầu đã được gửi thành công! Hãy kiểm tra hòm thư Email của bạn để làm theo hướng dẫn.
            </div>
            <Link
              href="/sign-in"
              className="w-full py-3 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 font-bold text-sm text-center transition-all cursor-pointer"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 select-none">Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nhap-email@cua-ban.com"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm text-zinc-800 dark:text-white dark:bg-zinc-950 dark:border-zinc-800 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Đang gửi yêu cầu...
                </>
              ) : (
                "Gửi email khôi phục"
              )}
            </button>

            <Link
              href="/sign-in"
              className="text-center text-xs font-bold text-zinc-400 hover:text-amber-600 transition-colors py-1.5"
            >
              Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
