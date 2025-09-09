import { PlusCircle, Eye } from 'lucide-react';

interface HeroSectionProps {
  isAuthenticated: boolean;
  documentsCount: number;
  onCreateDocument: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  isAuthenticated,
  documentsCount,
  onCreateDocument,
}) => {

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-6">
          Collaborative Editing
          <span className="block text-blue-600">Made Simple</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Create, edit, and collaborate on documents in real-time. Experience seamless teamwork with our modern markdown editor.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {isAuthenticated ? (
            <button
              onClick={onCreateDocument}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Document</span>
            </button>
          ) : (
            <></>
          )}
          <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-300 hover:text-blue-700 font-semibold transition-all flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Browse Documents</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{documentsCount}</div>
            <div className="text-gray-600">Available Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">Real-time</div>
            <div className="text-gray-600">Collaboration</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">Markdown</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};