interface GifStripProps {
    urls?: string[] | null;
    fallbackUrl?: string | null;
    word: string;
    /** Tailwind class cho từng item (vd: "size-14", "size-24"). */
    itemClassName?: string;
    containerClassName?: string;
}

/** Hàng ngang nhiều GIF minh họa nét viết (side-by-side, gọn). */
export function GifStrip({
    urls,
    fallbackUrl,
    word,
    itemClassName = "size-14",
    containerClassName = "",
}: GifStripProps) {
    const list = (urls && urls.length > 0 ? urls : fallbackUrl ? [fallbackUrl] : []).filter(Boolean);
    if (list.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${containerClassName}`}>
            {list.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={url}
                    src={url}
                    alt={`Minh họa nét viết chữ ${word}${list.length > 1 ? ` (${i + 1}/${list.length})` : ""}`}
                    className={`${itemClassName} rounded-xl border border-amber-200 bg-white object-contain p-1 shadow-xs shrink-0 dark:bg-zinc-800 dark:border-zinc-700`}
                />
            ))}
        </div>
    );
}
