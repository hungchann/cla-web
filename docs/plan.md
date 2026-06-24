# 📖 Hướng Dẫn Chi Tiết: Chuyển Đổi Mobile App (React Native/Expo) Sang Web App (Next.js)

Tài liệu này đóng vai trò là cẩm nang hướng dẫn chuyển đổi dự án **Chinese Learning App** từ phiên bản di động (React Native/Expo) sang phiên bản Web Application sử dụng **Next.js 14+ (App Router)** và kết nối với Backend **Directus**.

---

## 🗺️ 1. Bản Đồ Ánh Xạ Kiến Trúc (Mobile ➡️ Web)

Khi chuyển từ React Native sang Next.js, chúng ta sẽ ánh xạ cấu trúc thư mục cũ sang cấu trúc thư mục mới như sau:

| Thành Phần Mobile App | Thư Mục Trên Web (Next.js) | Giải Pháp Kỹ Thuật Trên Web |
| :--- | :--- | :--- |
| **Routing:** `app/(tabs)/index.tsx` | `app/dashboard/page.tsx` | Trang Dashboard học tập dạng Web Grid. |
| **Routing:** `app/screens/bilingual` | `app/bilingual/page.tsx` | Trang danh sách tài liệu đọc song ngữ. |
| **Routing:** `app/screens/bilingual/detail` | `app/bilingual/[id]/page.tsx` | Giao diện đọc song ngữ chia 2 cột. |
| **Routing:** `app/screens/video` | `app/video/page.tsx` | Xem video bài giảng có phụ đề. |
| **Component:** `RubyText.tsx` | `components/RubyText.tsx` | Sử dụng thẻ HTML chuẩn: `<ruby>汉字<rt>hàn zì</rt></ruby>`. |
| **Component:** `HighlightedText.tsx` | `components/HighlightedText.tsx` | Sử dụng HTML/CSS để bôi màu các từ đúng/sai trong phát âm. |
| **Token Storage:** `SecureStore` | `lib/utils/tokenUtils.ts` | Sử dụng Cookie trình duyệt thuần hoặc `localStorage`. |
| **State Management:** `Context` & `Zustand` | `store/` & React Context | Giữ nguyên `zustand` cho Web, viết lại các Context. |
| **Media Player:** `expo-video` & `expo-av` | `HTML5 Video/Audio` | Dùng thẻ `<video>`, `<audio>` hoặc thư viện `react-player`. |

---

## 📂 2. Các Thư Mục Có Thể Sao Chép Ngay Sang Web

Sau khi bạn chạy lệnh khởi tạo Next.js, bạn có thể copy trực tiếp các thư mục sau từ dự án Mobile sang dự án Web để tái sử dụng logic:

1. **`translations/`**: Chứa các file JSON đa ngôn ngữ (`vi.json`, `en.json`). Next.js có thể dùng trực tiếp để làm nội dung đa ngôn ngữ.
2. **`lib/types/`**: Chứa toàn bộ các định nghĩa TypeScript của hệ thống (User, Vocabulary, BilingualItem). Giúp duy trì Type Safety mà không cần định nghĩa lại.
3. **`lib/mappers/`**: Chứa các mapper biến đổi dữ liệu nhận từ Directus API thành dữ liệu hiển thị (ví dụ: `BilingualMapper`).
4. **`lib/constants.ts`**: Chứa các đường dẫn endpoints API để gọi lên Server.

---

## 🛠️ 3. Các Thư Mục Cần Thay Thế/Sửa Đổi Khi Bê Sang

### 3.1. Thư mục `api/` (Chuyển đổi giao tiếp mạng)

Bạn cần copy thư mục `api/` sang web nhưng bắt buộc phải sửa đổi 2 file cấu hình chính:

#### 1. File `api/authConfig.ts` (Sửa đổi cách lưu Token & API URL)

* **Trên Mobile:** Sử dụng `expo-secure-store` để lưu JWT Token và `Constants` để đọc cấu hình API.
* **Trên Web:** Sửa lại để dùng `js-cookie` và biến môi trường của Next.js (`process.env.NEXT_PUBLIC_API_URL`).

