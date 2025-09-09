import React from 'react';

// Main Logo Component
export const CollabDocsLogo = ({ size = 'md', variant = 'default', className = '' }: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'with-tagline' | 'icon-only';
  className?: string;
}) => {
  const sizes = {
    xs: { width: 24, height: 24, fontSize: 'text-sm' },
    sm: { width: 32, height: 32, fontSize: 'text-base' },
    md: { width: 40, height: 40, fontSize: 'text-lg' },
    lg: { width: 48, height: 48, fontSize: 'text-xl' },
    xl: { width: 64, height: 64, fontSize: 'text-2xl' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Icon */}
      <div className="relative">
        <svg
          width={currentSize.width}
          height={currentSize.height}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Background Circle with Gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>
            {/* Subtle shadow filter */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
            </filter>
          </defs>
          
          {/* Main background circle */}
          <circle 
            cx="20" 
            cy="20" 
            r="18" 
            fill="url(#bgGradient)" 
            filter="url(#shadow)"
          />
          
          {/* Document base */}
          <rect 
            x="10" 
            y="8" 
            width="20" 
            height="24" 
            rx="2" 
            fill="url(#iconGradient)" 
            opacity="0.95"
          />
          
          {/* Document fold corner */}
          <path 
            d="M26 8 L26 12 L30 12 Z" 
            fill="url(#iconGradient)" 
            opacity="0.7"
          />
          
          {/* Text lines */}
          <rect x="13" y="14" width="10" height="1.5" rx="0.75" fill="#3B82F6" opacity="0.8" />
          <rect x="13" y="17" width="14" height="1.5" rx="0.75" fill="#6366F1" opacity="0.6" />
          <rect x="13" y="20" width="8" height="1.5" rx="0.75" fill="#8B5CF6" opacity="0.6" />
          
          {/* Collaboration dots (representing multiple users) */}
          <circle cx="14" cy="26" r="1.5" fill="#3B82F6" opacity="0.9" />
          <circle cx="18" cy="26" r="1.5" fill="#6366F1" opacity="0.9" />
          <circle cx="22" cy="26" r="1.5" fill="#8B5CF6" opacity="0.9" />
          
          {/* Connection lines between dots */}
          <path 
            d="M15.5 26 Q16.75 24.5 18 26" 
            stroke="#6366F1" 
            strokeWidth="0.8" 
            fill="none" 
            opacity="0.6"
          />
          <path 
            d="M19.5 26 Q20.75 24.5 22 26" 
            stroke="#6366F1" 
            strokeWidth="0.8" 
            fill="none" 
            opacity="0.6"
          />
        </svg>
      </div>
      
      {/* Text Logo */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent ${currentSize.fontSize} leading-tight`}>
            CollabDocs
          </span>
          {variant === 'with-tagline' && (
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              Collaborate • Create • Share
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Logo variations for different use cases
const LogoShowcase = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Main Logo Display */}
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">CollabDocs Logo Variations</h1>
          
          {/* Hero Logo */}
          <div className="flex justify-center">
            <CollabDocsLogo size="xl" variant="with-tagline" />
          </div>
        </div>

        {/* Size Variations */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Size Variations</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
            <div className="text-center space-y-2">
              <CollabDocsLogo size="xs" />
              <span className="text-sm text-gray-600">Extra Small</span>
            </div>
            <div className="text-center space-y-2">
              <CollabDocsLogo size="sm" />
              <span className="text-sm text-gray-600">Small</span>
            </div>
            <div className="text-center space-y-2">
              <CollabDocsLogo size="md" />
              <span className="text-sm text-gray-600">Medium</span>
            </div>
            <div className="text-center space-y-2">
              <CollabDocsLogo size="lg" />
              <span className="text-sm text-gray-600">Large</span>
            </div>
            <div className="text-center space-y-2">
              <CollabDocsLogo size="xl" />
              <span className="text-sm text-gray-600">Extra Large</span>
            </div>
          </div>
        </div>

        {/* Variant Styles */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Style Variations</h2>
          <div className="space-y-6">
            
            {/* Default */}
            <div className="flex items-center space-x-4">
              <CollabDocsLogo size="lg" variant="default" />
              <div>
                <h3 className="font-semibold text-gray-800">Default</h3>
                <p className="text-gray-600 text-sm">Icon with text logo</p>
              </div>
            </div>

            {/* With Tagline */}
            <div className="flex items-center space-x-4">
              <CollabDocsLogo size="lg" variant="with-tagline" />
              <div>
                <h3 className="font-semibold text-gray-800">With Tagline</h3>
                <p className="text-gray-600 text-sm">Includes descriptive tagline</p>
              </div>
            </div>

            {/* Icon Only */}
            <div className="flex items-center space-x-4">
              <CollabDocsLogo size="lg" variant="icon-only" />
              <div>
                <h3 className="font-semibold text-gray-800">Icon Only</h3>
                <p className="text-gray-600 text-sm">Perfect for favicons and compact spaces</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Usage Examples</h2>
          
          {/* Header Example */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">Navigation Header</h3>
              <div className="bg-white p-4 rounded border shadow-sm">
                <div className="flex items-center justify-between">
                  <CollabDocsLogo size="md" />
                  <div className="flex space-x-4">
                    <button className="px-4 py-2 text-gray-600 hover:text-gray-900">Sign In</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Get Started</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Screen Example */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">Loading Screen</h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded border text-center">
                <CollabDocsLogo size="xl" variant="with-tagline" className="justify-center" />
                <div className="mt-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            </div>

            {/* Mobile App Icon */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3">App Icon / Favicon</h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center">
                  <CollabDocsLogo size="lg" variant="icon-only" />
                </div>
                <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center">
                  <CollabDocsLogo size="md" variant="icon-only" />
                </div>
                <div className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center">
                  <CollabDocsLogo size="sm" variant="icon-only" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Theme Example */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-white mb-6">Dark Theme Usage</h2>
          <div className="flex items-center justify-center space-x-8">
            <CollabDocsLogo size="lg" variant="with-tagline" />
          </div>
          <p className="text-gray-400 text-center mt-4">Logo maintains readability on dark backgrounds</p>
        </div>

        {/* Implementation Code */}
        <div className="bg-gray-100 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Implementation</h2>
          <div className="bg-gray-900 rounded-lg p-4 text-sm">
            <pre className="text-green-400">
{`// Basic Usage
<CollabDocsLogo size="md" />

// With tagline
<CollabDocsLogo size="lg" variant="with-tagline" />

// Icon only
<CollabDocsLogo size="sm" variant="icon-only" />

// Custom styling
<CollabDocsLogo 
  size="xl" 
  className="my-custom-class" 
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;