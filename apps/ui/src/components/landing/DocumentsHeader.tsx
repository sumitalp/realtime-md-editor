import { Search } from 'lucide-react';

interface DocumentsHeaderProps {
  isAuthenticated: boolean;
  searchTerm: string;
  sortBy: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export const DocumentsHeader: React.FC<DocumentsHeaderProps> = ({
  isAuthenticated,
  searchTerm,
  sortBy,
  onSearchChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {isAuthenticated ? 'Your Documents' : 'Public Documents'}
        </h3>
        <p className="text-gray-600">
          {isAuthenticated 
            ? 'Documents you own and collaborate on' 
            : 'Discover and explore shared documents'
          }
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-6 lg:mt-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
        >
          <option value="updatedAt">Recent</option>
          <option value="createdAt">Newest</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  );
};