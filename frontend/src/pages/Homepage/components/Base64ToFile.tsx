import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import httpService from "@/services/httpService";
import { ApiUrl } from "@/consts/apiUrl";
import { base64Store } from "@/helpers/base64Store";
import { showError, showSuccess } from "@/helpers/toast";
import {
  PREVIEW_LENGTH,
  buildDataUrl,
  downloadBlob,
  extFromMime,
  formatBytes,
  getErrorMessage,
  getFileNameFromDisposition,
  getMediaKind,
  guessMimeFromBase64,
  makePreview,
  readDataUrlMime,
  type MediaKind,
} from "@/helpers/file";

// Chỉ giữ thông tin nhỏ trong state. Chuỗi Base64 đầy đủ nằm trong ref.
interface InputMeta {
  length: number;
  mimeType: string | null; // null = không nhận diện được
  hasPrefix: boolean;
}

interface Preview {
  url: string;
  kind: MediaKind;
  mimeType: string;
  fileName: string;
  blob: Blob;
}

interface Props {
  /** Tăng lên mỗi khi tab bên kia muốn chuyển chuỗi sang đây */
  incomingVersion?: number;
}

// Trình duyệt không hiển thị được HEIC, nên chỉ xem trước các loại còn lại
const canPreview = (mimeType: string) => mimeType !== "image/heic";

const Base64ToFile = ({ incomingVersion = 0 }: Props) => {
  const [meta, setMeta] = useState<InputMeta | null>(null);
  const [head, setHead] = useState(""); // chỉ PREVIEW_LENGTH ký tự đầu để hiển thị
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Chuỗi đầy đủ: giữ ngoài state/DOM
  const dataRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Giải phóng blob URL khi đổi kết quả hoặc rời trang
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const clearInput = () => {
    dataRef.current = "";
    setMeta(null);
    setHead("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Nhận chuỗi từ mọi nguồn (dán, file .txt, tab bên kia) mà không đưa vào DOM */
  const loadText = (text: string) => {
    const raw = text.trim();
    setPreview(null);

    if (!raw) {
      clearInput();
      return;
    }

    dataRef.current = raw;

    const prefixedMime = readDataUrlMime(raw);
    setMeta({
      length: raw.length,
      mimeType: prefixedMime ?? guessMimeFromBase64(raw),
      hasPrefix: !!prefixedMime,
    });
    setHead(raw.slice(0, PREVIEW_LENGTH));
  };

  // Nhận chuỗi từ tab "Ảnh / Video → Base64"
  useEffect(() => {
    if (incomingVersion > 0) {
      loadText(base64Store.take());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingVersion]);

  // Bắt sự kiện dán và CHẶN việc chuỗi lớn đi vào DOM (nguyên nhân chính gây lag)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    loadText(e.clipboardData.getData("text"));
  };

  const handlePasteButton = async () => {
    try {
      loadText(await navigator.clipboard.readText());
    } catch {
      showError("Không đọc được clipboard. Hãy bấm vào khung bên dưới rồi nhấn Ctrl+V");
    }
  };

  const handleTxtFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    try {
      loadText(await selected.text());
    } catch {
      showError("Không đọc được file");
    }
  };

  const handleConvert = async () => {
    const raw = dataRef.current;
    const mimeType = meta?.mimeType;

    if (!raw || !mimeType) {
      showError(
        "Không nhận diện được loại file. Hãy dùng dạng data:image/png;base64,... hoặc data:video/mp4;base64,..."
      );
      return;
    }

    const kind = getMediaKind(mimeType);
    if (!kind) {
      showError(`Loại file "${mimeType}" chưa được hỗ trợ`);
      return;
    }

    try {
      setIsLoading(true);

      // Backend BẮT BUỘC data URL; nếu người dùng đưa Base64 trần thì tự thêm tiền tố
      const dataUrl = meta?.hasPrefix ? raw : buildDataUrl(mimeType, raw);
      const url =
        kind === "image" ? ApiUrl.BASE64_TO_IMAGE : ApiUrl.BASE64_TO_VIDEO;

      // Chỉ gửi đúng 2 field này: backend bật forbidNonWhitelisted
      const response = await httpService.axios.post<Blob>(
        url,
        { base64: dataUrl, fileName: fileName.trim() || undefined },
        { responseType: "blob" }
      );

      const blob = response.data;
      const resultMime = blob.type || mimeType;
      const name =
        fileName.trim() ||
        getFileNameFromDisposition(response.headers["content-disposition"]) ||
        `file_${Date.now()}.${extFromMime(resultMime)}`;

      setPreview({
        url: URL.createObjectURL(blob),
        kind,
        mimeType: resultMime,
        fileName: name,
        blob,
      });
      showSuccess("Convert thành công");
    } catch (error) {
      setPreview(null);
      showError(await getErrorMessage(error, "Convert thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const previewText = meta ? makePreview(head, meta.length) : "";

  return (
    <div className="flex gap-6">
      {/* Nhập Base64 */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Base64</label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handlePasteButton}>
            Dán từ clipboard
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Chọn file .txt
          </Button>
          {meta && (
            <Button type="button" variant="outline" onClick={clearInput}>
              Xoá
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleTxtFile}
            className="hidden"
          />
        </div>

        {/* Khung nhận Ctrl+V: chỉ hiển thị phần đầu, chuỗi đầy đủ nằm trong ref */}
        <div
          tabIndex={0}
          role="textbox"
          aria-readonly="true"
          onPaste={handlePaste}
          className="min-h-[200px] w-full overflow-auto whitespace-pre-wrap break-all rounded-md border p-3 text-xs outline-none focus:ring-2 focus:ring-ring"
        >
          {previewText || (
            <span className="text-gray-500">
              Bấm vào đây rồi nhấn Ctrl+V để dán chuỗi Base64 (data:image/png;base64,...)
            </span>
          )}
        </div>

        {meta && (
          <p className="text-sm text-gray-500">
            {meta.mimeType ?? "Không nhận diện được loại file"} ·{" "}
            {meta.length.toLocaleString()} ký tự
            {!meta.hasPrefix && meta.mimeType && " · thiếu tiền tố, sẽ tự thêm"}
          </p>
        )}

        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          maxLength={255}
          placeholder="Tên file (không bắt buộc, ví dụ: anh-cua-toi.png)"
          className="rounded-md border p-2"
        />

        <Button
          type="button"
          onClick={handleConvert}
          disabled={!meta || isLoading}
          isLoading={isLoading}
        >
          Convert sang file
        </Button>
      </div>

      {/* Kết quả */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Kết quả</label>

        {!preview ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-md border text-sm text-gray-500">
            File sau khi convert sẽ hiển thị ở đây
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-md border p-3">
            {canPreview(preview.mimeType) &&
              (preview.kind === "image" ? (
                <img
                  src={preview.url}
                  alt={preview.fileName}
                  decoding="async"
                  className="max-h-[300px] w-full rounded-md object-contain"
                />
              ) : (
                <video
                  src={preview.url}
                  controls
                  preload="metadata"
                  className="max-h-[300px] w-full rounded-md"
                />
              ))}

            <div className="text-sm text-gray-500">
              <p>
                <strong>File:</strong> {preview.fileName}
              </p>
              <p>
                <strong>Type:</strong> {preview.mimeType}
              </p>
              <p>
                <strong>Size:</strong> {formatBytes(preview.blob.size)}
              </p>
              {!canPreview(preview.mimeType) && (
                <p className="mt-1">
                  Trình duyệt không xem trước được định dạng này, hãy tải về.
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => downloadBlob(preview.blob, preview.fileName)}
            >
              Tải xuống
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Base64ToFile;
