
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from "sonner";
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
  const { user, session } = useAuth();

  // Fetch documents when user changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user || !session) {
        setDocuments([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          const docsWithUrls = await Promise.all(
            data.map(async (doc) => {
              // Generate a temporary URL for each document
              const { data: urlData } = await supabase
                .storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry
              
              // Check if we need to generate a preview
              let preview: string | undefined;
              if (doc.type.startsWith('image/')) {
                const { data: previewData } = await supabase
                  .storage
                  .from('documents')
                  .createSignedUrl(doc.storage_path, 3600, {
                    transform: {
                      width: 300,
                      height: 300,
                      resize: 'cover'
                    }
                  });
                preview = previewData?.signedUrl;
              } else {
                preview = '/placeholder.svg';
              }

              return {
                id: doc.id,
                name: doc.name,
                type: doc.type,
                size: doc.size,
                createdAt: doc.created_at,
                updatedAt: doc.updated_at,
                url: urlData?.signedUrl || '',
                shared: doc.shared,
                verified: doc.verified,
                preview
              };
            })
          );

          setDocuments(docsWithUrls);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, session]);

  const uploadDocument = async (file: File) => {
    if (!user || !session) {
      toast.error('Please login to upload documents');
      return;
    }

    try {
      setLoading(true);
      
      // Create a unique path for the file
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create record in the documents table
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: file.name,
          type: file.type,
          size: file.size,
          storage_path: filePath,
          shared: false,
          verified: false
        });

      if (dbError) throw dbError;
      
      toast.success(`${file.name} uploaded successfully`);
      
      // Refresh documents list
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('storage_path', filePath)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const { data: urlData } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(filePath, 3600);
        
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          const { data: previewData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(filePath, 3600, {
              transform: {
                width: 300,
                height: 300,
                resize: 'cover'
              }
            });
          preview = previewData?.signedUrl;
        } else {
          preview = '/placeholder.svg';
        }

        const newDoc: Document = {
          id: data.id,
          name: data.name,
          type: data.type,
          size: data.size,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          url: urlData?.signedUrl || '',
          shared: data.shared,
          verified: data.verified,
          preview
        };

        setDocuments(prev => [newDoc, ...prev]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      // First get the document to get the storage path
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        // Delete from storage
        const { error: storageError } = await supabase
          .storage
          .from('documents')
          .remove([data.storage_path]);
        
        if (storageError) throw storageError;
        
        // Delete from database
        const { error: dbError } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);
        
        if (dbError) throw dbError;
        
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
      // Update the shared status in database
      const { error } = await supabase
        .from('documents')
        .update({ shared: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setDocuments(prev => 
        prev.map(doc => doc.id === id ? { ...doc, shared: true } : doc)
      );
      
      // In a real-world app, we would generate sharing tokens, but for now we'll simulate this
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
      // Get current verification status
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('verified')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (data) {
        const newVerifiedStatus = !data.verified;
        
        // Update verification status
        const { error } = await supabase
          .from('documents')
          .update({ verified: newVerifiedStatus })
          .eq('id', id);
        
        if (error) throw error;
        
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
