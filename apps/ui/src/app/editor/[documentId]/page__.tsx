// app/editor/[documentId]/page.tsx
'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { CollaborativeEditor } from '@/components/CollaborativeEditor';
// import { useYjsProvider } from '@/hooks/useYjsProvider';
// import { useDocumentStore } from '@/store/documentStore';

// export default function EditorPage() {
//   const params = useParams();
//   const router = useRouter();
//   const documentId = params.documentId as string;
//   const [token, setToken] = useState<string | null>(null);
  
//   const { currentDocument, fetchDocument, loading, error } = useDocumentStore();
//   const { ydoc, isConnected } = useYjsProvider(documentId, token);

//   useEffect(() => {
//     // Get token from localStorage
//     const storedToken = localStorage.getItem('auth-token');
//     if (!storedToken) {
//       router.push('/');
//       return;
//     }
//     setToken(storedToken);
//   }, [router]);

//   useEffect(() => {
//     if (documentId && token) {
//       fetchDocument(documentId);
//     }
//   }, [documentId, token, fetchDocument]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-lg">Loading document...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-lg text-red-500">{error}</div>
//       </div>
//     );
//   }

//   if (!currentDocument) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-lg">Document not found</div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen flex flex-col">
//       <header className="bg-white dark:bg-gray-900 border-b p-4">
//         <div className="flex items-center justify-between">
//           <h1 className="text-xl font-bold">{currentDocument.title}</h1>
//           <div className="flex items-center space-x-4">
//             <span className="text-sm text-gray-600 dark:text-gray-400">
//               {/* Owner: {currentDocument.owner.name} */}
//             </span>
//             <div className="flex items-center space-x-2">
//               {currentDocument.collaborators.map(({ user }) => (
//                 <div
//                   key={user.id}
//                   className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs"
//                   title={user.name}
//                 >
//                   {user.name[0].toUpperCase()}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </header>
//       <main className="flex-1">
//         <CollaborativeEditor ydoc={ydoc} isConnected={isConnected} />
//       </main>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CollaborativeEditor } from '@/components/CollaborativeEditor';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { Document } from '@/store/documentStore';


const DocumentPage: React.FC = () => {
  const params = useParams();
  const documentId = params.documentId as string;
  const { token, user } = useAuthStore();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId && token) {
      fetchDocument(documentId);
    }
  }, [documentId, token]);

  const fetchDocument = async (documentId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError('Document not found');
        } else if (response.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load document');
        }
        return;
      }

      const doc = await response.json();
      setDocument(doc);
    } catch (err) {
      console.error('Failed to fetch document:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!document || !token) return;

    try {
      setDocument(prev => prev ? { ...prev, title: newTitle } : null);
    } catch (error) {
      console.error('Failed to change title:', error);
    }
  };

  const handleTitleUpdate = async (newTitle: string) => {
    if (!document || !token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${document._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newTitle }),
        }
      );

      if (response.ok) {
        setDocument(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col justify-center items-center h-screen">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  if (!document) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-600">Document not found</div>
        </div>
      </ProtectedRoute>
    );
  }

  const isOwner = document.ownerId._id === user?.id;

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center space-x-4 flex-1">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </Link>
            
            {isOwner ? (
              <input
                type="text"
                value={document.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded px-2 py-1"
                onBlur={(e) => handleTitleUpdate(e.target.value)}
              />
            ) : (
              <h1 className="text-xl font-semibold">{document.title}</h1>
            )}
            
            <div className="text-sm text-gray-500">
              by {document.ownerId.name}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm ${
              document.isPublic 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {document.isPublic ? 'Public' : 'Private'}
            </div>
            
            <button
              onClick={() => {/* Add share functionality */}}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Share
            </button>
            
            {isOwner && (
              <button
                onClick={() => {/* Add settings functionality */}}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor
            documentId={documentId}
            doc={document}
            className="h-full"
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DocumentPage;