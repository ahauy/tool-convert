import axios from "axios";

export type MediaKind = "image" | "video";

const MB = 1024 * 1024;

// Phải khớp với backend (tools.controller.ts)
export const MAX_SIZE: Record<MediaKind, number> = {
  image: 10 * MB,
  video: 50 * MB,
};

const ALLOWED_MIME: Record<MediaKind, RegExp> = {
  image: /^image\/(jpeg|png|webp|gif|heic)$/,
  video: /^video\/(mp4|webm|ogg|quicktime|x-msvideo|x-matroska)$/,
};

export const KIND_LABEL: Record<MediaKind, string> = {
  image: "ảnh",
  video: "video",
};

// Thuộc tính accept của <input type="file">
export const ACCEPT_FILES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  ".heic",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  ".mkv",
].join(",");

const EXT_TO_MIME: Record<string, string> = {
  heic: "image/heic",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
};

export const getMediaKind = (mimeType: string): MediaKind | null => {
  if (ALLOWED_MIME.image.test(mimeType)) return "image";
  if (ALLOWED_MIME.video.test(mimeType)) return "video";
  return null;
};

/**
 * Một số trình duyệt (Chrome trên Windows/Linux) trả file.type = "" với .heic/.mkv.
 * Khi đó FormData sẽ gửi application/octet-stream và backend từ chối,
 * nên gán lại MIME theo đuôi file.
 */
export const normalizeFile = (file: File): File => {
  if (file.type) return file;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = EXT_TO_MIME[ext];
  return type ? new File([file], file.name, { type }) : file;
};

/** Trả về thông báo lỗi, hoặc null nếu file hợp lệ */
export const validateFile = (file: File): string | null => {
  const kind = getMediaKind(file.type);
  if (!kind) {
    return "Định dạng không được hỗ trợ. Ảnh: JPEG, PNG, WebP, GIF, HEIC. Video: MP4, WebM, OGG, MOV, AVI, MKV.";
  }
  if (file.size > MAX_SIZE[kind]) {
    return `File quá lớn, tối đa ${MAX_SIZE[kind] / MB}MB cho ${KIND_LABEL[kind]}.`;
  }
  return null;
};

export const extFromMime = (mimeType: string) => MIME_TO_EXT[mimeType] ?? "bin";

// ---------------- Base64 <-> Data URL ----------------

export const buildDataUrl = (mimeType: string, base64: string) =>
  `data:${mimeType};base64,${base64}`;

/** Nếu chuỗi đã là data URL hợp lệ -> trả về MIME (chỉ đọc phần đầu, không copy chuỗi lớn) */
export const readDataUrlMime = (value: string): string | null => {
  const head = value.slice(0, 300).trimStart();
  return head.match(/^data:([^;,]+);base64,/)?.[1] ?? null;
};

/** Đoán MIME của chuỗi Base64 "trần" (không có tiền tố) qua magic bytes */
export const guessMimeFromBase64 = (value: string): string | null => {
  try {
    let head = value.slice(0, 64).trimStart().slice(0, 32);
    head = head.slice(0, head.length - (head.length % 4)); // atob cần độ dài chia hết cho 4
    const bin = atob(head);
    const at = (from: number, to: number) => bin.slice(from, to);

    if (bin.startsWith("\xFF\xD8\xFF")) return "image/jpeg";
    if (bin.startsWith("\x89PNG")) return "image/png";
    if (bin.startsWith("GIF8")) return "image/gif";
    if (bin.startsWith("RIFF") && at(8, 12) === "WEBP") return "image/webp";
    if (bin.startsWith("OggS")) return "video/ogg";
    if (at(4, 8) === "ftyp") {
      const brand = at(8, 12);
      if (brand === "heic") return "image/heic";
      if (brand === "qt  ") return "video/quicktime";
      return "video/mp4"; // isom, mp41, mp42, avc1...
    }
    return null;
  } catch {
    return null;
  }
};

// ---------------- Tải file / lấy tên file ----------------

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Đọc tên file từ header Content-Disposition (dạng filename*=UTF-8''...).
 * Lưu ý: trình duyệt chỉ cho JS đọc header này khi backend bật
 * exposedHeaders: ['Content-Disposition'] trong enableCors().
 */
export const getFileNameFromDisposition = (header?: string): string | null => {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
};

// ---------------- Lỗi ----------------

/**
 * Lấy thông báo lỗi từ backend. Khi gọi API với responseType: "blob",
 * body lỗi cũng là Blob nên phải đọc ra text rồi parse JSON.
 */
export const getErrorMessage = async (
  error: unknown,
  fallback = "Có lỗi xảy ra"
): Promise<string> => {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.response?.status === 413) {
    return "Dữ liệu quá lớn so với giới hạn của server.";
  }

  let data: unknown = error.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      return fallback;
    }
  }

  const message = (data as { message?: unknown } | undefined)?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return fallback;
};

// ---------------- Hiệu năng: không đưa chuỗi khổng lồ vào DOM ----------------

/** Số ký tự tối đa được hiển thị trong giao diện (phần còn lại giữ ngoài DOM) */
export const PREVIEW_LENGTH = 1500;

/** Rút gọn để hiển thị. `head` chỉ cần chứa ít nhất PREVIEW_LENGTH ký tự đầu. */
export const makePreview = (head: string, totalLength: number): string =>
  totalLength > PREVIEW_LENGTH
    ? `${head.slice(0, PREVIEW_LENGTH)}…\n\n[Đã rút gọn: hiển thị ${PREVIEW_LENGTH.toLocaleString()} / ${totalLength.toLocaleString()} ký tự. Dùng Copy hoặc Tải .txt để lấy đầy đủ]`
    : head;

export const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

/** Lưu nhiều đoạn chuỗi thành file .txt mà không phải nối thành một chuỗi lớn */
export const downloadTextParts = (parts: string[], fileName: string) =>
  downloadBlob(new Blob(parts, { type: "text/plain;charset=utf-8" }), fileName);
