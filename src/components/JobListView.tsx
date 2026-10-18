import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { Search, MapPin, Briefcase, DollarSign, Clock, Building2, Bookmark, BookmarkCheck, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

interface JobListViewProps {
  initialSearch?: string;
  onNavigate: (path: string, param?: string) => void;
  savedJobs: Job[];
  onToggleSave: (job: Job) => void;
}

export const JobListView: React.FC<JobListViewProps> = ({ initialSearch = '', onNavigate, savedJobs, onToggleSave }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [minSalary, setMinSalary] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'active');
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedLocation !== 'All') params.append('location', selectedLocation);
      if (selectedType !== 'All') params.append('type', selectedType);
      if (selectedSource !== 'All') params.append('source', selectedSource);
      if (searchQuery) params.append('search', searchQuery);
      if (minSalary) params.append('minSalary', minSalary);
      params.append('sort', sortOrder);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
      setTotalJobsCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory, selectedLocation, selectedType, selectedSource, searchQuery, minSalary, sortOrder, page]);

  const categories = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Data', 'Operations', 'Finance'];
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Internship', 'Hybrid'];
  const locations = ['All', 'San Francisco, CA', 'New York, NY', 'Remote', 'Dhaka, Bangladesh', 'Austin, TX', 'Seattle, WA'];
  const sources = ['All', 'BDJobs', 'Company Career Page', 'GitHub Jobs API', 'Wellfound'];

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium text-slate-900 tracking-tight">Browse Verified Jobs</h1>
            <p className="text-sm text-slate-500 mt-1">Showing {totalJobsCount} active job opportunities with guaranteed valid deadlines</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="deadline">Urgent / Earliest Deadline</option>
              <option value="salary">Highest Salary</option>
            </select>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-3 flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
            <Search className="w-5 h-5 text-indigo-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by job title, company, or keywords..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 h-fit shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-medium text-slate-900 text-base">Filters</h2>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLocation('All');
                setSelectedType('All');
                setSelectedSource('All');
                setSearchQuery('');
                setMinSalary('');
                setPage(1);
              }}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Category</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    selectedCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Location</label>
            <select
              value={selectedLocation}
              onChange={e => {
                setSelectedLocation(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Job Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Job Type</label>
            <select
              value={selectedType}
              onChange={e => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Job Source</label>
            <select
              value={selectedSource}
              onChange={e => {
                setSelectedSource(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Salary Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">Minimum Salary ($/yr)</label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={minSalary}
              onChange={e => {
                setMinSalary(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-64 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse"></div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-medium text-slate-900">No jobs match your criteria</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try loosening your filters or keyword search to find available listings.
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
