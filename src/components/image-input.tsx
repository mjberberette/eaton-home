"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/** Downscale to a sensible size so uploads (and demo-mode storage) stay light. */
async function resizeImage(file: File, maxEdge = 1400, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      quality
    )
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Image field: paste a URL or upload a photo.
 * Uploads go to Supabase Storage when connected; in demo mode the (resized)
 * image is stored inline so the feature still works without a backend.
 */
export function ImageInput({
  value,
  onChange,
  placeholder = "https://… or upload",
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const resized = await resizeImage(file);
      const supabase = createClient();
      if (supabase) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("project-images")
          .upload(path, resized, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("project-images").getPublicUrl(path);
        onChange(data.publicUrl);
      } else {
        // Demo mode: keep it inline (resized, so it stays small)
        onChange(await blobToDataUrl(resized));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — try a smaller photo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const preview = value && !busy ? value : null;

  return (
    <div>
      <div className="flex items-center gap-2">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg border border-white/15 object-cover"
          />
        )}
        <Input
          type="text"
          value={value.startsWith("data:") ? "(uploaded photo)" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={value.startsWith("data:")}
          className="glass-chip h-11 min-w-0 flex-1 rounded-xl font-light"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="glass-chip h-11 shrink-0 rounded-xl px-3 font-light"
          aria-label="Upload photo"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </Button>
      </div>
      {value.startsWith("data:") && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-1 text-[11px] font-light text-muted-foreground underline-offset-2 hover:underline"
        >
          Remove uploaded photo
        </button>
      )}
      {error && <p className="mt-1 text-xs font-light text-destructive">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
