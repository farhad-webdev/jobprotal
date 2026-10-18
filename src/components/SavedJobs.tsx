import React, { useState } from 'react';
import { Job } from '../types';
import { Bookmark, MapPin, Briefcase, DollarSign, Clock, Building2, ChevronRight, Trash2 } from 'lucide-react';
import { JobDetailModal } from './JobDetailModal';

interface SavedJobsProps {
  savedJobs: Job[];
  onToggleSave: (job: Job) => void;
}

export const SavedJobs: React.FC<SavedJobsProps> = ({ savedJobs, onToggleSave }) => {
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);

  if (savedJobs.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium text-slate-900">No Saved Jobs Yet</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Bookmark jobs while browsing the job board to keep track of opportunities you are interested in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-medium text-slate-900">Saved Job Bookmarks</h1>
          <p className="text-sm text-slate-500 mt-1">Review and apply to your bookmarked positions.</p>
        </div>
        <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-full">
          {savedJobs.length} Bookmarked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedJobs.map((job) => {
          const today = new Date();
          const deadline = new Date(job.applicationDeadline);
          const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = diffDays < 0 || job.status === 'archived';

          return (
            <div
              key={job.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3"><div>
                      <span className="text-xs text-indigo-600 font-medium flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 mr-1" />
                        <span>{job.company}</span>
                      </span>
                      <h3 className="font-medium text-slate-900 text-base line-clamp-1">{job.title}</h3>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleSave(job)}
                    className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-indigo-600" />
                    <span>{job.location}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200 flex items-center space-x-1">
                    <Briefcase className="w-3 h-3 text-violet-600" />
                    <span>{job.type}</span>
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-4">
                  {job.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{job.currency}{job.salaryMin.toLocaleString()} - {job.currency}{job.salaryMax.toLocaleString()}</span>
                  </span>
                  {(() => {
                    const badgeClass = 
                      diffDays > 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      diffDays >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200';
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 whitespace-nowrap shrink-0 ${badgeClass}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{diffDays} days left</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedJobForDetail(job)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors text-center"
                  >
                    Quick View
                  </button>
                  <a
                    href={isExpired ? '#' : (job.applyUrl || job.sourceUrl || '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (isExpired) e.preventDefault();
                    }}
                    className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-medium transition-all text-center flex items-center justify-center space-x-1 ${
                      isExpired 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <span>{isExpired ? 'Expired' : 'Apply Now'}</span>
                    {!isExpired && <ChevronRight className="w-3.5 h-3.5" />}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <JobDetailModal
        job={selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        isSaved={selectedJobForDetail ? savedJobs.some(s => s.id === selectedJobForDetail.id) : false}
        onToggleSave={onToggleSave}
      />
    </div>
  );
};
