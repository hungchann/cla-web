#!/usr/bin/env python3
"""Tạo 2 field gate Premium trên Directus + gắn cờ học thử cho chapter.

usage: DIRECTUS_TOKEN=<admin token> python scripts/directus-premium-fields.py
       DIRECTUS_URL=https://marutek.space DIRECTUS_TOKEN=... python scripts/directus-premium-fields.py

Vì sao cần: web đã đọc `course_chapters.is_free_preview` và `video_section.access_tier`
(xem lib/premium.ts), nhưng 2 cột này CHƯA tồn tại trên Directus → gate học thử hiện chỉ
chạy nhờ fallback tag "Học thử miễn phí" (chapter copy sai tag là gate hỏng im lặng).

Directus 11: POST /fields trên collection ĐÃ CÓ tạo luôn cột trong DB (khác POST /collections
— chỉ tạo metadata). Script idempotent: field có rồi thì bỏ qua.

Chạy được cả trên Windows (git-bash) và VPS: mọi body gửi qua file tạm `--data-binary @file`
để không đi qua bộ mã hoá command-line của Windows (arg non-ASCII bị đổi sang codepage hệ thống
→ JSON hỏng, Directus trả 400). Vì vậy KHÔNG truyền tiếng Việt qua argv.
"""

import json
import os
import subprocess
import sys
import tempfile

URL = os.environ.get("DIRECTUS_URL", "https://api.sunchinese.vn").rstrip("/")
TOKEN = os.environ.get("DIRECTUS_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else "")
CURL = os.environ.get("CURL", "curl")

TIER_CHOICES = [
    {"text": "Free", "value": "free"},
    {"text": "Premium", "value": "premium"},
]


def api(method, path, body=None):
    """Gọi Directus, trả (http_code, payload). Body đi qua file tạm để tránh lỗi encoding argv."""
    args = [CURL, "-sS", "-X", method, "-H", "Authorization: Bearer " + TOKEN,
            "-w", "\n%{http_code}", URL + path]
    tmp_path = None
    if body is not None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
            json.dump(body, f, ensure_ascii=False)
            tmp_path = f.name
        args += ["-H", "Content-Type: application/json", "--data-binary", "@" + tmp_path]
    try:
        r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
        out = r.stdout or ""
        if r.returncode != 0:
            print("!! curl lỗi (%s): %s" % (r.returncode, (r.stderr or "").strip()), file=sys.stderr)
            return 0, out
        payload, _, code_str = out.rpartition("\n")
        try:
            return int(code_str.strip()), json.loads(payload) if payload.strip() else None
        except ValueError:
            return 0, payload
    finally:
        if tmp_path:
            os.unlink(tmp_path)


def create_field(collection, field, definition):
    code, _ = api("GET", "/fields/%s/%s" % (collection, field))
    if code == 200:
        print("• %s.%s đã tồn tại — bỏ qua" % (collection, field))
        return
    code, payload = api("POST", "/fields/" + collection, definition)
    if code in (200, 201, 204):
        print("✓ đã tạo %s.%s" % (collection, field))
        return
    print("!! tạo %s.%s thất bại (HTTP %s): %s" % (collection, field, code, json.dumps(payload, ensure_ascii=False)),
          file=sys.stderr)
    sys.exit(1)


def main():
    if not TOKEN:
        print("!! thiếu DIRECTUS_TOKEN (Settings → Users → user → field Token → Save)", file=sys.stderr)
        sys.exit(2)

    print("→ %s" % URL)
    if api("GET", "/users/me")[0] != 200:
        print("!! token bị từ chối. Token phải được bấm Save trong Directus "
              "(Settings → Users → user → Token) và còn hiệu lực.", file=sys.stderr)
        sys.exit(1)
    print("✓ token hợp lệ")

    create_field("course_chapters", "is_free_preview", {
        "field": "is_free_preview",
        "type": "boolean",
        "meta": {
            "interface": "boolean",
            "display": "boolean",
            "width": "half",
            "note": "Chương học thử miễn phí (fallback cũ: tag Học thử miễn phí)",
        },
        "schema": {"default_value": False},
    })

    create_field("video_section", "access_tier", {
        "field": "access_tier",
        "type": "string",
        "meta": {
            "interface": "select-dropdown",
            "display": "labels",
            "width": "half",
            "options": {"choices": TIER_CHOICES},
            "display_options": {"choices": TIER_CHOICES},
            "note": "free = mở cho mọi user; premium = Free chỉ xem học thử",
        },
        "schema": {"default_value": "free", "max_length": 20},
    })

    # Gắn cờ học thử cho các chapter đang mang tag cũ (khớp không phân biệt hoa/thường)
    code, payload = api("GET", "/items/course_chapters?fields=id,title,tag&limit=-1")
    if code != 200:
        print("!! không đọc được /items/course_chapters (HTTP %s)" % code, file=sys.stderr)
        sys.exit(1)
    rows = payload.get("data") or []
    trial = [r for r in rows if "học thử" in (r.get("tag") or "").lower()]

    if not trial:
        print("• không có chapter nào mang tag học thử — bỏ qua bước gán cờ")
    for r in trial:
        code, _ = api("PATCH", "/items/course_chapters/%s" % r["id"], {"is_free_preview": True})
        if code == 200:
            print("✓ chapter %s → is_free_preview = true  (%s)" % (r["id"], r.get("title") or ""))
        else:
            print("!! chapter %s lỗi (HTTP %s)" % (r["id"], code), file=sys.stderr)

    # Kiểm chứng lại bằng chính API: field phải đọc được, và cờ phải nằm trong data
    print("→ kiểm chứng")
    for path in ("/fields/course_chapters/is_free_preview", "/fields/video_section/access_tier"):
        code, _ = api("GET", path)
        if code != 200:
            print("!! %s KHÔNG đọc được (HTTP %s)" % (path, code), file=sys.stderr)
            sys.exit(1)
        print("✓ field %s đọc được" % path.split("/fields/")[1])

    code, payload = api("GET", "/items/course_chapters?fields=id,title,is_free_preview&limit=-1")
    rows = payload.get("data") or []
    on = [r for r in rows if r.get("is_free_preview")]
    print("✓ %d/%d chapter bật học thử: %s"
          % (len(on), len(rows), ", ".join("%s:%s" % (r["id"], r.get("title") or "") for r in on)))

    print("→ giờ chạy: pnpm exec tsc --noEmit && pnpm run test")


if __name__ == "__main__":
    main()
