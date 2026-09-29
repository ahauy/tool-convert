import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import httpService from "@/services/httpService";
import { ApiUrl } from "@/consts/apiUrl";
import { base64Store } from "@/helpers/base64Store";
import { showError, showSuccess } from "@/helpers/toast";
import {
  ACCEPT_FILES,
  PREVIEW_LENGTH,
  downloadTextParts,
  formatBytes,
  getErrorMessage,
  getMediaKind,
  makePreview,
  normalizeFile,
  validateFile,
} from "@/helpers/file";

interface ConvertResponse {
  fileName: string;
  mimeType: string;
  size: number;
  base64: string; // Base64 "trần", không có tiền tố data:
}

// Chỉ giữ thông tin nhỏ trong state. Chuỗi Base64 đầy đủ nằm trong ref.
interface ResultMeta {
  fileName: string;
  mimeType: string;
  base64Length: number;
}

interface Props {
  onSendToDecoder?: () => void;
}

const FileToBase64 = ({ onSendToDecoder }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ResultMeta | null>(null);
  const [head, setHead] = useState(""); // chỉ PREVIEW_LENGTH ký tự đầu để hiển thị
  const [withPrefix, setWithPrefix] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Chuỗi đầy đủ: giữ ngoài state để React không phải theo dõi / render lại
  const base64Ref = useRef("");

  const prefix = meta ? `data:${meta.mimeType};base64,` : "";
  const activePrefix = withPrefix ? prefix : "";
  const totalLength = meta ? meta.base64Length + activePrefix.length : 0;
  const previewText = meta
    ? makePreview(activePrefix + head, totalLength)
    : "";

  const resetResult = () => {
    base64Ref.current = "";
    setMeta(null);
    setHead("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const normalized = normalizeFile(selected);
    const error = validateFile(normalized);

    resetResult();

    if (error) {
      showError(error);
      e.target.value = "";
      setFile(null);
      return;
    }

    setFile(normalized);
  };

  const handleConvert = async () => {
    if (!file) return;

    const kind = getMediaKind(file.type);
    if (!kind) return;

    try {
      setIsLoading(true);

      // Tên field phải khớp FileInterceptor('image' | 'video') ở backend
      const formData = new FormData();
      formData.append(kind, file);

      const url =
        kind === "image" ? ApiUrl.IMAGE_TO_BASE64 : ApiUrl.VIDEO_TO_BASE64;

      const { data } = await httpService.axios.post<ConvertResponse>(
        url,
        formData
      );

      base64Ref.current = data.base64;
      setHead(data.base64.slice(0, PREVIEW_LENGTH));
      setMeta({
        fileName: data.fileName,
        mimeType: data.mimeType,
        base64Length: data.base64.length,
      });
    } catch (error) {
      showError(await getErrorMessage(error, "Convert thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePrefix + base64Ref.current);
      showSuccess("Đã copy vào clipboard");
    } catch {
      showError("Không thể copy, hãy dùng nút Tải .txt");
    }
  };

  const handleDownloadTxt = () => {
    if (!meta) return;
    const baseName = meta.fileName.replace(/\.[^.]+$/, "");
    // Blob nhận mảng các đoạn -> không phải nối thành 1 chuỗi khổng lồ
    downloadTextParts([activePrefix, base64Ref.current], `${baseName}.base64.txt`);
  };

  const handleSendToDecoder = () => {
    // Luôn kèm tiền tố vì backend base64-to-* yêu cầu data URL
    base64Store.set(prefix + base64Ref.current);
    onSendToDecoder?.();
  };

  return (
    <div className="flex gap-6">
      {/* Upload */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Upload Image / Video</label>

        <input
          type="file"
          accept={ACCEPT_FILES}
          onChange={handleFileChange}
          className="rounded-md border p-2"
        />

        {file && (
          <div className="rounded-md border p-3 text-sm text-gray-500">
            <p>
              <strong>File:</strong> {file.name}
            </p>
            <p>
              <strong>Type:</strong> {file.type}
            </p>
            <p>
              <strong>Size:</strong> {formatBytes(file.size)}
            </p>
            <p>
              <strong>Loại:</strong>{" "}
              {getMediaKind(file.type) === "image" ? "Image" : "Video"}
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleConvert}
          disabled={!file || isLoading}
          isLoading={isLoading}
        >
          Convert
        </Button>
      </div>

      {/* Base64 */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="font-medium">Base64</label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={withPrefix}
              onChange={(e) => setWithPrefix(e.target.checked)}
            />
            Kèm tiền tố data URL
          </label>
        </div>

        {/* Chỉ hiển thị phần đầu; chuỗi đầy đủ không đưa vào DOM */}
        <textarea
          value={previewText}
          readOnly
          placeholder="Base64 sẽ xuất hiện ở đây..."
          className="min-h-[250px] w-full break-all rounded-md border p-3 text-xs"
        />

        {meta && (
          <>
            <p className="text-sm text-gray-500">
              {meta.mimeType} · {totalLength.toLocaleString()} ký tự
            </p>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleCopy}>
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTxt}
              >
                Tải .txt
              </Button>
              {onSendToDecoder && (
                <Button type="button" onClick={handleSendToDecoder}>
                  Chuyển sang Base64 → File
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileToBase64;
