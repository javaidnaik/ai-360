/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.624l-.219.874-.219-.874a1.5 1.5 0 00-1.023-1.023l-.874-.219.874-.219a1.5 1.5 0 001.023-1.023l.219-.874.219.874a1.5 1.5 0 001.023 1.023l.874.219-.874.219a1.5 1.5 0 00-1.023 1.023z" />
  </svg>
);

const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface HeaderProps {
    onShowGallery?: () => void;
    onBackToStart?: () => void;
    onShowEditor?: () => void;
    hasCreations: boolean;
    currentView?: 'start' | 'editor' | 'gallery' | 'creations';
}

const Header: React.FC<HeaderProps> = ({ 
  onShowGallery, 
  onBackToStart, 
  onShowEditor, 
  hasCreations, 
  currentView = 'start' 
}) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (action: () => void | undefined) => {
    if (action) action();
    closeMobileMenu();
  };

  return (
    <>
      <header className="w-full py-4 px-4 flex items-center justify-between relative">
        {/* Logo - Left Side */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToStart}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <SparkleIcon className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold tracking-tight text-gray-100">
              Pixshop
            </h1>
          </button>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex items-center gap-4">
          {currentView !== 'start' && (
            <button
              onClick={onBackToStart}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Home
            </button>
          )}
          {currentView !== 'editor' && (
            <button
              onClick={onShowEditor}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Create
            </button>
          )}
          {hasCreations && currentView !== 'creations' && (
            <button
              onClick={onShowGallery}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              My Creations
            </button>
          )}
        </nav>
        
        {/* Desktop User Info - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Welcome, {user.firstName}
              </span>
              
              {isSuperAdmin() && (
                <a 
                  href="/superadmin"
                  className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition"
                >
                  Admin
                </a>
              )}
              
              <button
                onClick={logout}
                className="bg-red-600/20 text-red-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-600/30 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Menu - Right Side */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <CloseIcon className="w-6 h-6" />
          ) : (
            <HamburgerIcon className="w-6 h-6" />
          )}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu}>
          <div 
            className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900/95 backdrop-blur-md border-l border-gray-700/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <SparkleIcon className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold text-gray-100">Pixshop</span>
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex flex-col p-4 space-y-1">
              {/* User Info */}
              {user && (
                <div className="mb-6 pb-4 border-b border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Welcome back</div>
                  <div className="text-lg font-medium text-gray-100">{user.firstName}</div>
                </div>
              )}

              {/* Navigation Links */}
              {currentView !== 'start' && (
                <button
                  onClick={() => handleNavClick(onBackToStart)}
                  className="flex items-center gap-3 w-full p-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </button>
              )}
              
              {currentView !== 'editor' && (
                <button
                  onClick={() => handleNavClick(onShowEditor)}
                  className="flex items-center gap-3 w-full p-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create
                </button>
              )}
              
              {hasCreations && currentView !== 'creations' && (
                <button
                  onClick={() => handleNavClick(onShowGallery)}
                  className="flex items-center gap-3 w-full p-3 text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  My Creations
                </button>
              )}

              {/* Admin Panel Link */}
              {user && isSuperAdmin() && (
                <a 
                  href="/superadmin"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 w-full p-3 text-left text-purple-300 hover:text-purple-200 hover:bg-purple-600/10 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </a>
              )}
            </div>

            {/* Mobile Menu Footer */}
            {user && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="flex items-center gap-3 w-full p-3 text-left text-red-300 hover:text-red-200 hover:bg-red-600/10 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;