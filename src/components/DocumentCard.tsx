
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDocuments, Document } from "../context/DocumentContext";
import { Download, Share, FileCheck, File, X, MoreHorizontal, QrCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DocumentCardProps {
  document: Document;
}

export const DocumentCard = ({ document }: DocumentCardProps) => {
  const { deleteDocument, shareDocument, toggleVerifyDocument } = useDocuments();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareInfo, setShareInfo] = useState<{ url: string; qrCode: string } | null>(null);

  const handleShare = () => {
    const info = shareDocument(document.id);
    setShareInfo(info);
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    if (shareInfo?.url) {
      navigator.clipboard.writeText(shareInfo.url);
      toast.success("Link copied to clipboard");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getIconByFileType = () => {
    if (document.verified) {
      return <FileCheck className="h-6 w-6 text-green-500" />;
    }
    return <File className="h-6 w-6 text-digilocker-500" />;
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-gray-100 relative">
          {document.preview ? (
            <img 
              src={document.preview} 
              alt={document.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {getIconByFileType()}
            </div>
          )}
          {document.verified && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 rounded-full p-1">
              <FileCheck className="h-4 w-4" />
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-1">
            <div className="font-medium truncate" title={document.name}>
              {document.name}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>{formatFileSize(document.size)}</span>
              <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => toast.info("Downloading document...")}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleVerifyDocument(document.id)}>
                <FileCheck className="h-4 w-4 mr-2" />
                {document.verified ? "Remove Verification" : "Verify Document"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteDocument(document.id)}
                className="text-red-600 focus:text-red-600"
              >
                <X className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-4">
              {shareInfo?.qrCode && (
                <div className="border p-2 rounded-md">
                  <img src={shareInfo.qrCode} alt="QR Code" width={150} height={150} />
                </div>
              )}
              <div className="flex items-center space-x-2 w-full">
                <Input 
                  readOnly 
                  value={shareInfo?.url || ""} 
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} size="sm">
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Add missing Input component
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input {...props} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ''}`} />;
};
