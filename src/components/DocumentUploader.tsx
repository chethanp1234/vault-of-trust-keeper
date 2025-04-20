
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const DocumentUploader = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocuments();
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Check if user is logged in
    if (!user) {
      toast.error("You must be logged in to upload documents");
      return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size exceeds the 10MB limit");
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload PDF, JPG, PNG, or DOC files");
      return;
    }
    
    setIsUploading(true);
    
    // Simulate upload progress
    const intervalId = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(intervalId);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 200);
    
    try {
      await uploadDocument(file);
      setUploadProgress(100);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      clearInterval(intervalId);
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1000);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        isDragging ? 'border-digilocker-500 bg-digilocker-50' : 'border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-digilocker-100 rounded-full">
          <Upload className="h-8 w-8 text-digilocker-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">Upload Documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported formats: PDF, JPG, PNG, DOC, DOCX
          </p>
        </div>
        
        {isUploading ? (
          <div className="w-full space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        ) : (
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline"
            className="mt-2"
          >
            Select File
          </Button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />
      </div>
    </div>
  );
};
