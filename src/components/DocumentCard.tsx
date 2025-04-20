
import { useState } from 'react';
import { FiDownload, FiCheck, FiShare2, FiTrash2 } from 'react-icons/fi';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Document, useDocuments } from '../context/DocumentContext';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { saveAs } from 'file-saver';

interface DocumentCardProps {
  document: Document;
}

export const DocumentCard = ({ document }: DocumentCardProps) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; qrCode: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { deleteDocument, shareDocument, toggleVerifyDocument } = useDocuments();

  const handleDownload = async () => {
    try {
      const response = await fetch(document.url);
      const blob = await response.blob();
      saveAs(blob, document.name);
      toast.success(`Downloading ${document.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const data = await shareDocument(document.id);
      setShareData(data);
      setIsShareOpen(true);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    toggleVerifyDocument(document.id);
  };

  const handleDelete = () => {
    deleteDocument(document.id);
  };

  const getFileIcon = () => {
    if (document.type.startsWith('image/')) {
      return (
        <img 
          src={document.preview} 
          alt={document.name}
          className="w-full h-32 object-cover rounded-t-lg"
        />
      );
    }
    
    return (
      <div className="flex items-center justify-center h-32 bg-gray-100 rounded-t-lg">
        <DocumentIcon type={document.type} />
      </div>
    );
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        {getFileIcon()}
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="truncate">
              <h3 className="font-medium truncate text-sm">{document.name}</h3>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(document.size)}
              </p>
            </div>
            {document.verified && (
              <div className="bg-green-100 p-1 rounded-full">
                <FiCheck className="h-3 w-3 text-green-600" />
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="p-2 bg-gray-50 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
          >
            <FiDownload className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleShare} 
            disabled={isLoading}
          >
            <FiShare2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleVerify}
          >
            <FiCheck className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          {shareData && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                <img 
                  src={shareData.qrCode} 
                  alt="QR Code"
                  className="w-48 h-48 border p-2 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Sharing Link</p>
                <div className="flex">
                  <input
                    value={shareData.url}
                    readOnly
                    className="flex-1 p-2 border rounded-l-md text-sm"
                  />
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareData.url);
                      toast.success('Link copied to clipboard');
                    }}
                    className="rounded-l-none"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentIcon = ({ type }: { type: string }) => {
  // Return different icons based on file type
  if (type.includes('pdf')) {
    return <div className="bg-red-100 p-4 rounded-lg">PDF</div>;
  } else if (type.includes('word') || type.includes('doc')) {
    return <div className="bg-blue-100 p-4 rounded-lg">DOC</div>;
  } else {
    return <div className="bg-gray-100 p-4 rounded-lg">FILE</div>;
  }
};
