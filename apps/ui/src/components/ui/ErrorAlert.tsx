import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  error: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onDismiss }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">{error}</p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-red-500 hover:text-red-700 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};