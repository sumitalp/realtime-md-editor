import { FileText } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Document {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  collaborators: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    role: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface DocumentGridProps {
  documents: Document[];
  loading: boolean;
  searchTerm: string;
  isAuthenticated: boolean;
  onEditDocument: (doc: Document) => void;
  onViewDocument?: (doc: Document) => void;
  onShareDocument?: (doc: Document) => void;
}

export const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  loading,
  searchTerm,
  isAuthenticated,
  onEditDocument,
  onViewDocument,
  onShareDocument,
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading documents..." />;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No documents found</h4>
        <p className="text-gray-600">
          {searchTerm 
            ? 'Try adjusting your search' 
            : isAuthenticated 
              ? 'Create your first document to get started' 
              : 'No public documents available'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id || doc._id}
          document={doc}
          onEdit={onEditDocument}
          onView={onViewDocument}
          onShare={onShareDocument}
        />
      ))}
    </div>
  );
};