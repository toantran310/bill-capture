/* eslint-disable */
// @ts-nocheck
"use client";

import * as React from "react";

/**
 * Upload engine for the Openinary file uploader.
 * Vendored verbatim from https://openinary.dev/r/file-uploader.json
 * Do not modify this file.
 */

export interface SignedUpload {
  signature: string;
  expires: number;
  folder: string;
}

export interface UploadedFile {
  filename: string;
  path: string;
  size: number;
  url: string;
  prewarmedUrls?: string[];
  queuedTransformationUrls?: string[];
}

export type FileUploadStatus =
  | "idle"
  | "uploading"
  | "success"
  | "error"
  | "aborted";

export interface FileUploadState {
  id: string;
  file: File;
  name: string;
  size: number;
  status: FileUploadStatus;
  progress: number;
  previewUrl?: string;
  error?: string;
  result?: UploadedFile;
}

export interface UploadFileError {
  file: FileUploadState;
  message: string;
}

export const DEFAULT_ACCEPT: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/gif": [".gif"],
  "image/heic": [".heic", ".heif"],
  "image/heif": [".heic", ".heif"],
  "image/vnd.adobe.photoshop": [".psd"],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
};

export const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

export interface UseFileUploadOptions {
  baseUrl?: string;
  sign: () => Promise<SignedUpload> | SignedUpload;
  transformations?: string[];
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  concurrency?: number;
  onSuccess?: (files: UploadedFile[]) => void;
  onError?: (error: UploadFileError) => void;
  onProgress?: (file: FileUploadState, progress: number) => void;
}

function createId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function validateFile(
  file: File,
  accept: Record<string, string[]>,
  maxSize: number,
): string | null {
  if (file.size > maxSize) {
    const mb = (maxSize / (1024 * 1024)).toFixed(0);
    return `File exceeds the maximum size of ${mb}MB`;
  }
  const allowedExtensions = accept[file.type];
  const ext = extensionOf(file.name);
  const typeAllowed = allowedExtensions?.includes(ext);
  const extAllowed = Object.values(accept).some((exts) => exts.includes(ext));
  if (!typeAllowed && !extAllowed) {
    return `File type not allowed (${file.type || ext || "unknown"})`;
  }
  return null;
}

interface XhrUploadArgs {
  file: FileUploadState;
  baseUrl: string;
  signed: SignedUpload;
  transformations?: string[];
  onProgress: (progress: number) => void;
  registerXhr: (xhr: XMLHttpRequest) => void;
}

