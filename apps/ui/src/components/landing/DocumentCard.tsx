import { 
    FileText, 
    Users, 
    Calendar, 
    Share2, 
    Clock, 
    Edit3 
  } from 'lucide-react';
import { Document } from '@/store/documentStore';
  
  interface DocumentCardProps {
    document: Document;
    onEdit: (doc: Document) => void;
    onShare?: (doc: Document) => void;
  }
  
  export const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    onEdit,
    onShare,
  }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
  
    const getInitials = (name: string) => {
      return name.split(/[\s-]+/).map(n => n[0]).join('').toUpperCase();
    };
  
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 transform hover:-translate-y-1 group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {document.title}
              </h4>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onShare && (
              <button 
                onClick={() => onShare(document)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={() => onEdit(document)}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
  
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {document.content ? `${document.content.substring(0, 100)}...` : 'No content yet...'}
        </p>
  
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-xs text-white">
              {getInitials(document.ownerId.name)}
            </div>
            <span className="text-sm text-gray-600">{document.ownerId.name}</span>
          </div>
          
          {document.collaborators.length > 0 && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">+{document.collaborators.length}</span>
            </div>
          )}
        </div>
  
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Updated {formatDate(document.updatedAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Created {formatDate(document.createdAt)}</span>
          </div>
        </div>
  
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex space-x-2">
            {/* {onView && (
              <button 
                onClick={() => onView(document)}
                className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
            )} */}
            <button
              onClick={() => onEdit(document)}
              className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    );
  };