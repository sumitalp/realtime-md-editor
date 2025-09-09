'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CollaborativeEditor } from '@/components/CollaborativeEditor';
import { CollaboratorManagement } from '@/components/CollaboratorManagement';
import Header from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useDocumentStore, Document } from '@/store/documentStore';

interface DocumentData {
  _id: string;
  title: string;
  content: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
  };
  collaborators: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
      color?: string;
    };
    role: 'viewer' | 'editor' | 'owner';
    addedAt: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const DocumentPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;
  const { token, user, isInitialized } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const { error, loading, currentDocument, setCurrentDocument, fetchDocument } = useDocumentStore();

  useEffect(() => {
    if (documentId && token && isInitialized) {
      fetchDocument(documentId);
    }
  }, [documentId, token, isInitialized]);

  const document = currentDocument;
  console.log(document)

  const handleTitleUpdate = async (newTitle: string) => {
    if (!document || !token || newTitle.trim() === document.title) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${document._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newTitle.trim() }),
        }
      );

      if (response.ok) {
        const updatedDoc = await response.json();
        setCurrentDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpdate = (updatedDoc: Document) => {
    setCurrentDocument(updatedDoc);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!document) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="text-gray-600">Document not found</div>
        </div>
      </ProtectedRoute>
    );
  }

  const isOwner = document.ownerId._id === user?.id;
  const canEdit = isOwner || document.collaborators.some(c => 
    c.userId._id === user?.id && (c.role === 'editor' || c.role === 'owner')
  );

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <Header />

        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100"
              title="Back to Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex-1 min-w-0">
              {isOwner ? (
                <input
                  type="text"
                  value={document.title}
                  onChange={(e) => setCurrentDocument({...document, title: e.target.value})}
                  onBlur={(e) => handleTitleUpdate(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded-md px-2 py-1 w-full truncate"
                  disabled={saving}
                />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900 truncate">{document.title}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  by {document.ownerId.name}
                </span>
                {saving && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Document status badges */}
            <div className="flex items-center gap-2">
              {document.isPublic && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Public
                </span>
              )}
              
              {document.collaborators.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {document.collaborators.length} collaborator{document.collaborators.length !== 1 ? 's' : ''}
                </span>
              )}

              {!canEdit && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  View only
                </span>
              )}
            </div>
            
            {/* Share button */}
            <CollaboratorManagement 
              document={document}
              onDocumentUpdate={handleDocumentUpdate}
            />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor
            documentId={documentId}
            className="h-full"
            doc={document}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DocumentPage;