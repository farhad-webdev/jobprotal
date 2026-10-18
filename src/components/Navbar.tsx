import React from 'react';
import { Bookmark, PlusCircle, LayoutDashboard, Search, Home, Sparkles, Shield, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  savedCount: number;
  activeJobsCount: number;
  adminUser: { email: string; role: 'admin' | 'editor' } | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, savedCount, activeJobsCount, adminUser, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 text-slate-900 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand - Graphic Only (No Text) */}
        <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('/')} title="Home">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 group-hover:scale-105 group-hover:shadow-indigo-600/40 transition-all duration-300 ring-2 ring-white">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Navigation Tabs - Pill Container with smooth transitions */}
        <nav className="hidden md:flex items-center space-x-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <button
            onClick={() => onNavigate('/')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
              currentPath === '/'
                ? 'bg-white text-indigo-700 shadow-md font-semibold ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Home className="w-4 h-4 transition-transform duration-300" />
            <span>Home</span>
          </button>

          <button
            onClick={() => onNavigate('/jobs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
              currentPath === '/jobs' || currentPath.startsWith('/jobs/')
                ? 'bg-white text-indigo-700 shadow-md font-semibold ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Search className="w-4 h-4 transition-transform duration-300" />
            <span>Browse Jobs</span>
            <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold transition-colors duration-300 ${
              currentPath === '/jobs' || currentPath.startsWith('/jobs/')
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {activeJobsCount}
            </span>
          </button>

          <button
            onClick={() => onNavigate('/saved')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
              currentPath === '/saved'
                ? 'bg-white text-indigo-700 shadow-md font-semibold ring-1 ring-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Bookmark className="w-4 h-4 transition-transform duration-300" />
            <span>Saved Jobs</span>
            {savedCount > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold transition-colors duration-300 ${
                currentPath === '/saved' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {savedCount}
              </span>
            )}
          </button>

          {/* Only show Admin CMS tab if logged in as admin */}
          {adminUser && (
            <button
              onClick={() => onNavigate('/admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
                currentPath === '/admin'
                  ? 'bg-white text-indigo-700 shadow-md font-semibold ring-1 ring-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 transition-transform duration-300" />
              <span>Admin CMS</span>
            </button>
          )}
        </nav>

        {/* Quick Action & Admin Login / Status */}
        <div className="flex items-center space-x-3">
          {adminUser ? (
            <div className="hidden lg:flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all duration-300">
              <User className="w-4 h-4 text-indigo-600" />
              <div className="text-xs">
                <p className="font-semibold text-slate-900 truncate max-w-[120px]">{adminUser.email}</p>
                <p className="text-[10px] text-indigo-600 capitalize">{adminUser.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1 hover:bg-indigo-100 rounded-lg text-slate-500 hover:text-slate-800 ml-1 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          <button
            onClick={() => onNavigate('/admin')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Job</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 py-2.5 bg-white shadow-sm">
        <button
          onClick={() => onNavigate('/')}
          className={`flex flex-col items-center text-xs transition-all duration-300 ${currentPath === '/' ? 'text-indigo-600 font-semibold scale-105' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Home className="w-5 h-5 mb-1" />
          Home
        </button>
        <button
          onClick={() => onNavigate('/jobs')}
          className={`flex flex-col items-center text-xs transition-all duration-300 ${currentPath === '/jobs' ? 'text-indigo-600 font-semibold scale-105' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Search className="w-5 h-5 mb-1" />
          Jobs ({activeJobsCount})
        </button>
        <button
          onClick={() => onNavigate('/saved')}
          className={`flex flex-col items-center text-xs transition-all duration-300 ${currentPath === '/saved' ? 'text-indigo-600 font-semibold scale-105' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Bookmark className="w-5 h-5 mb-1" />
          Saved ({savedCount})
        </button>
        {adminUser && (
          <button
            onClick={() => onNavigate('/admin')}
            className={`flex flex-col items-center text-xs transition-all duration-300 ${currentPath === '/admin' ? 'text-indigo-600 font-semibold scale-105' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            CMS
          </button>
        )}
      </div>
    </header>
  );
};
