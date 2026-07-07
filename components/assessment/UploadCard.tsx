"use client";

import type { DragEvent } from "react";
import { UploadCloud } from "lucide-react";

type UploadCardProps = {
  isDragging: boolean;
  fileName?: string;
  duration?: number | null;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFile: (file?: File) => void;
};

export function UploadCard({
  isDragging,
  fileName,
  duration,
  onDragOver,
  onDragLeave,
  onDrop,
  onFile,
}: UploadCardProps) {
  return (
    <label
      className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed p-6 text-center transition duration-200 ${
        isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/50"
      }`}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        accept="audio/*"
        className="sr-only"
        type="file"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FAFAFA] text-blue-600 ring-1 ring-gray-200 transition group-hover:scale-105">
        <UploadCloud className="h-6 w-6" />
      </span>
      <span className="mt-4 text-base font-semibold text-gray-950">
        {fileName ?? "Drop audio here or browse"}
      </span>
      <span className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
        {duration
          ? `${duration.toFixed(1)} seconds detected`
          : "Secondary option: MP3, WAV, M4A, OGG, or WebM. Recording is the primary flow."}
      </span>
    </label>
  );
}
