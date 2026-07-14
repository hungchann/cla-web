"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/api/apiService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await forgotPassword(email);
            setSuccess(true);
        } catch (err: unknown) {
            console.error("Forgot password request failed:", err);
            setError(err?.response?.data?.errors?.[0]?.message || err?.message || "Gửi yêu cầu thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950 px-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200/60 dark:border-zinc-800 shadow-xl flex flex-col gap-6">
                <div className="space-y-4">
                    <Link href="/" className="inline-block">
                        <SunChineseLogo />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Khôi Phục Mật Khẩu
                        </h1>
                        <p className="text-xs text-zinc-400 font-semibold">Chúng tôi sẽ gửi hướng dẫn khôi phục qua email của bạn</p>
                    </div>
                </div>

                {error && (
                    <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 dark:bg-rose-955/15 dark:border-rose-900/30 dark:text-rose-455">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{error}</span>
                    </div>
                )}

                {success ? (
                    <div className="flex flex-col gap-4 text-center">
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 text-left dark:bg-emerald-955/15 dark:border-emerald-900/30 dark:text-emerald-455">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span>Yêu cầu đã được gửi thành công! Hãy kiểm tra hòm thư Email của bạn để làm theo hướng dẫn.</span>
                        </div>
                        <Button asChild variant="outline" className="w-full h-11 rounded-2xl font-bold text-sm cursor-pointer border border-zinc-250 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-all">
                            <Link href="/sign-in">Quay lại đăng nhập</Link>
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="forgot-email" className="text-xs font-bold text-zinc-500">Địa chỉ Email</Label>
                            <Input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nhap-email@cua-ban.com"
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
                                    Đang gửi yêu cầu...
                                </span>
                            ) : (
                                "Gửi email khôi phục"
                            )}
                        </Button>

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
