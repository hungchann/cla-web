"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RegisterUser, checkEmailExists } from "@/api/apiService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { SunChineseLogo } from "@/components/SunChineseLogo";

export default function RegisterPage() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
                                Tạo Tài Khoản Mới
                            </h1>
                            <p className="text-xs text-zinc-400 font-semibold">Điền thông tin bên dưới để bắt đầu học ngay</p>
                        </div>
                    </div>

                    {error && (
                        <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <output className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 dark:bg-emerald-955/15 dark:border-emerald-900/30 dark:text-emerald-450 block">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                            <span>Đăng ký thành công! Đang chuyển bạn đến trang đăng nhập...</span>
                        </output>
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
                                    className="rounded-2xl text-sm h-11"
                                    disabled={success}
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
                                    className="rounded-2xl text-sm h-11"
                                    disabled={success}
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
                                className="rounded-2xl font-mono text-sm h-11"
                                disabled={success}
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
                                className="rounded-2xl font-mono text-sm h-11"
                                disabled={success}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || success}
                            className="w-full mt-2 h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý đăng ký...
                                </span>
                            ) : (
                                "Đăng ký tài khoản"
                            )}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                            Hoặc
                        </span>
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                    </div>

                    <GoogleButton callbackPath="/dashboard" />

                    <div className="text-center text-xs text-zinc-400 font-bold pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        Đã có tài khoản?{" "}
                        <Link href="/sign-in" className="text-amber-600 hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right side: Visual panel (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-amber-500 to-orange-600 p-12 text-white relative overflow-hidden select-none">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-radial-at-t from-white/10 to-transparent pointer-events-none" />

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
