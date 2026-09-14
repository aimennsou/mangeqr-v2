'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, Pencil, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { uploadToS3 } from '@/lib/s3';
import { cn } from '@/lib/utils';

interface CoverImageUploadProps {
  /** Called with the uploaded S3 file key. */
  onUploaded: (fileKey: string) => void;
  /** Pre-existing image URL (edit flows) shown until a new one is picked. */
  initialUrl?: string | null;
  /** Overlay + a11y label for the change action. */
  changeLabel: string;
  /** Prompt shown in the empty drop zone. */
  emptyLabel: string;
  className?: string;
}

/**
 * Shared cover/photo upload field with a consistent editorial look:
 * a framed rounded box that is a drop zone when empty, and shows the image
 * with a hover "change" overlay + an upload spinner once a photo is present.
 * Drag-and-drop and click both work; uploads to S3 and reports the key up.
 */
export default function CoverImageUpload({
  onUploaded,
  initialUrl,
  changeLabel,
  emptyLabel,
  className
}: CoverImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const hasImage = !!preview;

  const { getRootProps, getInputProps, open } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    noClick: hasImage, // once there's an image, only the overlay button reopens the picker
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key) {
          toast.error('Merci de réessayer');
          return;
        }
        onUploaded(data.file_key);
        toast.success('Votre image a été transmise avec succès !');
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    }
  });

  return (
    <div
      {...getRootProps({
        className: cn(
          'group relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-muted/40 transition-colors focus:outline-none',
          hasImage ? 'border-border' : 'border-dashed border-border hover:border-yellow-400/60',
          className
        )
      })}
    >
      <input {...getInputProps()} />
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview!} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            title={changeLabel}
            aria-label={changeLabel}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-medium text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100"
          >
            <Pencil className="h-4 w-4" /> {changeLabel}
          </button>
          {uploading ? (
            <span className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>
            {emptyLabel}
            <span className="block text-xs opacity-70">.jpg · .jpeg · .png</span>
          </span>
        </div>
      )}
    </div>
  );
}
