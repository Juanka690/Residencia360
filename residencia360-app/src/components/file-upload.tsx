"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALLOWED_MIME_TYPES,
  buildObjectPath,
  MAX_FILE_BYTES,
  uploadFromBrowser,
  validateFile,
  type StorageBucket,
} from "@/lib/supabase-storage";

export type UploadedFile = {
  fileName: string;
  path: string;
  publicUrl: string | null;
  size: number;
  contentType: string;
};

type FileUploadProps = {
  bucket: StorageBucket;
  pathPrefix?: string;
  onUploaded(file: UploadedFile): void;
  onCleared?(): void;
  buttonLabel?: string;
  helperText?: string;
  disabled?: boolean;
};

export function FileUpload({
  bucket,
  pathPrefix = "general",
  onUploaded,
  onCleared,
  buttonLabel = "Subir archivo",
  helperText,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.ok) {
      toast.error(validation.reason);
      return;
    }

    startTransition(async () => {
      try {
        const path = buildObjectPath(pathPrefix, file.name);
        const { publicUrl } = await uploadFromBrowser(bucket, path, file);
        const uploaded: UploadedFile = {
          fileName: file.name,
          path,
          publicUrl,
          size: file.size,
          contentType: file.type,
        };
        setCurrentFile(uploaded);
        onUploaded(uploaded);
        toast.success("Archivo cargado.");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al subir archivo.";
        toast.error(message);
      }
    });
  };

  const handleClear = () => {
    setCurrentFile(null);
    onCleared?.();
  };

  const allowed = Array.from(ALLOWED_MIME_TYPES).join(",");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={disabled || isPending} onClick={handlePick}>
          {isPending ? "Subiendo..." : currentFile ? "Cambiar archivo" : buttonLabel}
        </Button>
        {currentFile ? (
          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleClear}>
            Quitar
          </Button>
        ) : null}
      </div>

      {currentFile ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <div className="font-medium">{currentFile.fileName}</div>
          <div className="text-slate-500">
            {(currentFile.size / 1024).toFixed(1)} KB - {currentFile.contentType || "tipo desconocido"}
          </div>
        </div>
      ) : null}

      {helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : (
        <p className="text-[11px] text-slate-500">
          Maximo {Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB. Formatos permitidos: PDF, imagenes, Word, Excel.
        </p>
      )}

      <Input
        ref={inputRef}
        type="file"
        accept={allowed}
        className="hidden"
        onChange={handleChange}
        disabled={disabled || isPending}
      />
    </div>
  );
}
