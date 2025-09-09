interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
    message = 'Loading...', 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };
  
    return (
      <div className="text-center py-12">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`} />
        <p className="text-gray-600">{message}</p>
      </div>
    );
  };