**Mẫu code chỉnh sửa cho `authConfig.ts` trên Web:**

```typescript
import axios from "axios";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "https://marutek.space";

const apiInstance = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor chèn token vào header
apiInstance.interceptors.request.use(
  async (config) => {
    const isLogin = config.url?.includes("/auth/login");
    if (!isLogin) {
      const token = Cookies.get("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiInstance;
```

#### 2. File `api/apiService.ts`

* Xóa bỏ các dòng import liên quan đến React Native hoặc Expo.
* Thay thế logic dọn dẹp cache cũ bằng cách xóa Cookie: `Cookies.remove("access_token")` và `Cookies.remove("refresh_token")`.

---

## 🎨 4. Giải Pháp Cho Các Tính Năng Đặc Thù Trên Web

### 4.1. Hiển thị phiên âm Pinyin (`RubyText`)

Trên web, bạn không cần dùng thư viện phức tạp. Thẻ `<ruby>` của HTML được hỗ trợ gốc trên tất cả trình duyệt hiện đại:

```tsx
// components/RubyText.tsx
export function RubyText({ character, pinyin }: { character: string; pinyin: string }) {
  return (
    <ruby className="text-lg px-0.5">
      {character}
      <rt className="text-xs text-amber-600 select-none">{pinyin}</rt>
    </ruby>
  );
}
```

### 4.2. Ghi âm luyện nói Shadowing

Thay vì dùng `expo-av`, sử dụng **MediaRecorder API** tiêu chuẩn của trình duyệt:

```typescript
// Hook ghi âm đơn giản trên web
export function useAudioRecorder() {
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      const audioBlob = event.data; // Gửi file Blob này lên Server Google STT để chấm điểm
    };
    mediaRecorder.start();
  };
}
```

### 4.3. Tập viết chữ Hán (Character Writing Practice)

Tích hợp thư viện **Hanzi Writer** (đã được tối ưu hóa cho môi trường Web Canvas) để nhận diện nét vẽ và chấm điểm thứ tự nét bút:

```html
<div id="character-target-div"></div>
<script>
  var writer = HanziWriter.create('character-target-div', '我', {
    width: 300,
    height: 300,
    showOutline: true
  });
  writer.quiz(); // Bắt đầu chế độ kiểm tra viết
</script>
```

### 4.4. Thanh toán Premium

Thay vì dùng cổng của Apple/Google trên di động (RevenueCat):

1. Tạo tài khoản **Stripe**.
2. Khi người dùng bấm nâng cấp Premium trên Web, chuyển hướng họ tới trang **Stripe Checkout** do Stripe tự host.
3. Cấu hình **Webhook** từ Stripe trỏ về Directus server để cập nhật trường `account_type_id` của User thành `Premium` sau khi thanh toán thành công.

---

## 🌐 5. Chi Tiết Hệ Thống API & Tích Hợp GraphQL Trên Web

Hệ thống API kết nối tới Directus Backend (`https://marutek.space`) được chia thành hai nhánh chính: **REST API** (cho Auth và các nghiệp vụ đặc thù) và **GraphQL API** (cho toàn bộ dữ liệu học tập).

### 5.1. Cơ Chế Giao Tiếp GraphQL Trên Trình Duyệt

Trên thiết bị di động, GraphQL được gọi thông qua Axios bằng cách in đối tượng AST (`DocumentNode`) thành chuỗi truy vấn. Trên Web App, chúng ta có hai cách để tối ưu hóa kích thước bundle size:

1. **Cách 1 (Giữ nguyên cấu trúc):** Copy file `api/graphql/client.ts` và sử dụng `graphql-tag` + `graphql` (phù hợp nếu muốn tái sử dụng 100% tài nguyên).
2. **Cách 2 (Tối ưu hóa tải trang):** Dùng chuỗi string thuần (Raw String Queries) thông qua hàm `graphqlRequestRaw` có sẵn trong client để không phải đóng gói thư viện chuyển đổi AST lớn vào client bundle.

