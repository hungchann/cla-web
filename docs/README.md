# Tài liệu dự án — cla-web

Web app học tiếng Trung (Next.js App Router) trên backend Directus (`https://marutek.space`).

## Bản đồ tài liệu

| File | Nội dung | Khi nào đọc |
| :-- | :-- | :-- |
| [`architecture.md`](./architecture.md) | Kiến trúc dữ liệu: system context, routes, phân tầng, sequence các luồng chính | Onboarding, tìm hiểu luồng data |
| [`api-reference.md`](./api-reference.md) | Danh mục endpoint REST/GraphQL/AI chi tiết | Tích hợp API mới, debug network |
| [`backend-schema.md`](./backend-schema.md) | Schema Directus đầy đủ theo nhóm nghiệp vụ | Làm việc với DB, viết query |
| [`schema-snapshot.yaml`](./schema-snapshot.yaml) | Dump raw `/collections` (tên + meta) | Đối chiếu cấu trúc collection |
| [`premium-directus-contract.md`](./premium-directus-contract.md) | Contract premium/voucher/affiliate web + mobile: data model, permission, setup, checklist | Chạm vào tính năng thanh toán/premium |
| [`directus-flows-setup.md`](./directus-flows-setup.md) | Cấu hình 2 Directus Flow: kích hoạt premium khi verify payment + tăng used_count voucher | Setup backend automation cho luồng thanh toán |
| [`google-sso-setup.md`](./google-sso-setup.md) | Setup đăng nhập Google (Directus native SSO): Google Cloud, env Directus, gộp tài khoản theo email, troubleshooting | Thêm/sửa tính năng social login |
| [`design-system.md`](./design-system.md) | SSOT màu sắc, typography, card/container | Viết UI component mới |
| [`huong-dan-nhap-lieu-course.md`](./huong-dan-nhap-lieu-course.md) | Hướng dẫn nhập liệu khóa học trong Directus | Content admin |
| [`thanh-toan-voucher-affiliate.md`](./thanh-toan-voucher-affiliate.md) | Hướng dẫn quản lý thanh toán/voucher/affiliate trong Directus | Ops/admin đối soát |

## Quy ước

- Tên file: kebab-case tiếng Việt không dấu.
- Doc kiến trúc mô tả **data movement**; logic nghiệp vụ chi tiết nằm trong contract và code.
