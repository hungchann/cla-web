"use client";

import { useState, Suspense, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/api/apiService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

// SUN CHINESE Logo Component
function SunChineseLogo({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div className={`flex items-center gap-2 select-none group shrink-0 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-transform duration-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-white"
        >
          <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
        </svg>
      </div>
      <div className="flex flex-col leading-none text-left">
        <span className="text-sm font-black tracking-widest text-amber-500">SUN</span>
        <span className="text-[10px] font-bold text-zinc-400 tracking-wider">CHINESE</span>
      </div>
    </div>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginUser(email, password);
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { errors?: { message?: string }[] } }; message?: string };
      setError(
        anyErr?.response?.data?.errors?.[0]?.message ||
        anyErr?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-50/50 dark:bg-zinc-950">
      {/* Left side: Form Panel */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <SunChineseLogo />
            </Link>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Chào mừng quay lại!
              </h1>
              <p className="text-xs text-zinc-400 font-semibold">Đăng nhập tài khoản học viên để tiếp tục học</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signin-email" className="text-xs font-bold text-zinc-500">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nhap-email@cua-ban.com"
                autoComplete="email"
                className="rounded-2xl font-mono text-sm h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="signin-password" className="text-xs font-bold text-zinc-500">Mật khẩu</Label>
                <Link href="/forgot-password" className="text-[11px] font-bold text-amber-600 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="rounded-2xl font-mono text-sm h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kết nối...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-400 font-bold pt-4 border-t border-zinc-100 dark:border-zinc-800">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-amber-600 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Right side: Visual panel (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-amber-500 to-orange-600 p-12 text-white relative overflow-hidden select-none">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-radial-at-t from-white/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-2">
          {/* Top light sun logo */}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-white"
            >
              <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM6.161 5.1a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061L6.16 6.16a.75.75 0 0 1 0-1.06ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM17.84 5.1a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06L16.78 5.1a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM16.78 18.9a.75.75 0 0 1 1.06 0l1.591 1.59a.75.75 0 1 1-1.06 1.061l-1.59-1.591a.75.75 0 0 1 0-1.06ZM12 18.75a.75.75 0 0 1 .75.75V21.75a.75.75 0 0 1-1.5 0V19.5a.75.75 0 0 1 .75-.75ZM6.16 18.9a.75.75 0 0 1 0 1.06l-1.591 1.59a.75.75 0 1 1-1.06-1.06l1.59-1.591a.75.75 0 0 1 1.061 0ZM5.25 12a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H4.5a.75.75 0 0 1 .75.75Z" />
            </svg>
          </div>
          <span className="font-black text-sm tracking-widest">SUN CHINESE</span>
        </div>

        <div className="z-10 flex flex-col justify-center items-start space-y-4 my-auto max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Nền tảng học tiếng Trung hiện đại
          </h2>
          <p className="text-sm text-amber-50 leading-relaxed font-semibold">
            Tận hưởng lộ trình học toàn diện với các bài đọc song ngữ phong phú, hệ thống ôn luyện từ vựng bằng Flashcards khoa học, và đặc biệt là tính năng luyện phản xạ nói chấm điểm trực tiếp cùng Giáo viên AI.
          </p>
        </div>

        <div className="text-[10px] text-amber-100/70 font-semibold">
          © {new Date().getFullYear()} Sun Chinese. Được xây dựng cho người học tiếng Trung.
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
