
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Image, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get ImgBB API key from environment variables
  const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "f702c9fb38b25c842d6a1efd12fe343c";
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Create form data for ImgBB API
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', selectedImage);
      
      // Mock progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return Math.min(newProgress, 90);
        });
      }, 300);
      
      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      if (data.success) {
        // Pass the direct URL to the parent component
        onImageUpload(data.data.url);
        toast.success('Image uploaded successfully');
        handleClearImage();
      } else {
        throw new Error(data.error?.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
        ref={fileInputRef}
      />
      
      {!selectedImage ? (
        <div 
          className="flex flex-col items-center p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" 
          onClick={triggerFilePicker}
        >
          <Image className="h-10 w-10 text-primary/50 mb-2" />
          <p className="text-sm text-center text-muted-foreground">
            Click to select an image<br />
            <span className="text-xs">JPG, PNG, GIF (max 5MB)</span>
          </p>
        </div>
      ) : (
        <div className="mt-2 relative">
          <div className="rounded-md overflow-hidden relative group">
            <img 
              src={previewUrl!} 
              alt="Preview" 
              className="w-full max-h-36 object-cover rounded-md" 
              loading="lazy"
            />
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {isUploading ? (
            <div className="mt-2">
              <Progress value={uploadProgress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <div className="mt-2 flex justify-end">
              <Button 
                size="sm" 
                onClick={handleUpload}
                className="rounded-full text-xs px-3 bg-primary hover:bg-primary/90"
              >
                Upload & Send
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
