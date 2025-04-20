
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../integrations/firebase/client';

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
  deleteDocument: (id: string) => Promise<void>;
  shareDocument: (id: string) => Promise<{ url: string; qrCode: string }>;
  toggleVerifyDocument: (id: string) => Promise<void>;
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
  const { user } = useAuth(); // Removed session as it doesn't exist in our Firebase auth context

  // Fetch documents when user changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) {
        setDocuments([]);
        return;
      }

      setLoading(true);
      try {
        // Query Firestore for documents belonging to this user
        const q = query(
          collection(db, 'documents'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const docs = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Generate URLs for the documents
            const storageRef = ref(storage, data.storagePath);
            const url = await getDownloadURL(storageRef);
            
            // Generate preview if it's an image
            let preview: string | undefined;
            if (data.type.startsWith('image/')) {
              preview = url; // For simplicity, use the same URL as preview
            } else {
              preview = '/placeholder.svg';
            }
            
            return {
              id: doc.id,
              name: data.name,
              type: data.type,
              size: data.size,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              url: url,
              shared: data.shared,
              verified: data.verified,
              preview
            };
          })
        );

        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const uploadDocument = async (file: File) => {
    if (!user) {
      toast.error('Please login to upload documents');
      return;
    }

    try {
      setLoading(true);
      
      // Create a unique path for the file
      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${user.id}/${uuidv4()}.${fileExt}`;
      const storageRef = ref(storage, filePath);
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Add document metadata to Firestore
      const docRef = await addDoc(collection(db, 'documents'), {
        userId: user.id,
        name: file.name,
        type: file.type,
        size: file.size,
        storagePath: filePath,
        shared: false,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`${file.name} uploaded successfully`);
      
      // Generate preview if it's an image
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = downloadUrl;
      } else {
        preview = '/placeholder.svg';
      }
      
      // Add document to state
      const newDoc: Document = {
        id: docRef.id,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: downloadUrl,
        shared: false,
        verified: false,
        preview
      };

      setDocuments(prev => [newDoc, ...prev]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      // First, get the document to get the storage path
      const docRef = doc(db, 'documents', id);
      const docSnap = await getDocs(query(collection(db, 'documents'), where('__name__', '==', id)));
      
      if (!docSnap.empty) {
        const document = docSnap.docs[0].data();
        
        // Delete from storage
        const storageRef = ref(storage, document.storagePath);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        await deleteDoc(docRef);
        
        // Update state
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast.success('Document deleted successfully');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const shareDocument = async (id: string) => {
    try {
      // Update the shared status in Firestore
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        shared: true
      });
      
      // Update local state
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? { ...doc, shared: true } : doc)
      );
      
      // Generate sharing URL and QR code
      const sharingUrl = `${window.location.origin}/shared/${id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(sharingUrl)}`;
      
      return { 
        url: sharingUrl, 
        qrCode: qrCodeUrl 
      };
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error(error.message || 'Failed to share document');
      throw error;
    }
  };

  const toggleVerifyDocument = async (id: string) => {
    try {
      // Get the document to check current verification status
      const docRef = doc(db, 'documents', id);
      const docSnap = await getDocs(query(collection(db, 'documents'), where('__name__', '==', id)));
      
      if (!docSnap.empty) {
        const document = docSnap.docs[0].data();
        const newVerifiedStatus = !document.verified;
        
        // Update verification status
        await updateDoc(docRef, {
          verified: newVerifiedStatus
        });
        
        // Update local state
        setDocuments(prev => 
          prev.map(doc => doc.id === id ? { ...doc, verified: newVerifiedStatus } : doc)
        );
        
        if (newVerifiedStatus) {
          toast.success('Document verified successfully');
        } else {
          toast.info('Document verification removed');
        }
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Failed to update verification status');
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