#### Mẫu hàm gọi GraphQL dùng chung trên Web

```typescript
import apiInstance from "@/api/authConfig";

export async function queryGraphQL<TData, TVariables = any>(
  query: string,
  variables?: TVariables
): Promise<{ data: TData }> {
  const response = await apiInstance.post("/graphql", {
    query,
    variables,
  });
  if (response.data.errors) {
    throw new Error(response.data.errors[0]?.message || "GraphQL Error");
  }
  return response.data;
}
```

### 5.2. Danh Sách Các Bảng (Collections) & Câu Lệnh Truy Vấn Cốt Lõi

Khi xây dựng giao diện trên Web, bạn sẽ cần thực hiện các truy vấn dữ liệu từ Directus thông qua các cấu trúc GraphQL sau đây:

#### 1. Hệ thống Bài đọc Song ngữ (`Sections`)

* **Query tương ứng:** `GET_NEW_SECTIONS_QUERY` và `GET_SECTION_BY_ID_QUERY`.
* **Dữ liệu trả về:** `id`, `title`, `title_trans`, `level`, và các file đính kèm: `image` (ảnh bìa), `file_script` (chứa nội dung văn bản gốc), `SubRip_Subtitle` (file phụ đề `.srt` cho âm thanh).
* *Lưu ý trên Web:* Link tải ảnh bìa từ Directus sẽ có dạng: `${API_BASE_URL}/assets/${image_id}`.

#### 2. Học từ vựng & Flashcards (`Vocabulary`, `UserFlashcard`)

* **Lấy danh sách từ vựng:** `GET_ALL_VOCABULARY_QUERY` (lấy tất cả) hoặc `GET_VOCABULARY_BY_SECTION_QUERY` (lấy theo bài đọc).
* **Đồng bộ tiến trình học (SRS):**
  * Sử dụng query `GET_USER_FLASHCARD_PROGRESS_QUERY` để lấy trạng thái học của user (`status` như *new, learning, review*).
  * Sử dụng mutation `CREATE_USER_FLASHCARD_MUTATION` và `UPDATE_USER_FLASHCARD_STATUS_MUTATION` để cập nhật trạng thái khi học viên đánh giá mức độ thuộc từ (1 đến 4).

#### 3. Luyện nói và Hội thoại AI (`speaking_topics`, `speaking_scenarios`, `speaking_dialogues`)

* **Cấu trúc dữ liệu:** Chủ đề hội thoại (`speaking_topics`) ➡️ Kịch bản chi tiết (`speaking_scenarios`) ➡️ Các câu thoại (`speaking_dialogues`).
* **API Luồng Thoại:** Lấy danh sách câu thoại bằng query `GET_SPEAKING_DIALOGUES_QUERY` truyền theo `categoryId`. Trả về: `chinese_text`, `pinyin`, `vietnamese_text`, `speaker` (để phân biệt vai nhân vật A hay B).

#### 4. Thư viện sách (`book_library`, `User_Reading_Progress`)

* **Query tương ứng:** `GET_BOOK_LIBRARY_BY_ID_QUERY` lấy toàn bộ nội dung sách và danh sách chương (`chapters_id` gồm `title` và `content`).
* **Đồng bộ tiến trình đọc:** `CREATE_USER_READING_PROGRESS_MUTATION` và `UPDATE_USER_READING_PROGRESS_MUTATION` để lưu lại số trang/chương học viên đang đọc dở.

#### 5. Bài học Video phụ đề chạy chữ (`video_section`)

* **Query tương ứng:** `GET_VIDEO_SECTIONS_QUERY`.
* **Trường quan trọng:** `YouTube_URL` (dùng để nhúng trình phát iframe YouTube lên web), `srt_file` (phụ đề SRT để hiển thị phụ đề chạy theo video timeline).

### 5.3. Sử dụng React Query để Quản lý State & Caching trên Web

