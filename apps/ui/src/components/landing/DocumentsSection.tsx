import { DocumentsHeader } from './DocumentsHeader';
import { DocumentGrid } from './DocumentGrid';
import { Document } from '@/store/documentStore';

interface DocumentsSectionProps {
  documents: Document[];
  loading: boolean;
  isAuthenticated: boolean;
  searchTerm: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onEditDocument: (doc: Document) => void;
  onViewDocument?: (doc: Document) => void;
  onShareDocument?: (doc: Document) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  loading,
  isAuthenticated,
  searchTerm,
  sortBy,
  onSearchChange,
  onSortChange,
  onEditDocument,
  onViewDocument,
  onShareDocument,
}) => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <DocumentsHeader
          isAuthenticated={isAuthenticated}
          searchTerm={searchTerm}
          sortBy={sortBy}
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
        />

        <DocumentGrid
          documents={documents}
          loading={loading}
          searchTerm={searchTerm}
          isAuthenticated={isAuthenticated}
          onEditDocument={onEditDocument}
          onViewDocument={onViewDocument}
          onShareDocument={onShareDocument}
        />
      </div>
    </section>
  );
};