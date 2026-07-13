"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterUser, checkEmailExists } from "@/api/apiService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        throw new Error("Tài khoản đã tồn tại. Vui lòng đăng nhập hoặc sử dụng email khác.");
      }

      await RegisterUser(email, password, firstName, lastName);
      setSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { errors?: { message?: string }[] } }; message?: string };
      console.error("Registration failed:", err);
      setError(
        anyErr?.response?.data?.errors?.[0]?.message ||
        anyErr?.message ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-amber-50/50 via-white to-zinc-50 dark:from-zinc-900/50 dark:via-zinc-950 dark:to-black px-4">
      <div className="w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-3xl p-8 border border-amber-100/50 dark:border-zinc-800/50 shadow-2xl flex flex-col gap-6">
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-block">
            <span className="text-4xl">📝</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Tạo Tài Khoản Học Viên
          </h1>
          <p className="text-xs text-zinc-400 font-bold">Điền thông tin bên dưới để bắt đầu học</p>
        </div>

        {error && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold leading-relaxed text-center dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold leading-relaxed text-center dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
            🎉 Đăng ký thành công! Đang chuyển bạn đến trang đăng nhập...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-lastname" className="text-xs font-bold text-zinc-500">Họ</Label>
              <Input
                id="reg-lastname"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nguyen"
                autoComplete="family-name"
                className="rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reg-firstname" className="text-xs font-bold text-zinc-500">Tên *</Label>
              <Input
                id="reg-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="An"
                autoComplete="given-name"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-email" className="text-xs font-bold text-zinc-500">Email *</Label>
            <Input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nhap-email@cua-ban.com"
              autoComplete="email"
              className="rounded-2xl font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-password" className="text-xs font-bold text-zinc-500">Mật khẩu *</Label>
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
              className="rounded-2xl font-mono"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Đang xử lý đăng ký...
              </span>
            ) : (
              "Đăng ký tài khoản"
            )}
          </Button>
        </form>

        <div className="text-center text-xs text-zinc-400 font-bold pt-2 border-t border-zinc-100 dark:border-zinc-800">
          Đã có tài khoản?{" "}
          <Link href="/sign-in" className="text-amber-600 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
