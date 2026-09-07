"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { exchangeGoogleSession, saveGoogleTokensFromFragment } from "@/api/apiService";
import { Loader2, AlertCircle } from "lucide-react";
import { SunChineseLogo } from "@/components/SunChineseLogo";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            try {
                // Ưu tiên token trong URL fragment (mode json-redirect của patch openid.js)
                const hash = window.location.hash;
                let ok = false;
                if (hash && hash.length > 1) {
                    ok = await saveGoogleTokensFromFragment(hash);
                    // Scrub fragment (chứa token) khỏi URL/history ngay sau khi đọc
                    window.history.replaceState(null, "", window.location.pathname + window.location.search);
                }
                // Fallback: đổi session cookie (mode session)
                if (!ok) {
                    await exchangeGoogleSession();
                }
                const raw = searchParams.get("redirect");
                const target =
                    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
                router.replace(target);
                router.refresh();
            } catch {
                setError(
                    "Đăng nhập bằng Google thất bại. Nếu bạn đã có tài khoản với email này, vui lòng liên hệ hỗ trợ để liên kết tài khoản."
                );
                setTimeout(() => router.replace("/sign-in"), 4000);
            }
        };
        run();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-zinc-50/50 dark:bg-zinc-950">
            <div className="w-full max-w-md space-y-6 text-center">
                <Link href="/" className="inline-block">
                    <SunChineseLogo />
                </Link>

                {error ? (
                    <div
                        role="alert"
                        className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold leading-relaxed flex items-center gap-2.5 text-left dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{error}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                            Đang hoàn tất đăng nhập bằng Google...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense>
            <GoogleCallbackContent />
        </Suspense>
    );
}
