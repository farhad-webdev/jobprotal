import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { JobListView } from './components/JobListView';
import { JobDetailsView } from './components/JobDetailsView';
import { CategoryJobsView } from './components/CategoryJobsView';
import { SavedJobs } from './components/SavedJobs';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { Job } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [routeParam, setRouteParam] = useState<string | null>(null);
  
  // Admin auth state
  const [adminUser, setAdminUser] = useState<{ email: string; role: 'admin' | 'editor' } | null>(() => {
    try {
      const local = localStorage.getItem('jobpulse_admin_user');
      return local ? JSON.parse(local) : null;
    } catch {
      return null;
    }
  });

  const [savedJobs, setSavedJobs] = useState<Job[]>(() => {
    try {
      const local = localStorage.getItem('jobpulse_saved');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });

  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('jobpulse_saved', JSON.stringify(savedJobs));
    } catch (e) {
      console.error(e);
    }
  }, [savedJobs]);

  useEffect(() => {
    try {
      if (adminUser) localStorage.setItem('jobpulse_admin_user', JSON.stringify(adminUser));
      else localStorage.removeItem('jobpulse_admin_user');
    } catch (e) {
      console.error(e);
    }
  }, [adminUser]);

  const fetchActiveCount = async () => {
    try {
      const res = await fetch('/api/jobs?status=active');
      const data = await res.json();
      setActiveJobsCount(data.total || data.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveCount();
  }, []);

  // Hidden admin access: Ctrl+Shift+A opens the admin login (no visible link on site)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setCurrentPath('/admin');
        setRouteParam(null);
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleSave = (job: Job) => {
    setSavedJobs(prev => {
      const exists = prev.some(s => s.id === job.id);
      if (exists) {
        showToast(`Removed "${job.title}" from saved jobs.`);
        return prev.filter(s => s.id !== job.id);
      } else {
        showToast(`Saved "${job.title}" to bookmarks.`);
        return [...prev, job];
      }
    });
  };

  const handleNavigate = (path: string, param?: string) => {
    setCurrentPath(path);
    if (param !== undefined) {
      setRouteParam(param);
    } else {
      setRouteParam(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-indigo-400/30 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-300" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        savedCount={savedJobs.length}
        activeJobsCount={activeJobsCount}
        adminUser={adminUser}
        onLogout={() => {
          setAdminUser(null);
          showToast('Signed out from admin CMS.');
        }}
      />

      {/* Main Content Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div key={currentPath} className="animate-fadeIn pb-16">
          {currentPath === '/' && (
            <HomeView
              onNavigate={handleNavigate}
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPath === '/jobs' && (
            <JobListView
              initialSearch={routeParam && routeParam.startsWith('search=') ? decodeURIComponent(routeParam.split('=')[1]) : ''}
              onNavigate={handleNavigate}
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPath.startsWith('/jobs/') && routeParam === null && (
            <JobDetailsView
              jobId={currentPath.replace('/jobs/', '')}
              onBack={() => handleNavigate('/jobs')}
              onNavigate={handleNavigate}
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPath.startsWith('/categories/') && (
            <CategoryJobsView
              categorySlug={currentPath.replace('/categories/', '')}
              onBack={() => handleNavigate('/')}
              onNavigate={handleNavigate}
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPath === '/saved' && (
            <SavedJobs
              savedJobs={savedJobs}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPath === '/admin' && (
            !adminUser ? (
              <AdminLogin
                onLoginSuccess={(role, email) => {
                  setAdminUser({ email, role });
                  showToast(`Welcome back, ${email}!`);
                }}
                onBack={() => handleNavigate('/')}
              />
            ) : (
              <AdminDashboard
                currentUser={adminUser}
                onLogout={() => {
                  setAdminUser(null);
                  showToast('Signed out from admin CMS.');
                }}
                onJobChange={() => {
                  fetchActiveCount();
                }}
              />
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-slate-700 font-medium">Job listings are summarized from original sources. Please verify details and apply on the original site.</p>
          <p className="text-slate-400">JobPulse CMS & AI Job Portal • Enterprise Recruitment & Automated Deadline Architecture</p>
        </div>
      </footer>

    </div>
  );
}