Nên sử dụng `@tanstack/react-query` bọc bên ngoài Next.js App Router (qua `QueryClientProvider` ở layout root) để đồng bộ dữ liệu.

**Mẫu hook lấy danh sách bài viết song ngữ trên Web:**

```tsx
import { useQuery } from "@tanstack/react-query";
import { queryGraphQL } from "@/api/graphql/client";

const GET_SECTIONS = `
  query GetNewSections {
    Sections(sort: ["-date_created"], limit: 12) {
      id
      title
      title_trans
      level
    }
  }
`;

export function useBilingualSections() {
  return useQuery({
    queryKey: ["bilingual-sections"],
    queryFn: async () => {
      const response = await queryGraphQL<{ Sections: any[] }>(GET_SECTIONS);
      return response.data.Sections;
    },
    staleTime: 10 * 60 * 1000, // Caching dữ liệu trong 10 phút
  });
}
```

---

## 🚀 6. Lộ Trình Triển Khai Từng Bước (7 Bước)

1. **Bước 1:** Chạy lệnh `npx create-next-app` để khởi tạo dự án Next.js mới. (Đã hoàn thành)
2. **Bước 2:** Cài đặt các thư viện kết nối mạng và quản lý trạng thái (`axios`, `graphql`, `zustand`, `@tanstack/react-query`). (Cần cài đặt bổ sung cho Web app)
3. **Bước 3:** Sao chép các thư mục dùng chung (`lib/types`, `lib/mappers`, `lib/constants.ts`, `translations`). (Đã hoàn thành)
4. **Bước 4:** Di chuyển thư mục `api/` và cấu hình lại file `authConfig.ts` sử dụng Cookie của trình duyệt thay thế cho SecureStore. (Đã hoàn thành)
5. **Bước 5:** Viết file GraphQL Client cho Web (`api/graphql/client.ts` và `api/graphql/documents.ts`). (Đã hoàn thành)
6. **Bước 6:** Tạo các trang UI chính trong thư mục `/app/` (không phải `src/app/`):
    * Trang chủ Dashboard (`/dashboard`): hiển thị danh sách khóa học, sách và video.
    * Trang đọc song ngữ (`/bilingual/[id]`): giao diện chia làm 2 cột đối sánh, hỗ trợ click xem nghĩa.
    * Trang học từ vựng (`/flashcard`): hỗ trợ lật thẻ bằng phím Space và chọn điểm ghi nhớ.
7. **Bước 7:** Deploy thử nghiệm lên **Vercel** hoặc **Cloudflare Pages** và cấu hình CORS trên Directus.

---

## 🛠️ 7. Các Phần Đã Chuyển Đổi Thành Công (Cập nhật 24/06/2026)

Chúng ta đã thực hiện cấu hình lại hệ thống và loại bỏ toàn bộ thư viện liên quan đến Expo/React Native để sẵn sàng chạy Next.js. Chi tiết các tệp tin đã xử lý:

### 1. Quản lý Trạng thái & Lưu trữ Token
* **[tokenUtils.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/utils/tokenUtils.ts):** Hoàn thành triển khai quản lý token thông qua Cookie trình duyệt (`access_token`, `refresh_token`, `access_token_expires_at`) và `localStorage` (`user_data`). Đã loại bỏ hoàn toàn `expo-secure-store`.
* **[authConfig.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/api/authConfig.ts):** Đã cập nhật logic cấu hình API và interceptor tự làm mới token bằng Cookie, đọc API base URL từ `process.env.NEXT_PUBLIC_API_URL`.
* **[apiService.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/api/apiService.ts):** Đồng bộ hóa các hàm kiểm tra token và refresh token thông qua `tokenUtils` mới.
* **[profile.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/api/profile.ts):** Cập nhật phương thức lấy thông tin `user_data` từ localStorage thay cho `SecureStore`.
* **[constants.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/constants.ts):** Chuyển toàn bộ các Directus Flow UUID và cấu hình API sang sử dụng các biến môi trường `process.env.NEXT_PUBLIC_...`.

