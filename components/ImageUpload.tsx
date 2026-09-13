'use client';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowDownToLine, LucideDownload, CloudIcon, Loader2 } from 'lucide-react';
import { uploadToS3 } from '@/lib/s3';
import { toast } from 'sonner';

interface FileUploadProps {
  setFileKey: (key: string) => void;
}

const ImageUpload: React.FC<FileUploadProps> = ({ setFileKey }) => {
  const [uploading, setUploading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, // Changed to accept all image files
    maxFiles: 1,
    onDrop: async (acceptedFiles: any[]) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) { // 10 MB size limit
        toast.error(
          
          'Fichier trop volumineux',
        );
        return;
      }

      // Show image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data.file_name) {
          toast.error(
            
         'Merci de réessayer',
          );
          return;
        }

        const fileKey = data.file_key;
        setFileKey(fileKey);


        toast.success(
        
         'Votre image a été transmise avec succès !',
        );
        
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-2">
      <div className="p-2 bg-card rounded-xl">

        
        <div
          {...getRootProps({
            className:
              'border cursor-pointer rounded-lg bg-muted/50 py-6 flex justify-center items-center flex-col focus:outline-none focus:ring-4 focus:ring-yellow-300/10',
          })}
        >
          <input {...getInputProps()} />
          {uploading ? (
    
              <Loader2 className='animate-spin mr-2' size={18} />
       
          ) : (
            <>
              <LucideDownload className="w-5 h-5 text-muted-foreground" />
              <p className="p-2 text-center text-sm text-muted-foreground">
                Déposez votre image ici, ou cliquez pour sélectionner (*'.jpg, '.jpeg', '.png')
              </p>
            </>
          )}
        </div>
        {imagePreview && (
          <div className="mt-4 flex justify-center">
            <img
              src={imagePreview}
              alt="Uploaded Preview"
              className="max-w-full h-auto rounded-lg border"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