function uploadViaXhr({
  file,
  baseUrl,
  signed,
  transformations,
  onProgress,
  registerXhr,
}: XhrUploadArgs): Promise<UploadedFile> {
  return new Promise<UploadedFile>((resolve, reject) => {
    const form = new FormData();
    console.log("file", file);
    form.append("files", file.file, file.name);
    form.append("folder", signed.folder);
    form.append("signature", signed.signature);
    form.append("expires", String(signed.expires));
    if (transformations) {
      for (const t of transformations) form.append("transformations[]", t);
    }

    const xhr = new XMLHttpRequest();
    registerXhr(xhr);
    xhr.open("POST", `${baseUrl}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const uploaded = data.files?.[0];
          if (!uploaded) {
            reject(new Error("No file in response"));
          } else {
            resolve(uploaded);
          }
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));

    xhr.send(form);
  });
}

export function useFileUpload({
  baseUrl,
  sign,
  transformations,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles,
  multiple = true,
  concurrency = 3,
  onSuccess,
  onError,
  onProgress,
}: UseFileUploadOptions) {
  const resolvedBaseUrl =
    baseUrl ??
    (typeof window !== "undefined" ? (window as any).OPENINARY_URL : undefined) ??
    "";

  const [files, setFiles] = React.useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const xhrRef = React.useRef<Map<string, XMLHttpRequest>>(new Map());
  const previewUrlsRef = React.useRef<Set<string>>(new Set());
  const optionsRef = React.useRef({ onSuccess, onError, onProgress, transformations });
  React.useEffect(() => {
    optionsRef.current = { onSuccess, onError, onProgress, transformations };
  });

  const updateFile = React.useCallback(
    (id: string, patch: Partial<FileUploadState>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [],
  );

  const addFiles = React.useCallback(
    (list: FileList | File[]): FileUploadState[] => {
      const incoming = Array.from(list);
      const added: FileUploadState[] = [];
      for (const file of incoming) {
        const error = validateFile(file, accept, maxSize) ?? undefined;
        const isImage = file.type.startsWith("image/");
        const previewUrl =
          isImage && !error ? URL.createObjectURL(file) : undefined;
        if (previewUrl) previewUrlsRef.current.add(previewUrl);
        const state: FileUploadState = {
          id: createId(),
          file,
          name: file.name,
          size: file.size,
          status: error ? "error" : "idle",
          progress: 0,
          previewUrl,
          error,
        };
        added.push(state);
      }
      setFiles((prev) => (multiple ? [...prev, ...added] : added));
      return added;
    },
    [accept, maxSize, multiple],
  );

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
    const xhr = xhrRef.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrRef.current.delete(id);
    }
  }, []);

  const uploadOne = React.useCallback(
    async (
      fileState: FileUploadState,
      signed: SignedUpload,
    ): Promise<UploadedFile | null> => {
      updateFile(fileState.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
      });
      try {
        const result = await uploadViaXhr({
          file: fileState,
          baseUrl: resolvedBaseUrl,
          signed,
          transformations: optionsRef.current.transformations,
          onProgress: (progress) => {
            updateFile(fileState.id, { progress });
            optionsRef.current.onProgress?.(
              { ...fileState, progress },
              progress,
            );
          },
          registerXhr: (xhr) => xhrRef.current.set(fileState.id, xhr),
        });
        xhrRef.current.delete(fileState.id);
        updateFile(fileState.id, { status: "success", progress: 100, result });
        return result;
      } catch (err) {
        xhrRef.current.delete(fileState.id);
        if (err instanceof DOMException && err.name === "AbortError") {
          updateFile(fileState.id, { status: "aborted" });
          return null;
        }
        const message = err instanceof Error ? err.message : "Upload failed";
        updateFile(fileState.id, { status: "error", error: message });
        optionsRef.current.onError?.({ file: fileState, message });
        return null;
      }
    },
    [resolvedBaseUrl, updateFile],
  );

  const runQueue = React.useCallback(
    async (
      queue: FileUploadState[],
      signed: SignedUpload,
    ): Promise<UploadedFile[]> => {
      const limit = Math.max(1, concurrency);
      const results: UploadedFile[] = [];
      let cursor = 0;

      async function worker() {
        while (cursor < queue.length) {
          const current = queue[cursor++];
          const result = await uploadOne(current, signed);
          if (result) results.push(result);
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(limit, queue.length) }, worker),
      );
      return results;
    },
    [concurrency, uploadOne],
  );

  const upload = React.useCallback(async (): Promise<UploadedFile[]> => {
    const pending = files.filter(
      (f) => f.status === "idle" || f.status === "aborted",
    );
    if (pending.length === 0) return [];

    if (maxFiles !== undefined && pending.length > maxFiles) {
      const message = `You can upload at most ${maxFiles} file(s)`;
      for (const f of pending) {
        updateFile(f.id, { status: "error", error: message });
      }
      return [];
    }

    setIsUploading(true);
    try {
      const signed = await sign();
      const results = await runQueue(pending, signed);
      if (results.length > 0) optionsRef.current.onSuccess?.(results);
      return results;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign the upload";
      for (const f of pending) {
        updateFile(f.id, { status: "error", error: message });
      }
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [files, sign, maxFiles, runQueue, updateFile]);

  const retry = React.useCallback(
    async (id: string): Promise<UploadedFile | null> => {
      const target = files.find((f) => f.id === id);
      if (!target) return null;
      setIsUploading(true);
      try {
        const signed = await sign();
        const result = await uploadOne(target, signed);
        if (result) optionsRef.current.onSuccess?.([result]);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sign the upload";
        updateFile(id, { status: "error", error: message });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [files, sign, uploadOne, updateFile],
  );

  const abort = React.useCallback((id: string) => {
    const xhr = xhrRef.current.get(id);
    if (xhr) xhr.abort();
  }, []);

  const clear = React.useCallback(() => {
    for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
    previewUrlsRef.current.clear();
    for (const xhr of xhrRef.current.values()) xhr.abort();
    xhrRef.current.clear();
    setFiles([]);
  }, []);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    upload,
    retry,
    abort,
    clear,
  };
}

