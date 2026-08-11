import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import type { JsonBodyType } from "msw";
import { server } from "@/tests/mocks/server";
import { coursesApi } from "@/api/courses";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

function mockGet(urlPattern: string, payload: JsonBodyType, status = 200) {
  server.use(
    http.get(urlPattern, () => {
      return HttpResponse.json(payload, { status });
    }),
  );
}

describe("coursesApi.getCourses", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("returns mapped courses with image_url", async () => {
    mockGet(`${API}/items/course*`, {
      data: [
        { id: "c1", title: "Khóa 1", image: { id: "img-1", filename_disk: "f-1.jpg" } },
        { id: "c2", title: "Khóa 2", image: "img-2.jpg" },
        { id: "c3", title: "Khóa 3", image: null },
      ],
    });

    const result = await coursesApi.getCourses();

    expect(result).toHaveLength(3);
    expect(result[0].image_url).toBe(`${API}/assets/img-1`);
    expect(result[1].image_url).toBe(`${API}/assets/img-2.jpg`);
    expect(result[2].image_url).toBeUndefined();
  });

  it("returns empty array on failure", async () => {
    mockGet(`${API}/items/course*`, { error: "boom" }, 500);
    expect(await coursesApi.getCourses()).toEqual([]);
  });

  it("passes level and script filters in query string", async () => {
    let requestedUrl = "";
    server.use(
      http.get(`${API}/items/course*`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({ data: [] });
      }),
    );

    await coursesApi.getCourses({ level: "HSK 4", script: "song ngữ" });

    expect(requestedUrl).toContain("filter[level][_eq]=HSK%204");
    expect(requestedUrl).toContain(`filter[script_type][_eq]=song%20ng%E1%BB%AF`);
    expect(requestedUrl).toContain("filter[status][_eq]=published");
  });
});

describe("coursesApi.getCourseById", () => {
  beforeEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = "";
    localStorage.clear();
  });

  it("attaches chapters and lessons to course", async () => {
    server.use(
      http.get(`${API}/items/course/:id*`, () => {
        return HttpResponse.json({ data: { id: "c1", title: "Khóa", image: null } });
      }),
      http.get(`${API}/items/course_chapters*`, () => {
        return HttpResponse.json({
          data: [
            { id: "ch1", course_id: "c1", title: "Chương 1", status: "published" },
            { id: "ch2", course_id: "c1", title: "Chương 2", status: "published" },
          ],
        });
      }),
      http.get(`${API}/items/course_lessons*`, () => {
        return HttpResponse.json({
          data: [
            { id: "l1", title: "Bài 1", chapter_id: "ch1", status: "published" },
            { id: "l2", title: "Bài 2", chapter_id: "ch2", status: "published" },
          ],
        });
      }),
    );

    const course = await coursesApi.getCourseById("c1");
    const chapters = course?.chapters ?? [];

    expect(chapters).toHaveLength(2);
    expect(chapters[0].lessons).toEqual([
      { id: "l1", title: "Bài 1", chapter_id: "ch1", status: "published" },
    ]);
    expect(chapters[1].lessons).toEqual([
      { id: "l2", title: "Bài 2", chapter_id: "ch2", status: "published" },
    ]);
  });

  it("returns null when course not found", async () => {
    mockGet(`${API}/items/course/:id*`, { data: null });
    expect(await coursesApi.getCourseById("nope")).toBeNull();
  });

  it("sets empty chapters when no chapters exist", async () => {
    server.use(
      http.get(`${API}/items/course/:id*`, () => {
        return HttpResponse.json({ data: { id: "c1", title: "Khóa", image: null } });
      }),
      http.get(`${API}/items/course_chapters*`, () => {
        return HttpResponse.json({ data: [] });
      }),
    );

    const course = await coursesApi.getCourseById("c1");
    expect(course!.chapters).toEqual([]);
  });
});

describe("coursesApi.getCourseChapters", () => {
  it("groups lessons under chapters", async () => {
    server.use(
      http.get(`${API}/items/course_chapters*`, () => {
        return HttpResponse.json({ data: [{ id: "ch1", course_id: "c1", title: "C1" }] });
      }),
      http.get(`${API}/items/course_lessons*`, () => {
        return HttpResponse.json({ data: [{ id: "l1", title: "B1", chapter_id: "ch1" }] });
      }),
    );

    const chapters = await coursesApi.getCourseChapters("c1");
    expect(chapters).toHaveLength(1);
    expect(chapters[0].lessons).toEqual([{ id: "l1", title: "B1", chapter_id: "ch1" }]);
  });

  it("returns [] when no chapters", async () => {
    server.use(
      http.get(`${API}/items/course_chapters*`, () => {
        return HttpResponse.json({ data: [] });
      }),
    );
    expect(await coursesApi.getCourseChapters("c1")).toEqual([]);
  });
});

describe("coursesApi.getCourseLessonById", () => {
  it("returns lesson", async () => {
    server.use(
      http.get(`${API}/items/course_lessons/:id*`, () => {
        return HttpResponse.json({ data: { id: "l1", title: "Bài 1" } });
      }),
    );
    expect(await coursesApi.getCourseLessonById("l1")).toEqual({ id: "l1", title: "Bài 1" });
  });

  it("returns null on failure", async () => {
    server.use(
      http.get(`${API}/items/course_lessons/:id*`, () => {
        return HttpResponse.json({ error: "x" }, { status: 500 });
      }),
    );
    expect(await coursesApi.getCourseLessonById("l1")).toBeNull();
  });
});
