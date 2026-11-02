import { useRef, useCallback, useState, useEffect } from "react";
import { useAuth } from "@/store/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useFileUpload,
  type UploadedFile,
} from "@/components/openinary/use-file-upload";
import { api } from "@/api/client";
import { openinaryUrl, IMAGE_MIMES, compressImage } from "@/lib/utils";
import { Camera, RotateCw, AlertCircle } from "lucide-react";

const OPENINARY_BASE =
  (import.meta.env.VITE_OPENINARY_BASE_URL as string | undefined) ??
  "https://openinary.toantran.duckdns.org/api";

async function signUpload() {
  const res = await fetch("/api/openinary/sign", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Không thể ký upload");
  return res.json() as Promise<{ signature: string; expires: number; folder: string }>;
}

export default function CapturePage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onSuccess = useCallback(
    async (uploaded: UploadedFile[]) => {
      for (const f of uploaded) {
        try {
          await api.bills.save({
            path: f.path,
            originalName: f.filename,
            mimeType: "image/jpeg",
            size: f.size,
          });
          setSaveError(null);
        } catch (err) {
          setSaveError((err as Error).message);
        }
      }
    },
    []
  );

  const { files, isUploading, addFiles, upload, retry, clear } = useFileUpload({
    baseUrl: OPENINARY_BASE,
    sign: signUpload,
    multiple: false,
    onSuccess,
  });

  // Tự upload khi có file mới ở trạng thái "idle".
  const startedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const next = files.find(
      (f) => f.status === "idle" && !startedRef.current.has(f.id)
    );
    if (!next) return;
    startedRef.current.add(next.id);
    void upload();
  }, [files, upload]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (picked.length === 0) return;
      setIsProcessing(true);
      try {
        addFiles(await Promise.all(picked.map(compressImage)));
      } finally {
        setIsProcessing(false);
      }
    },
    [addFiles]
  );

  const handleCapture = () => {
    clear();
    inputRef.current?.click();
  };

  const currentFile = files[0] as (typeof files)[0] | undefined;

  return (
    <Layout>
      <div className="flex flex-col items-center gap-6 pt-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">Xin chào, {user?.displayName}!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chụp hóa đơn để lưu lại
          </p>
        </div>

        {/* Hidden camera input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Main capture button */}
        <Button
          size="xl"
          className="w-full h-20 text-xl gap-3 rounded-2xl shadow-lg"
          onClick={handleCapture}
          disabled={isUploading || isProcessing}
        >
          <Camera className="h-8 w-8" />
          {isProcessing ? "Đang xử lý ảnh..." : isUploading ? "Đang tải lên..." : "Chụp hóa đơn"}
        </Button>

        {/* Upload status card */}
        {currentFile && (
          <div className="w-full rounded-xl border border-border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate max-w-[70%]">
                {currentFile.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentFile.status === "uploading" && "Đang tải..."}
                {currentFile.status === "success" && "✅ Thành công"}
                {currentFile.status === "error" && "❌ Lỗi"}
                {currentFile.status === "aborted" && "Đã huỷ"}
              </span>
            </div>

            {currentFile.status === "uploading" && (
              <Progress value={currentFile.progress} />
            )}

            {currentFile.status === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {currentFile.error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void retry(currentFile.id)}
                  className="gap-1"
                >
                  <RotateCw className="h-3 w-3" />
                  Thử lại
                </Button>
              </div>
            )}

            {/* Show uploaded image ONCE using the server path — no local File preview, no URL swap */}
            {currentFile.status === "success" && currentFile.result && (
              <>
                {IMAGE_MIMES.includes(currentFile.file.type) ? (
                  <img
                    src={openinaryUrl(currentFile.result.path)}
                    alt="Hóa đơn vừa chụp"
                    className="w-full rounded-lg object-contain max-h-72"
                  />
                ) : (
                  <a
                    href={openinaryUrl(currentFile.result.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline text-sm"
                  >
                    Xem file: {currentFile.name}
                  </a>
                )}
              </>
            )}
          </div>
        )}

        {saveError && (
          <div className="w-full rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">
            Lỗi lưu hóa đơn: {saveError}
          </div>
        )}
      </div>
    </Layout>
  );
}

