
import { DocumentUploader } from "../components/DocumentUploader";
import { useDocuments, Document } from "../context/DocumentContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronLeft, FileCheck } from "lucide-react";

const Upload = () => {
  const { documents, loading } = useDocuments();
  
  // Get only recently uploaded documents (last 5)
  const recentUploads = [...documents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Upload Documents</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <DocumentUploader />
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Need to verify your documents?</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FileCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Document Verification</h3>
                  <p className="mt-1 text-sm text-blue-600">
                    After uploading your documents, you can request verification from appropriate authorities.
                    Verified documents are marked with a verification badge.
                  </p>
                  <div className="mt-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      Learn more about verification
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-gray-50 border rounded-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-4">Recent Uploads</h2>
            {recentUploads.length > 0 ? (
              <div className="space-y-3">
                {recentUploads.map((doc: Document) => (
                  <div 
                    key={doc.id} 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100"
                  >
                    <div className="p-2 bg-white rounded border">
                      {doc.verified ? (
                        <FileCheck className="h-4 w-4 text-green-500" />
                      ) : (
                        <FileIcon className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet.
              </p>
            )}
          </div>
          
          <div className="mt-4 bg-gray-50 border rounded-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-2">Supported Formats</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>PDF documents (.pdf)</li>
              <li>Images (.jpg, .jpeg, .png)</li>
              <li>Microsoft Word (.doc, .docx)</li>
            </ul>
          </div>
          
          <div className="mt-4 bg-gray-50 border rounded-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-2">File Size Limits</h2>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 10MB per document
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default Upload;
