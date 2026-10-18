import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { Search, MapPin, Briefcase, DollarSign, Clock, Building2, ChevronRight, Bookmark, BookmarkCheck, Code, Palette, Megaphone, TrendingUp, Database, BriefcaseBusiness } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (path: string, param?: string) => void;
  savedJobs: Job[];
  onToggleSave: (job: Job) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, savedJobs, onToggleSave }) => {
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');

  useEffect(() => {
    fetch('/api/jobs?status=active&limit=6')
      .then(res => res.json())
      .then(data => setLatestJobs(data.jobs || []))
      .catch(err => console.error(err));
  }, []);

  const categories = [
    { name: 'Engineering', icon: Code, count: '14+ jobs' },
    { name: 'Product', icon: BriefcaseBusiness, count: '8+ jobs' },
    { name: 'Design', icon: Palette, count: '6+ jobs' },
    { name: 'Marketing', icon: Megaphone, count: '9+ jobs' },
    { name: 'Sales', icon: TrendingUp, count: '5+ jobs' },
    { name: 'Data', icon: Database, count: '7+ jobs' },
  ];

  const locations = ['All', 'San Francisco, CA', 'New York, NY', 'Remote', 'Dhaka, Bangladesh', 'Austin, TX', 'Seattle, WA'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/jobs', searchQuery ? `search=${encodeURIComponent(searchQuery)}` : undefined);
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-blue-50 border border-slate-200 p-8 sm:p-16 text-center text-slate-900 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%)]"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-slate-900 leading-tight" style={{ fontSize: '42px' }}>
            Discover Your Next <span className="text-indigo-600 font-semibold">Dream Career</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Browse verified job openings with guaranteed future application deadlines. Sourced directly from top global employers and career portals.
          </p>

          {/* Hero Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xl mt-8">
            <div className="flex items-center space-x-3 px-3 py-2 w-full sm:w-auto flex-1">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search job title, company, or skills..."
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 px-3 py-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="bg-transparent text-slate-700 text-sm focus:outline-none cursor-pointer w-full sm:w-36"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} className="bg-white text-slate-900">{loc}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              Search Jobs
            </button>
          </form>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-slate-900">Explore Featured Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Browse opportunities by your professional domain</p>
          </div>
          <button
            onClick={() => onNavigate('/jobs')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1 transition-colors"
          >
            <span>View All Jobs</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => onNavigate(`/categories/${cat.name.toLowerCase()}`)}
                className="group bg-white border border-slate-200 hover:border-indigo-400 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 text-center space-y-3"
              >
                <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 border border-indigo-100 rounded-xl flex items-center justify-center mx-auto transition-colors text-indigo-600">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest Jobs Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium text-slate-900">Latest Verified Job Openings</h2>
            <p className="text-sm text-slate-500 mt-1">Direct employer listings with future application deadlines</p>
          </div>
          <button
            onClick={() => onNavigate('/jobs')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1 transition-colors"
          >
            <span>Browse All ({latestJobs.length}+)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestJobs.map((job) => {
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
                    <div className="flex items-center space-x-3">
                      <img
                        src={job.companyLogo || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80'}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                      />
                      <div>
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
                      View Details
                    </button>
                    <a
                      href={job.applyUrl || job.sourceUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all text-center flex items-center justify-center space-x-1"
                    >
                      <span>Apply Now</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
