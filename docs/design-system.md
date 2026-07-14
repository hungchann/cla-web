# CLA Web Design System

This document serves as the **Single Source of Truth** for the design language, styling, spacing, and layout of the CLA Web application. All new components and pages MUST adhere to these rules.

## 1. Color Palette (Màu sắc)
Dự án sử dụng hệ màu **Amber (Vàng hổ phách)** làm màu chủ đạo và **Zinc (Kẽm)** làm màu trung tính cho text và background. Không sử dụng các màu ngẫu nhiên (như rose, purple, cyan) nếu không có lý do thật sự đặc biệt.

- **Primary Colors (Điểm nhấn, Nút bấm, Icon chính):**
  - Mặc định: `bg-amber-500`, `text-amber-500`
  - Hover / Active: `bg-amber-600`, `text-amber-600`
  - Nhấn mạnh cực đại: Gradient `from-amber-500 to-orange-500`
- **Text Colors (Văn bản):**
  - Tiêu đề chính (Headings): `text-zinc-900` (Light) / `text-white` (Dark)
  - Đoạn văn, Subtitle, Text phụ: `text-zinc-500` (Light) / `text-zinc-400` (Dark)
- **Background Colors:**
  - Nền trang chính: `bg-white` (hoặc `bg-zinc-50` cho các section xen kẽ)
  - Nền Card/Thành phần con: `bg-white/90`, `bg-zinc-100`

## 2. Typography (Nghệ thuật chữ)
Sử dụng các class sau cho từng loại văn bản cụ thể để tạo sự nhất quán về độ đậm nhạt:

- **H1 / H2 (Tiêu đề trang, Section):** `font-black text-2xl` hoặc `text-3xl tracking-tight`
- **H3 (Tiêu đề Card, Danh mục):** `font-extrabold text-base leading-snug tracking-tight`
- **Text thường (Đoạn văn, Mô tả):** `font-medium text-sm leading-relaxed`
- **Meta Text (Badge, Thời gian, Kèm Icon nhỏ):** `font-semibold text-xs`

## 3. Cards & Containers (Thẻ và Khối)
Bất kỳ thành phần dạng khối hộp nào (như danh sách khóa học, thư mục học tập) phải tuân theo chuẩn sau:

- **Border Radius (Độ bo góc):** `rounded-2xl` cho khối lớn, `rounded-xl` cho khối vừa, `rounded-full` cho badge/button nhỏ.
- **Padding:** Mặc định dùng `p-5` (hoặc `p-6` cho khối to hơn) bên trong thẻ.
- **Styling chuẩn của một Card bình thường:**
  ```css
  className="rounded-2xl border border-amber-950/10 bg-white/90 shadow-sm transition-all duration-300"
  ```
- **Styling chuẩn khi Hover lên Card (Interactive):**
  ```css
  className="hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-950/10"
  ```

## 4. Spacing & Layout (Khoảng cách)
Hệ thống khoảng cách phải sử dụng theo chuẩn sau để giao diện luôn thoáng:

- **Khoảng cách giữa các Section lớn trong 1 trang:** `gap-9` hoặc `space-y-9`
- **Khoảng cách giữa Tiêu đề và Nội dung con:** `space-y-5` hoặc `gap-5`
- **Layout Grid (Danh sách Card):** `grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3`
- **Page Container Padding:** Cấu trúc bọc ngoài cùng của một trang luôn là:
  ```tsx
  <div className="flex flex-1 flex-col gap-9 p-4 sm:p-6 lg:p-8">
  ```

## 5. Shadows (Đổ bóng)
- Tuyệt đối **KHÔNG** sử dụng các bóng đổ quá gắt (như `drop-shadow-xl`, `box-shadow` tự custom bằng mã HEX RGB) trừ khi thật sự cần thiết.
- Mặc định sử dụng `shadow-sm` cho các card tĩnh.
- Khi hover thì dùng `shadow-lg shadow-amber-950/10` để bóng mềm và ăn nhập với màu chủ đạo.
