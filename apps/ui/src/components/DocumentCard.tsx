import React from 'react';
import Link from 'next/link';

interface DocumentCardProps {
  document: {
    _id: string;
    title: string;
    content: string;
    updatedAt: string;
    ownerId: {
        _id: string;
      name: string;
      email: string;
    };
    collaborators: Array<{
      userId: {
        name: string;
        color?: string;
      };
    }>;
    isPublic: boolean;
  };
  currentUserId?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, currentUserId }) => {
  const isOwner = document.ownerId?._id === currentUserId;
  const collaboratorCount = document.collaborators.length;

  return (
    <Link href={`/document/${document._id}`}>
      <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {document.title}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              {document.isPublic && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Public
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {document.content.replace(/[#*`]/g, '').slice(0, 150)}...
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            {/* Collaborators */}
            <div className="flex items-center gap-2">
              {collaboratorCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {document.collaborators.slice(0, 3).map((collaborator, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: collaborator.userId.color || '#6B7280' }}
                        title={collaborator.userId.name}
                      >
                        {collaborator.userId.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {collaboratorCount > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs font-medium text-white">
                        +{collaboratorCount - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Date and Owner */}
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {new Date(document.updatedAt).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-400">
                {isOwner ? 'You' : `by ${document.ownerId.name}`}
              </div>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-5 transition-opacity duration-200 pointer-events-none"></div>
      </div>
    </Link>
  );
};