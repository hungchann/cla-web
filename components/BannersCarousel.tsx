"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/api/courses";
import { Banner } from "@/lib/types/course";
import { Carousel } from "@/components/ui/carousel";

export function BannersCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const items = await coursesApi.getBanners();
                if (isMounted) setBanners(items);
            } catch {
                if (isMounted) setBanners([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) return null;
    if (banners.length === 0) return null;

    return (
        <Carousel autoPlay autoPlayInterval={5000} className="rounded-2xl border border-amber-950/10 shadow-sm overflow-hidden">
            {banners.map((banner, index) => {
                const inner = banner.image_url ? (
                    <div className="relative w-full aspect-[3/1] min-h-[160px] bg-zinc-100 dark:bg-zinc-800">
                        <Image
                            src={banner.image_url}
                            alt="Quảng cáo khóa học"
                            fill
                            priority={index === 0}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="flex w-full aspect-[3/1] min-h-[160px] items-center justify-center bg-amber-100 text-xs font-bold text-amber-700">
                        Chưa có ảnh banner
                    </div>
                );
                return banner.link ? (
                    <Link key={String(banner.id)} href={banner.link} className="block">
                        {inner}
                    </Link>
                ) : (
                    <div key={String(banner.id)}>{inner}</div>
                );
            })}
        </Carousel>
    );
}
