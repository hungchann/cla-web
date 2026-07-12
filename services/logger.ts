type LogArgs = unknown[];

const isProd = process.env.NODE_ENV === "production";

function safeConsole(method: "log" | "info" | "warn" | "error", args: LogArgs) {
  try {
    console[method](...args);
  } catch {
    /* noop */
  }
}

/**
 * Logger wrapper — tất cả output bị tắt trong production build.
 *
 * Lý do: warn/error thường chứa thông tin nhạy cảm (API response, email, stack trace)
 * có thể bị đọc bằng Flipper, adb logcat, hoặc debugger trên thiết bị bị root.
 *
 * Nếu cần crash reporting trong production, hãy tích hợp Sentry hoặc Datadog
 * và forward logger.error() vào đó thay vì console.error().
 */
export const logger = {
  debug: (...args: LogArgs) => {
    if (isProd) return;
    safeConsole("log", args);
  },
  info: (...args: LogArgs) => {
    if (isProd) return;
    safeConsole("info", args);
  },
  warn: (...args: LogArgs) => {
    if (isProd) return;
    safeConsole("warn", args);
  },
  error: (...args: LogArgs) => {
    if (isProd) return;
    safeConsole("error", args);
  },
};
