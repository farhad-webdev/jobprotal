import React from 'react';
import { Job } from '../types';
import { X, MapPin, Briefcase, DollarSign, Clock, Bookmark, BookmarkCheck, Building2, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (job: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, isSaved, onToggleSave }) => {
  if (!job) return null;

  // Calculate days remaining
  const today = new Date();
  const deadline = new Date(job.applicationDeadline);
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0 || job.status === 'archived';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto text-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-start justify-between z-10">
          <div className="flex items-start space-x-4">
            <img 
              src={job.companyLogo || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80'} 
              alt={job.company} 
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-slate-50"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-medium text-slate-900">{job.title}</h2>
                {job.source === 'ai-agent' && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Curated</span>
                  </span>
                )}
              </div>
              <p className="text-indigo-600 font-medium mt-1 flex items-center space-x-1">
                <Building2 className="w-4 h-4 mr-1 text-slate-400" />
                <span>{job.company}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(job)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isSaved 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Saved' : 'Save Job'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Quick Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Location</span>
              </span>
              <p className="text-sm font-medium text-slate-900 mt-0.5 truncate">{job.location}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-violet-600" />
                <span>Type</span>
              </span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{job.type}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salary</span>
              </span>
              <p className="text-sm font-medium text-emerald-700 mt-0.5">{job.currency}{job.salaryMin.toLocaleString()}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Deadline</span>
              </span>
              <p className={`text-sm font-medium mt-0.5 ${diffDays <= 3 ? 'text-rose-600' : 'text-slate-900'}`}>
                {diffDays} days left
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-base font-medium text-slate-900">Summary</h3>
            <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-medium text-slate-900">Key Responsibilities</h3>
              <ul className="space-y-1.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-600 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-medium text-slate-900">Requirements</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-600 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-medium text-slate-900">Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {job.benefits.map((b, i) => (
                  <div key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            Close
          </button>

          <a
            href={isExpired ? '#' : (job.applyUrl || job.sourceUrl || '#')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => {
              if (isExpired) e.preventDefault();
            }}
            className={`px-6 py-3 rounded-xl font-medium text-sm shadow-md transition-all flex items-center space-x-2 ${
              isExpired 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            <span>{isExpired ? 'Application Closed' : 'Apply on Original Site'}</span>
            {!isExpired && <ExternalLink className="w-4 h-4" />}
          </a>
        </div>

      </div>
    </div>
  );
};
