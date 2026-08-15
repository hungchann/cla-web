"use client";

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
        <Carousel autoPlay autoPlayInterval={5000} className="rounded-2xl border border-amber-950/10 shadow-sm">
            {banners.map((banner) => {
                const inner = banner.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={banner.image_url}
                        alt="Quảng cáo khóa học"
                        className="h-44 w-full object-cover sm:h-52 md:h-64"
                    />
                ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-amber-100 text-xs font-bold text-amber-700 sm:h-52 md:h-64">
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
