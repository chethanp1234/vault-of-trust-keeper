
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  shared: boolean;
  verified: boolean;
  preview?: string;
}

interface DocumentContextType {
  documents: Document[];
  loading: boolean;
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (id: string) => void;
  shareDocument: (id: string) => { url: string; qrCode: string };
  toggleVerifyDocument: (id: string) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const storedDocs = localStorage.getItem('digilocker_documents');
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      } else {
        // Load demo documents
        const demoDocuments: Document[] = [
          {
            id: '1',
            name: 'Passport.pdf',
            type: 'application/pdf',
            size: 2500000,
            createdAt: '2023-01-15T12:00:00Z',
            updatedAt: '2023-01-15T12:00:00Z',
            url: '#',
            shared: false,
            verified: true,
            preview: '/placeholder.svg',
          },
          {
            id: '2',
            name: 'Driver_License.jpg',
            type: 'image/jpeg',
            size: 1200000,
            createdAt: '2023-02-20T10:30:00Z',
            updatedAt: '2023-02-20T10:30:00Z',
            url: '#',
            shared: true,
            verified: true,
            preview: '/placeholder.svg',
          },
          {
            id: '3',
            name: 'Vaccination_Certificate.pdf',
            type: 'application/pdf',
            size: 890000,
            createdAt: '2023-03-05T15:45:00Z',
            updatedAt: '2023-03-05T15:45:00Z',
            url: '#',
            shared: false,
            verified: false,
            preview: '/placeholder.svg',
          }
        ];
        setDocuments(demoDocuments);
        localStorage.setItem('digilocker_documents', JSON.stringify(demoDocuments));
      }
    } else {
      setDocuments([]);
    }
  }, [user]);

  const uploadDocument = async (file: File) => {
    try {
      setLoading(true);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: URL.createObjectURL(file),
        shared: false,
        verified: false,
        preview: file.type.includes('image') ? URL.createObjectURL(file) : '/placeholder.svg',
      };
      
      const updatedDocs = [...documents, newDoc];
      setDocuments(updatedDocs);
      localStorage.setItem('digilocker_documents', JSON.stringify(updatedDocs));
      
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocs);
    localStorage.setItem('digilocker_documents', JSON.stringify(updatedDocs));
    toast.success('Document deleted successfully');
  };

  const shareDocument = (id: string) => {
    const updatedDocs = documents.map(doc => 
      doc.id === id ? { ...doc, shared: true } : doc
    );
    setDocuments(updatedDocs);
    localStorage.setItem('digilocker_documents', JSON.stringify(updatedDocs));
    
    // In a real app, we would generate actual sharing URLs and QR codes
    return {
      url: `https://digilocker.example/share/${id}`,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://digilocker.example/share/${id}`
    };
  };

  const toggleVerifyDocument = (id: string) => {
    const updatedDocs = documents.map(doc => 
      doc.id === id ? { ...doc, verified: !doc.verified } : doc
    );
    setDocuments(updatedDocs);
    localStorage.setItem('digilocker_documents', JSON.stringify(updatedDocs));
    const doc = documents.find(d => d.id === id);
    
    if (doc?.verified) {
      toast.info(`Document verification removed`);
    } else {
      toast.success(`Document verified successfully`);
    }
  };

  const value = {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    shareDocument,
    toggleVerifyDocument
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};
