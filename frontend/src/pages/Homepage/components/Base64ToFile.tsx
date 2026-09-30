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

interface InputMeta {
  length: number;
  mimeType: string | null;
  hasPrefix: boolean;
  head: string;
}

interface Preview {
  url: string;
  kind: MediaKind;
  mimeType: string;
  fileName: string;
  blob: Blob;
}

interface Props {
  incomingVersion?: number;
}

const Base64ToFile = ({ incomingVersion = 0 }: Props) => {
  const [meta, setMeta] = useState<InputMeta | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dataRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const clearInput = () => {
    dataRef.current = "";
    setMeta(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      head: raw.slice(0, PREVIEW_LENGTH),
    });
  };

  useEffect(() => {
    if (incomingVersion > 0) {
      loadText(base64Store.take());
    }
  }, [incomingVersion]);

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
    const mime = meta?.mimeType;

    if (!raw || !mime) {
      showError("Không nhận diện được loại file. Hãy dùng dạng data:image/png;base64,...");
      return;
    }

    const kind = getMediaKind(mime);
    if (!kind) {
      showError(`Loại file "${mime}" chưa được hỗ trợ`);
      return;
    }

    try {
      setIsLoading(true);
      const dataUrl = meta.hasPrefix ? raw : buildDataUrl(mime, raw);
      const url = kind === "image" ? ApiUrl.BASE64_TO_IMAGE : ApiUrl.BASE64_TO_VIDEO;

      const res = await httpService.axios.post<Blob>(
        url,
        { base64: dataUrl, fileName: fileName.trim() || undefined },
        { responseType: "blob" }
      );

      const blob = res.data;
      const resultMime = blob.type || mime;
      const name =
        fileName.trim() ||
        getFileNameFromDisposition(res.headers["content-disposition"]) ||
        `file_${Date.now()}.${extFromMime(resultMime)}`;

      setPreview({ url: URL.createObjectURL(blob), kind, mimeType: resultMime, fileName: name, blob });
      showSuccess("Convert thành công");
    } catch (error) {
      setPreview(null);
      showError(await getErrorMessage(error, "Convert thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const canShowPreview = preview && preview.mimeType !== "image/heic";

  return (
    <div className="flex gap-6">
      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Base64</label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handlePasteButton}>
            Dán từ clipboard
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
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

        <div
          tabIndex={0}
          role="textbox"
          aria-readonly="true"
          onPaste={(e) => {
            e.preventDefault();
            loadText(e.clipboardData.getData("text"));
          }}
          className="min-h-[200px] w-full overflow-auto whitespace-pre-wrap break-all rounded-md border p-3 text-xs outline-none focus:ring-2 focus:ring-ring"
        >
          {meta ? (
            makePreview(meta.head, meta.length)
          ) : (
            <span className="text-gray-500">
              Bấm vào đây rồi nhấn Ctrl+V để dán chuỗi Base64 (data:image/png;base64,...)
            </span>
          )}
        </div>

        {meta && (
          <p className="text-sm text-gray-500">
            {meta.mimeType ?? "Không nhận diện được loại file"} · {meta.length.toLocaleString()} ký tự
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

      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Kết quả</label>

        {!preview ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-md border text-sm text-gray-500">
            File sau khi convert sẽ hiển thị ở đây
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-md border p-3">
            {canShowPreview && (
              preview.kind === "image" ? (
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
              )
            )}

            <div className="text-sm text-gray-500">
              <p><strong>File:</strong> {preview.fileName}</p>
              <p><strong>Type:</strong> {preview.mimeType}</p>
              <p><strong>Size:</strong> {formatBytes(preview.blob.size)}</p>
              {!canShowPreview && (
                <p className="mt-1">Trình duyệt không xem trước được định dạng này, hãy tải về.</p>
              )}
            </div>

            <Button type="button" onClick={() => downloadBlob(preview.blob, preview.fileName)}>
              Tải xuống
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Base64ToFile;
