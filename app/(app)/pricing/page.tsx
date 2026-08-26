"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Lock,
  PartyPopper,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  buildAffiliateLink,
  buildCheckoutUrl,
  createPayment,
  getAccountPlans,
  getVoucherByCode,
  isVoucherValid,
  applyVoucher,
  resolvePlanFeatures,
} from "@/api/plans";
import { clearReferrer, getReferrer, saveReferrer } from "@/lib/referral";
import { useAuth } from "@/lib/hooks/useAuth";
import { buildVietQrUrl, formatVnd } from "@/lib/payment";
import type { AccountPlan, Voucher } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function PlanCard({
  plan,
  featured = false,
  onSelect,
  selectLabel,
}: Readonly<{
  plan: AccountPlan;
  featured?: boolean;
  onSelect?: () => void;
  selectLabel: string;
}>) {
  const features = resolvePlanFeatures(plan);
  return (
    <Card
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
        featured
          ? "border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-md shadow-amber-500/10 dark:from-amber-950/30 dark:to-zinc-900"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      {featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm">
          Phổ biến nhất
        </Badge>
      )}

      <CardHeader className="p-0 pb-4">
        <div className="flex items-center gap-2">
          <Crown className={cn("size-4", featured ? "text-amber-500" : "text-zinc-400")} />
          <CardTitle className="text-base font-black">
            {plan.name_trans || plan.name}
          </CardTitle>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-900 dark:text-white">
            {formatVnd(plan.price_vnd)}
          </span>
          {plan.original_price_vnd ? (
            <span className="text-xs font-semibold text-zinc-400 line-through">
              {formatVnd(plan.original_price_vnd)}
            </span>
          ) : null}
        </div>
        <CardDescription className="text-xs leading-relaxed">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ul className="space-y-2.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <div className="mt-6">
        <Button
          asChild={!onSelect}
          onClick={onSelect}
          className={cn(
            "w-full rounded-xl font-bold",
            featured
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              : "border border-amber-200 bg-transparent text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-500 dark:hover:bg-amber-950/20",
          )}
        >
          {onSelect ? (
            <span>{selectLabel}</span>
          ) : (
            <Link href={buildCheckoutUrl(plan)}>{selectLabel}</Link>
          )}
        </Button>
      </div>
    </Card>
  );
}

