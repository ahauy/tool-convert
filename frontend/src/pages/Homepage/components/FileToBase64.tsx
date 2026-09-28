import { useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import httpService from "@/services/httpService";
import { ApiUrl } from "@/consts/apiUrl";

const FileToBase64 = () => {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setBase64("");
  };

  // xem la video hay image -> tu do goi url
  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsLoading(true);

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        alert("Chỉ được upload image hoặc video");
        return;
      }

      const formData = new FormData();

      let url = "";

      if (isImage) {
        formData.append("image", file);

        url = ApiUrl.IMAGE_TO_BASE64;
        console.log(url)
      } else {
        formData.append("video", file);

        url = ApiUrl.VIDEO_TO_BASE64;
      }

      const response = await httpService.axios.post(url, formData)

      setBase64(response.data.base64);
    } catch (error) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Convert thất bại");
      } else {
        alert("Convert thất bại");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Upload */}
      <div className="flex flex-1 flex-col gap-3">
        <label className="font-medium">Upload Image / Video</label>

        <input
          type="file"
          accept="image/*,video/*"
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
              <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

            <p>
              <strong>Loại:</strong>{" "}
              {file.type.startsWith("image/") ? "Image" : "Video"}
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
        <label className="font-medium">Base64</label>

        <textarea
          value={base64}
          onChange={(e) => setBase64(e.target.value)}
          placeholder="Base64 sẽ xuất hiện ở đây..."
          className="min-h-[250px] w-full rounded-md border p-3"
        />
      </div>
    </div>
  );
};

export default FileToBase64;
