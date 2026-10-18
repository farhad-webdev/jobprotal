import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Building2, Bookmark, BookmarkCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { formatSalary } from '../utils/format';

interface CategoryJobsViewProps {
  categorySlug: string;
  onBack: () => void;
  onNavigate: (path: string, param?: string) => void;
  savedJobs: Job[];
  onToggleSave: (job: Job) => void;
}

export const CategoryJobsView: React.FC<CategoryJobsViewProps> = ({ categorySlug, onBack, onNavigate, savedJobs, onToggleSave }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Capitalize slug for category matching e.g. "engineering" -> "Engineering"
  const categoryName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/jobs?status=active&category=${encodeURIComponent(categoryName)}`)
      .then(res => res.json())
      .then(data => setJobs(data.jobs || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <h1 className="text-3xl font-medium text-slate-900">{categoryName} Jobs</h1>
        <p className="text-sm text-slate-500">
          Showing active verified opportunities in <span className="text-indigo-600 font-medium">{categoryName}</span> with guaranteed future deadlines.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-medium text-slate-900">No active jobs in {categoryName}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Check back soon or explore other categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isSaved = savedJobs.some(s => s.id === job.id);
            const today = new Date();
            const deadline = new Date(job.applicationDeadline);
            const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={job.id}
                className="group bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3"><div>
                        <span className="text-xs text-indigo-600 font-medium flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 mr-1" />
                          <span>{job.company}</span>
                        </span>
                        <h3
                          onClick={() => onNavigate(`/jobs/${job.id}`)}
                          className="font-medium text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {job.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleSave(job)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isSaved ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
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
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                      {job.source}
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
                      <span>{formatSalary(job)}</span>
                    </span>
                    <span className="text-amber-700 font-medium flex items-center space-x-1 whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{diffDays}d left</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onNavigate(`/jobs/${job.id}`)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors text-center"
                    >
                      Details
                    </button>
                    <a
                      href={job.applyUrl || job.sourceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all text-center flex items-center justify-center space-x-1"
                    >
                      <span>Apply</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
