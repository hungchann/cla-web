import { Suspense } from "react";
import AddWordForm from "./add-word-form";

export default function AddWordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col gap-6">
        <div className="p-6 md:p-8 space-y-6 max-w-2xl w-full mx-auto flex-1">
          <div className="bg-[#f59e0b] text-gray-950 font-black py-3.5 px-6 rounded-2xl text-center shadow-xs text-sm uppercase tracking-wide">
            Thêm Từ Mới Vào Sổ Tay
          </div>
          <div className="text-xs text-zinc-400 font-semibold p-2 animate-pulse bg-zinc-50 rounded-xl">
            Đang tải...
          </div>
        </div>
      </div>
    }>
      <AddWordForm />
    </Suspense>
  );
}
