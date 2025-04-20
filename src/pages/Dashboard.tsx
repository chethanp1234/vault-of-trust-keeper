
import { useDocuments } from "../context/DocumentContext";
import { DocumentCard } from "../components/DocumentCard";
import { StatCard } from "../components/StatCard";
import { File, FileCheck, Share, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { documents } = useDocuments();
  
  // Calculate statistics
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter(doc => doc.verified).length;
  const sharedDocuments = documents.filter(doc => doc.shared).length;
  const verificationRate = totalDocuments > 0 
    ? Math.round((verifiedDocuments / totalDocuments) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <Link to="/upload">
          <Button className="bg-digilocker-600 hover:bg-digilocker-700">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Documents"
          value={totalDocuments}
          icon={<File className="h-4 w-4" />}
        />
        <StatCard
          title="Verified Documents"
          value={verifiedDocuments}
          description={`${verificationRate}% of documents verified`}
          icon={<FileCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Shared Documents"
          value={sharedDocuments}
          icon={<Share className="h-4 w-4" />}
        />
      </div>
      
      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Documents</h2>
          <Link to="#" className="text-sm text-digilocker-600 hover:text-digilocker-800">View all</Link>
        </div>
        
        {documents.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <File className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your first document to get started
            </p>
            <Link to="/upload">
              <Button className="mt-4 bg-digilocker-600 hover:bg-digilocker-700">
                Upload Document
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