function CheckoutView({
  plan,
  refId,
  promoId,
}: Readonly<{
  plan: AccountPlan;
  refId: string | null;
  promoId: string | null;
}>) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const email = user?.email ?? "";
  const features = resolvePlanFeatures(plan);
  const { discountVnd, amountVnd } = applyVoucher(plan, voucher);
  const qrUrl = useMemo(
    () =>
      buildVietQrUrl({
        amount: amountVnd,
        content: email,
      }),
    [amountVnd, email],
  );

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setApplyingVoucher(true);
    setVoucherError(null);
    try {
      const found = await getVoucherByCode(voucherCode);
      const invalidReason = isVoucherValid(found);
      if (invalidReason) {
        setVoucher(null);
        setVoucherError(invalidReason);
        return;
      }
      setVoucher(found);
    } catch {
      setVoucher(null);
      setVoucherError("Không thể kiểm tra mã giảm giá, vui lòng thử lại.");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucher(null);
    setVoucherError(null);
    setVoucherCode("");
  };

  const handleSubmit = async () => {
    if (!email || !plan.price_vnd) {
      setError("Vui lòng đăng nhập và chọn gói hợp lệ.");
      return;
    }
    setSubmitting(true);
    setError(null);
    // Người cho link affiliate: ưu tiên ref trên URL, fallback ref đã lưu khi bấm link chia sẻ.
    const referrerUserId = refId ?? getReferrer();
    const result = await createPayment({
      plan,
      voucherCode: voucher?.code ?? null,
      promoLinkId: promoId,
      referrerUserId,
    });
    setSubmitting(false);
    if (result) {
      clearReferrer();
      setSubmitted(true);
    } else {
      setError("Không thể gửi yêu cầu. Vui lòng thử lại sau.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-xl rounded-3xl border-amber-200 dark:border-amber-900/40">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
            <ShieldCheck className="size-8" />
          </div>
          <CardTitle className="text-lg font-black">Đã gửi yêu cầu thanh toán</CardTitle>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Admin sẽ kiểm tra khoản chuyển khoản <strong>{formatVnd(amountVnd)}</strong> theo
            nội dung <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">{email}</code>{" "}
            và kích hoạt gói <strong>{plan.name_trans || plan.name}</strong> cho bạn.
            {discountVnd > 0 && (
              <span className="block mt-1 text-emerald-600">
                <PartyPopper className="w-4 h-4 inline mr-1 -mt-0.5" /> Đã giảm {formatVnd(discountVnd)} bằng mã voucher.
              </span>
            )}
          </p>
          <Button asChild className="mt-2 rounded-xl font-bold">
            <Link href="/dashboard">Về trang chủ</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-xl rounded-3xl">
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <Lock className="size-10 text-amber-500" />
          <CardTitle className="text-lg font-black">Đăng nhập để thanh toán</CardTitle>
          <p className="text-sm text-zinc-500">
            Bạn cần đăng nhập trước khi hoàn tất đăng ký gói{" "}
            <strong>{plan.name_trans || plan.name}</strong>.
          </p>
          <Button asChild className="mt-2 w-full rounded-xl font-bold">
            <Link
              href={`/sign-in?redirect=${encodeURIComponent(
                refId
                  ? `${buildCheckoutUrl(plan, promoId)}&ref=${encodeURIComponent(refId)}`
                  : buildCheckoutUrl(plan, promoId),
              )}`}
            >
              Đăng nhập / Đăng ký
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: plan summary */}
      <Card className="rounded-3xl border-amber-200/60 dark:border-amber-900/40">
        <CardHeader>
          <CardTitle className="text-base font-black">
            Gói đã chọn: {plan.name_trans || plan.name}
          </CardTitle>
          <CardDescription>Đăng ký một lần — bật Premium cho tài khoản của bạn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">
              {formatVnd(amountVnd)}
            </span>
            {(plan.original_price_vnd || discountVnd > 0) ? (
              <span className="text-xs font-semibold text-zinc-400 line-through">
                {formatVnd(plan.price_vnd)}
              </span>
            ) : null}
          </div>
          {discountVnd > 0 && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <PartyPopper className="w-4 h-4 inline mr-1 -mt-0.5" /> Voucher giảm {formatVnd(discountVnd)}
            </p>
          )}

          <Separator className="bg-zinc-100 dark:bg-zinc-800" />

          <div className="space-y-2.5">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Ưu đãi bao gồm
            </p>
            <ul className="space-y-2.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Right: payment */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <QrCode className="size-4 text-amber-500" />
            Thanh toán chuyển khoản
          </CardTitle>
          <CardDescription>
            Quét mã QR bằng app ngân hàng, nhập đúng nội dung chuyển khoản bên dưới.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Voucher */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
            <Label className="text-xs font-bold text-zinc-500">Mã giảm giá (voucher)</Label>
            {voucher ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div>
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {voucher.name || voucher.code} — giảm {voucher.is_percent ? `${voucher.value}%` : formatVnd(voucher.value)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="shrink-0 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Bỏ mã
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Input
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value);
                    setVoucherError(null);
                  }}
                  placeholder="Nhập mã voucher..."
                  className="font-mono text-xs uppercase"
                  disabled={applyingVoucher}
                />
                <Button
                  onClick={handleApplyVoucher}
                  disabled={applyingVoucher || !voucherCode.trim()}
                  className="shrink-0 rounded-xl bg-amber-500 font-bold text-white hover:bg-amber-600"
                >
                  {applyingVoucher ? <Loader2 className="size-4 animate-spin" /> : "Áp dụng"}
                </Button>
              </div>
            )}
            {voucherError && (
              <p className="mt-2 text-[11px] font-bold text-rose-600">{voucherError}</p>
            )}
          </div>

          <div className="flex justify-center rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`QR thanh toán ${formatVnd(amountVnd)}`}
              className="aspect-square w-full max-w-[260px] object-contain"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500">
              Nội dung chuyển khoản (email đăng ký)
            </Label>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-mono text-sm font-semibold break-all text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
              {email}
            </div>
            <p className="text-[11px] text-zinc-400">
              <TriangleAlert className="w-4 h-4 inline mr-1 -mt-0.5" /> Vui lòng chuyển đúng số tiền{" "}
              <strong className="text-zinc-600 dark:text-zinc-300">{formatVnd(amountVnd)}</strong>{" "}
              và đúng nội dung trên để hệ thống đối soát.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white hover:from-amber-600 hover:to-orange-600"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Đang gửi...
              </>
            ) : (
              <>Tôi đã chuyển khoản · {formatVnd(amountVnd)}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const planParam = searchParams.get("plan")?.trim() || "";
  const refId = searchParams.get("ref")?.trim() || null;
  const promoId = searchParams.get("promo")?.trim() || null;

  // Bấm link giới thiệu (affiliate) → lưu referrer để ghi nhận khi mua (kể cả sau khi đăng ký).
  useEffect(() => {
    if (refId && user?.id !== refId) {
      saveReferrer(refId);
    }
  }, [refId, user?.id]);

  const [copied, setCopied] = useState(false);
  const affiliateLink = user?.id ? buildAffiliateLink(user.id) : null;
  const handleCopyAffiliate = async () => {
    if (!affiliateLink) return;
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — vẫn để hiển thị để user tự copy.
    }
  };

  const { data: plans, isLoading } = useQuery({
    queryKey: ["account-plans"],
    queryFn: getAccountPlans,
  });

  const premiumPlans = useMemo(
    () => (plans ?? []).filter((p) => p.is_premium !== false),
    [plans],
  );

  const selectedPlan = useMemo(() => {
    if (!planParam) return null;
    const id = planParam.toLowerCase();
    return (
      premiumPlans.find((p) => String(p.id) === id) ||
      premiumPlans.find((p) => (p.key || "").toLowerCase() === id) ||
      null
    );
  }, [premiumPlans, planParam]);

  const featuredPlan =
    premiumPlans.find((p) => p.is_featured) || premiumPlans[Math.floor(premiumPlans.length / 2)] || null;

  const handleSelect = (plan: AccountPlan) => {
    router.push(`/pricing?plan=${encodeURIComponent(String(plan.id))}`);
  };

  const renderPlansList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-72 rounded-2xl" />
          ))}
        </div>
      );
    }
    if (premiumPlans.length === 0) {
      return (
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm font-bold text-zinc-500">
              Chưa có gói cước nào được cấu hình trên hệ thống.
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {premiumPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            featured={featuredPlan ? String(featuredPlan.id) === String(plan.id) : false}
            onSelect={isAuthenticated ? () => handleSelect(plan) : undefined}
            selectLabel={isAuthenticated ? "Chọn gói này" : "Đăng nhập để nâng cấp"}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer maxWidth="narrow">
      <PageHeader
        title="Nâng cấp Premium"
        description="Mở khóa toàn bộ nội dung học tập: video, sách song ngữ, luyện nói AI và sổ tay không giới hạn."
        icon={<Sparkles className="size-7" />}
      />

      {selectedPlan ? (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/pricing")}>
            ← Chọn gói khác
          </Button>
          <CheckoutView plan={selectedPlan} refId={refId} promoId={promoId} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Link giới thiệu (affiliate) cho user đã đăng nhập */}
          {affiliateLink && (
            <Card className="rounded-3xl border-amber-200/60 dark:border-amber-900/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <Share2 className="size-4 text-amber-500" />
                  Link giới thiệu (Affiliate)
                </CardTitle>
                <CardDescription>
                  Chia sẻ link này — khi bạn bè mua Premium qua link, hệ thống ghi nhận bạn là người giới thiệu.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Input
                  readOnly
                  value={affiliateLink}
                  className="font-mono text-xs"
                  aria-label="Link giới thiệu của bạn"
                />
                <Button
                  onClick={handleCopyAffiliate}
                  className="shrink-0 rounded-xl bg-amber-500 font-bold text-white hover:bg-amber-600"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Đã sao chép" : "Sao chép"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">
              Chọn gói phù hợp
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {isAuthenticated
                ? "Chọn gói để chuyển sang bước thanh toán."
                : "Đăng nhập để hoàn tất thanh toán."}
            </p>
          </div>

          {renderPlansList()}

          <Card className="rounded-3xl bg-zinc-50/60 dark:bg-zinc-950/20">
            <CardContent className="flex items-start gap-3 p-5 text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <p className="leading-relaxed">
                Sau khi chuyển khoản thành công, quản trị viên sẽ xác nhận trong giờ hành chính và
                kích hoạt gói Premium cho tài khoản của bạn. Mọi thắc mắc liên hệ fanpage{" "}
                <a
                  href="https://www.facebook.com/sunchineseapp"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-amber-600 underline"
                >Sun Chinese</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <PageContainer maxWidth="narrow" className="gap-9">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-72 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        </PageContainer>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
