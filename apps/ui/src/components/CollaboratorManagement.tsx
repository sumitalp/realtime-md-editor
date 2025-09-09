// components/CollaboratorManagement.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Document } from '@/store/documentStore';


interface CollaboratorManagementProps {
  document: Document;
  onDocumentUpdate: (updatedDoc: Document) => void;
}

export const CollaboratorManagement: React.FC<CollaboratorManagementProps> = ({
  document,
  onDocumentUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const { user, token } = useAuthStore();

  const isOwner = document.ownerId._id === user?.id;

  const addCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !token || !isOwner) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${document._id}/collaborators`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add collaborator');
      }

      const updatedDocument = await response.json();
      onDocumentUpdate(updatedDocument);
      setSuccess(`Successfully added ${email} as ${role}`);
      setEmail('');
      
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to add collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!isOwner || !token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${document._id}/collaborators/${collaboratorId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      const updatedDocument = await response.json();
      onDocumentUpdate(updatedDocument);
      setSuccess('Collaborator removed successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to remove collaborator');
    }
  };

  const togglePublic = async () => {
    if (!isOwner || !token) return;

    setIsTogglingPublic(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/documents/${document._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ title: document.title, isPublic: !document.isPublic }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Toggle error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update document visibility`);
      }

      const updatedDocument = await response.json();
      console.log('Document updated successfully:', {
        oldStatus: document.isPublic,
        newStatus: updatedDocument.isPublic
      });

      onDocumentUpdate(updatedDocument);
      setSuccess(
        updatedDocument.isPublic 
          ? 'Document is now public - anyone with the link can view it'
          : 'Document is now private - only you and collaborators can access it'
      );
      
      setTimeout(() => setSuccess(null), 4000);

    } catch (err: any) {
      console.error('Toggle public failed:', err);
      setError(err.message || 'Failed to update document visibility');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/document/${document._id}`;
    navigator.clipboard.writeText(shareLink);
    setSuccess('Share link copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        Share & Collaborate
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Share Document</h2>
                <p className="text-gray-600 mt-1">Collaborate with others on "{document.title}"</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Success/Error Messages */}
              {success && (
                <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              )}

              {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Quick Share Section */}
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Share</h3>
                
                {/* Public Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Make document public</h4>
                    <p className="text-sm text-gray-600">Anyone with the link can view this document</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={document.isPublic}
                      onChange={togglePublic}
                      disabled={!isOwner || isTogglingPublic}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Copy Link */}
                <button
                  onClick={copyShareLink}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-medium">Copy share link</span>
                  </div>
                </button>
              </div>

              {/* Add Collaborators Section */}
              {isOwner && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Collaborators</h3>
                  
                  <form onSubmit={addCollaborator} className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Add'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Current Collaborators */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  People with access ({1 + document.collaborators.length})
                </h3>
                
                <div className="space-y-3">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: document.ownerId.color || '#8B5CF6' }}
                      >
                        {document.ownerId.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {document.ownerId.name} {document.ownerId._id === user?.id && '(You)'}
                        </div>
                        <div className="text-sm text-gray-600">{document.ownerId.email}</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                      Owner
                    </span>
                  </div>

                  {/* Collaborators */}
                  {document.collaborators.map((collaborator) => (
                    <div key={collaborator.userId._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: collaborator.userId.color || '#6B7280' }}
                        >
                          {collaborator.userId.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {collaborator.userId.name} {collaborator.userId._id === user?.id && '(You)'}
                          </div>
                          <div className="text-sm text-gray-600">{collaborator.userId.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(collaborator.role)}`}>
                          {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => removeCollaborator(collaborator.userId._id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove collaborator"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {document.collaborators.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium mb-1">No collaborators yet</p>
                    <p className="text-sm">Add team members to start collaborating</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};