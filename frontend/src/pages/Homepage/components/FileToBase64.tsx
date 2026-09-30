import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  base64: string;
}

interface Meta {
  fileName: string;
  mimeType: string;
  length: number;
  head: string;
}

interface Props {
  onSendToDecoder?: () => void;
}

const FileToBase64 = ({ onSendToDecoder }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [withPrefix, setWithPrefix] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const base64Ref = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prefix = meta && withPrefix ? `data:${meta.mimeType};base64,` : "";
  const totalLength = meta ? meta.length + prefix.length : 0;
  const previewText = meta ? makePreview(prefix + meta.head, totalLength) : "";

  const resetResult = () => {
    base64Ref.current = "";
    setMeta(null);
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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleConvert = async () => {
    if (!file) return;
    const kind = getMediaKind(file.type);
    if (!kind) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append(kind, file);

      const url = kind === "image" ? ApiUrl.IMAGE_TO_BASE64 : ApiUrl.VIDEO_TO_BASE64;
      const { data } = await httpService.axios.post<ConvertResponse>(url, formData);

      base64Ref.current = data.base64;
      setMeta({
        fileName: data.fileName,
        mimeType: data.mimeType,
        length: data.base64.length,
        head: data.base64.slice(0, PREVIEW_LENGTH),
      });
    } catch (error) {
      showError(await getErrorMessage(error, "Convert thất bại"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prefix + base64Ref.current);
      showSuccess("Đã copy vào clipboard");
    } catch {
      showError("Không thể copy, hãy dùng nút Tải .txt");
    }
  };

  const handleDownloadTxt = () => {
    if (!meta) return;
    const name = `${meta.fileName.replace(/\.[^.]+$/, "")}.base64.txt`;
    downloadTextParts([prefix, base64Ref.current], name);
  };

  const handleSendToDecoder = () => {
    if (!meta) return;
    base64Store.set(`data:${meta.mimeType};base64,${base64Ref.current}`);
    onSendToDecoder?.();
  };

  return (
    <div className="space-y-4 xs:space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tải lên Ảnh / Video</CardTitle>
          <CardDescription className="text-xs">
            Hỗ trợ: JPG, PNG, GIF, WebP, MP4, WebM, MOV (tối đa 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Chọn file</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_FILES}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className={`
                  flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6
                  transition-colors cursor-pointer
                  ${file ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700" : "hover:border-primary/50 hover:bg-accent"}
                `}
                onClick={handleFileSelect}
              >
                {file ? (
                  <div className="space-y-1 text-center">
                    <p className="font-medium text-sm truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMediaKind(file.type) === "image" ? "Ảnh" : "Video"} · {formatBytes(file.size)}
                    </p>
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); fileInputRef.current!.value = ""; resetResult(); }}>
                      Thay đổi
                    </Button>
                  </div>
                ) : (
                  <>
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-muted-foreground">Kéo thả file vào đây hoặc bấm để chọn</p>
                    <p className="text-xs text-muted-foreground/70">Hoặc bấm vào vùng này để chọn file</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleConvert}
            disabled={!file || isLoading}
            isLoading={isLoading}
            className="w-full xs:w-auto"
          >
            Chuyển đổi sang Base64
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kết quả Base64</CardTitle>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={withPrefix}
                onChange={(e) => setWithPrefix(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Kèm tiền tố data URL
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <textarea
            value={previewText}
            readOnly
            placeholder="Base64 sẽ xuất hiện ở đây sau khi chuyển đổi..."
            className="min-h-[200px] xs:min-h-[250px] w-full break-all rounded-lg border bg-muted/50 p-3 text-xs font-mono resize-y"
          />

          {meta && (
            <>
              <p className="text-xs text-muted-foreground">
                {meta.mimeType} · {totalLength.toLocaleString()} ký tự
              </p>

              <div className="flex flex-col xs:flex-row flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleCopy} className="w-full xs:w-auto">
                  Copy
                </Button>
                <Button type="button" variant="outline" onClick={handleDownloadTxt} className="w-full xs:w-auto">
                  Tải .txt
                </Button>
                {onSendToDecoder && (
                  <Button type="button" onClick={handleSendToDecoder} className="w-full xs:w-auto">
                    Chuyển sang Base64 → File
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileToBase64;