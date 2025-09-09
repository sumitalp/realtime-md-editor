import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CollabDocsLogo } from './Logo';


import { 
    LogIn,
    UserPlus
  } from 'lucide-react';

const Header = () => {
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);

    // Sign in form state
    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
  
    const [signInLoading] = useState(false);

    // Sign up form state
    const [signUpName, setSignUpName] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpLoading] = useState(false);

    const {
        user,
        isAuthenticated,
        login,
        register,
        logout,
        clearError,
        userInitials,
      } = useAuth();

  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      return;
    }

    try {
      await login({ email: signInEmail, password: signInPassword });
      setShowSignInModal(false);
      setSignInEmail('');
      setSignInPassword('');
    } catch (err) {
        console.log(err);
      // Error is already in the store, no need to handle here
    }
  };

  const handleSignUp = async () => {
    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      return;
    }

    if (signUpPassword.length < 6) {
      return;
    }

    try {
      await register({ name: signUpName, email: signUpEmail, password: signUpPassword });
      setShowSignUpModal(false);
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPassword('');
    } catch (error) {
      // Error is already in the store, no need to handle here
    }
  };

  const openSignInModal = () => {
    clearError();
    setShowSignInModal(true);
  };

  const openSignUpModal = () => {
    clearError();
    setShowSignUpModal(true);
  };

  const handleSignOut = async () => {
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');
    try {
        await logout();
      } catch (error) {
        // Error is already in the store, no need to handle here
      }
  };

    return (
        <>
        {/* Header */}
      {/* Header with auth state */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-16">
          <CollabDocsLogo />
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userInitials}
                  </div>
                  <span className="text-gray-700 font-medium">{user?.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={openSignInModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={openSignUpModal}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Sign In Modal */}
    {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Sign In</h3>
                <button
                  onClick={() => {
                    setShowSignInModal(false);
                    // setAuthError('');
                    setSignInEmail('');
                    setSignInPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {authError}
                  </div>
                )} */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={signInLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={signInLoading}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignInModal(false);
                      setShowSignUpModal(true);
                    //   setAuthError('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={signInLoading}
                  >
                    Sign Up Instead
                  </button>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={signInLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {signInLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-auto shadow-2xl transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create Account</h3>
                <button
                  onClick={() => {
                    setShowSignUpModal(false);
                    // setAuthError('');
                    setSignUpName('');
                    setSignUpEmail('');
                    setSignUpPassword('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {authError}
                  </div>
                )} */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={signUpLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={signUpLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Enter your password (min 6 characters)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={signUpLoading}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignUpModal(false);
                      setShowSignInModal(true);
                    //   setAuthError('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={signUpLoading}
                  >
                    Sign In Instead
                  </button>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={signUpLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {signUpLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    )
}

export default Header;