### 2. Xử lý Ghi âm & Chuyển giọng nói thành văn bản (STT)
* **[audioRecordingService.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/services/audioRecordingService.ts):** Loại bỏ hoàn toàn `expo-av`, `expo-file-system`. Viết lại trình điều khiển sử dụng **MediaRecorder API** và **navigator.mediaDevices** tiêu chuẩn của trình duyệt. Dữ liệu âm thanh ghi âm được lưu trực tiếp dưới dạng `Blob` trong bộ nhớ và biểu diễn bằng Blob URL (`URL.createObjectURL`).
* **[marutekTranscribeService.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/services/marutekTranscribeService.ts):** Loại bỏ `expo-file-system`. Tự động tải lại đối tượng `Blob` từ Blob URL và gửi kèm `FormData` qua `fetch` lên API của Marutek. Sử dụng `FileReader` để convert sang base64 khi có fallback.

### 3. Phản hồi Âm thanh & Giao diện Chữ Hán
* **[audioFeedback.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/services/audioFeedback.ts):** Loại bỏ `expo-av`. Sử dụng đối tượng `window.Audio` gốc để phát nhạc hiệu ứng từ đường dẫn tĩnh `/sound/`.
* **[copy_sounds.js](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/copy_sounds.js):** Đã chạy thành công tập lệnh sao chép toàn bộ âm thanh từ dự án gốc sang thư mục tĩnh `/public/sound/`.
* **[RubyText.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/RubyText.tsx):** Loại bỏ hoàn toàn code React Native. Triển khai cấu trúc hiển thị Pinyin chạy đè bằng cặp thẻ HTML5 `<ruby>` và `<rt>` giúp trình duyệt hiển thị mượt mà trên môi trường Web.
* **[speech.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/utils/speech.ts):** Triển khai giọng đọc tiếng Trung và dừng nói qua Web SpeechSynthesis API gốc của trình duyệt.
* **[theme.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/theme.ts):** Tạo bộ gỡ lỗi theme hỗ trợ Light/Dark mode thích ứng, xuất ra các định dạng typography và layout.

### 4. Kiểu Dữ Liệu, Hooks, & Components Giao Diện Web
* **Khớp nối Types**: Loại bỏ hoàn toàn dependencies React Native trong [types/theme.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/types/theme.ts), [types/components.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/types/components.ts) và [types/svg.d.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/types/svg.d.ts).
* **Chuyển đổi Hooks nghiệp vụ**: 
  - [useDetailedVideoLogic.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/hooks/useDetailedVideoLogic.ts): Sử dụng HTML5 Video Element Ref để theo dõi timeline và đồng bộ trạng thái phát.
  - [useVocabFlashcardData.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/hooks/useVocabFlashcardData.ts) và [usePremium.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/hooks/usePremium.ts): Tích hợp định tuyến Next.js Router để chuyển trang kết quả học tập.
  - [useConversationDetail.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/lib/hooks/useConversationDetail.ts): Thay thế `expo-speech` và `useFocusEffect` bằng Web SpeechSynthesis.
* **Tái cấu trúc UI Components**: Chuyển đổi toàn bộ [SubtitleRow.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/bilingual/SubtitleRow.tsx), [HighlightedText.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/HighlightedText.tsx), [FlashcardC.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/flashcard/FlashcardC.tsx) (lật 3D bằng CSS thuần), [FlashcardControls.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/flashcard/FlashcardControls.tsx), [SubtitleItem.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/video/SubtitleItem.tsx), [VideoDetailedVocabExercise.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/video/VideoDetailedVocabExercise.tsx), và [WordInfoModal.tsx](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/components/video/WordInfoModal.tsx) từ các thẻ di động sang HTML5 và Tailwind CSS.
* **Dịch vụ phụ đề**: Tạo [services/subtitle.ts](file:///c:/Users/ADMIN/Code/CDSL/CLA/cla-web/services/subtitle.ts) triển khai trình phân giải file SRT song ngữ.

