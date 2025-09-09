'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentStore, Document } from '@/store/documentStore';
import Header from '@/components/Header';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HeroSection } from '@/components/landing/HeroSection';
import { DocumentsSection } from '@/components/landing/DocumentsSection';
import { CreateDocumentModal } from '@/components/modals/CreateDocumentModal';


const LandingPage: React.FC = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();
  
  // Authentication hook
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    clearError: clearAuthError,
  } = useAuth();

  // Document store hook
  const {
    loading: documentsLoading,
    error: documentsError,
    fetchPublicDocuments,
    fetchUserDocuments,
    createDocument,
    clearError: clearDocumentsError,
    getAllDocuments,
  } = useDocumentStore();

  // Load documents when authentication state changes
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // Always try to fetch public documents
        await fetchPublicDocuments();
        
        // Fetch user documents if authenticated
        if (isAuthenticated) {
          await fetchUserDocuments();
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      }
    };

    // Only load documents if not currently loading auth
    if (!authLoading) {
      loadDocuments();
    }
  }, [isAuthenticated, authLoading, fetchPublicDocuments, fetchUserDocuments]);

  // Get all available documents
  // const documents = React.useMemo(() => {
  //   if (isAuthenticated) {
  //     return getAllDocuments();
  //   }
  //   return publicDocuments || [];
  // }, [isAuthenticated, getAllDocuments, publicDocuments]);

  const documents = getAllDocuments()

  // Filter and sort documents
  const filteredDocuments = React.useMemo(() => {
    if (!Array.isArray(documents)) return [];
    
    return documents
    .filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc?.ownerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [documents, searchTerm, sortBy]);

  // Event handlers
  const handleCreateDocument = async (title: string, content: string) => {
    setIsCreating(true);
    
    try {
      const newDoc = await createDocument(title, content);
      
      // Close modal
      setShowCreateModal(false);
      
      // Navigate to the new document
      const created = newDoc as { _id?: string };
      router.push(`/editor/${created._id}`);
      
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDocument = (doc: Document) => {
    const docId = doc._id;
    if (docId) {
      router.push(`/editor/${docId}`);
    }
  };

  const handleViewDocument = (doc: Document) => {
    const docId = doc._id;
    if (docId) {
      router.push(`/viewer/${docId}`);
    }
  };

  const handleShareDocument = (doc: Document) => {
    // Implement share functionality
    navigator.clipboard.writeText(
      `${window.location.origin}/editor/${doc._id}`
    );
    // You could show a toast notification here
  };

  const handleErrorDismiss = () => {
    if (authError) clearAuthError();
    if (documentsError) clearDocumentsError();
  };

  // Show loading state while initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing application..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      {/* Error Display */}
      {(authError || documentsError) && (
        <ErrorAlert 
          error={
            authError?.message ||
            documentsError ||
            ''
          } 
          onDismiss={handleErrorDismiss} 
        />
      )}

      {/* Hero Section */}
      <HeroSection
        isAuthenticated={isAuthenticated}
        documentsCount={documents.length}
        onCreateDocument={() => setShowCreateModal(true)}
      />

      {/* Documents Section */}
      <DocumentsSection
        documents={filteredDocuments}
        loading={documentsLoading}
        isAuthenticated={isAuthenticated}
        searchTerm={searchTerm}
        sortBy={sortBy}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        onEditDocument={handleEditDocument}
        onViewDocument={handleViewDocument}
        onShareDocument={handleShareDocument}
      />

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDocument}
        isCreating={isCreating}
      />
    </div>
  );
};

export default LandingPage;