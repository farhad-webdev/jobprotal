import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Clock, Building2, CheckCircle2, Bookmark, BookmarkCheck, Share2, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';

interface JobDetailsViewProps {
  jobId: string;
  onBack: () => void;
  onNavigate: (path: string, param?: string) => void;
  savedJobs: Job[];
  onToggleSave: (job: Job) => void;
}

export const JobDetailsView: React.FC<JobDetailsViewProps> = ({ jobId, onBack, onNavigate, savedJobs, onToggleSave }) => {
  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then(res => {
        if (!res.ok) throw new Error('Job not found');
        return res.json();
      })
      .then(data => {
        setJob(data);
        // Update SEO title & meta tags
        document.title = `${data.title} at ${data.company} | JobPulse Portal`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', data.description.substring(0, 160));

        const scriptId = 'json-ld-job-schema';
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
          script = document.createElement('script') as HTMLScriptElement;
          script.id = scriptId;
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "JobPosting",
          "title": data.title,
          "description": data.description,
          "identifier": {
            "@type": "PropertyValue",
            "name": data.company,
            "value": data.id
          },
          "datePosted": data.postedDate,
          "validThrough": data.applicationDeadline,
          "employmentType": data.type.toUpperCase(),
          "hiringOrganization": {
            "@type": "Organization",
            "name": data.company,
            "sameAs": data.sourceUrl || ""
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": data.location
            }
          },
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": data.currency.trim() || "USD",
            "value": {
              "@type": "QuantitativeValue",
              "minValue": data.salaryMin,
              "maxValue": data.salaryMax,
              "unitText": "YEAR"
            }
          }
        });

        // Fetch related jobs (same category, max 4)
        return fetch(`/api/jobs?status=active&category=${encodeURIComponent(data.category)}`);
      })
      .then(res => res.json())
      .then(resData => {
        const list = (resData.jobs || []).filter((j: Job) => j.id !== jobId).slice(0, 4);
        setRelatedJobs(list);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    return () => {
      // Cleanup JSON-LD schema on unmount
      const script = document.getElementById('json-ld-job-schema');
      if (script) script.remove();
    };
  }, [jobId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Job link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-500 text-sm font-medium">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <h2 className="text-xl font-medium text-slate-900">Job Not Found</h2>
        <button onClick={onBack} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium">Back to Jobs</button>
      </div>
    );
  }

  const isSaved = savedJobs.some(s => s.id === job.id);
  const today = new Date();
  const deadline = new Date(job.applicationDeadline);
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0 || job.status === 'archived';

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-fadeIn">
      
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-indigo-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      <button onClick={onBack} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Job Search</span>
      </button>

      {/* Main Job Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="flex items-start space-x-5">
            <img
              src={job.companyLogo || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80'}
              alt={job.company}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                  {job.source}
                </span>
                <span className="text-xs text-slate-500">Posted on {job.postedDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-medium text-slate-900">{job.title}</h1>
              <p className="text-indigo-600 font-medium flex items-center space-x-1 text-base">
                <Building2 className="w-4 h-4 mr-1 text-slate-400" />
                <span>{job.company}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={job.applyUrl || job.sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-8 py-3.5 rounded-2xl font-medium text-sm shadow-md transition-all text-center flex items-center justify-center space-x-2 ${
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

        {/* Secondary Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-500 font-medium">Original Source Link:</span>
            <a href={job.sourceUrl || job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-xs flex items-center space-x-1 font-medium">
              <span>{job.sourceUrl || job.applyUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleSave(job)}
              className={`px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-colors font-medium ${
                isSaved ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isSaved ? 'Saved' : 'Save Job'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              onClick={() => {
                setReported(true);
                showToast('Report submitted. Thank you for keeping listings accurate!');
              }}
              className={`px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-colors font-medium ${
                reported ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{reported ? 'Reported' : 'Report Expired'}</span>
            </button>
          </div>
        </div>

        {/* Full Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Location</span>
            </span>
            <p className="font-medium text-slate-900 truncate">{job.location}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-violet-600" />
              <span>Job Type</span>
            </span>
            <p className="font-medium text-slate-900">{job.type}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Salary Range</span>
            </span>
            <p className="font-medium text-emerald-700">{job.currency}{job.salaryMin.toLocaleString()} - {job.currency}{job.salaryMax.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 flex items-center space-x-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Deadline</span>
            </span>
            <p className={`font-medium ${diffDays <= 3 ? 'text-rose-600' : 'text-slate-900'}`}>
              {job.applicationDeadline} ({diffDays} days left)
            </p>
          </div>
        </div>

        {/* Job Description & Details */}
        <div className="space-y-8 text-slate-700 leading-relaxed text-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-slate-900">Job Summary</h2>
            <p className="text-slate-600 bg-slate-50 border border-slate-200 p-5 rounded-2xl">{job.description}</p>
          </div>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-slate-900">Key Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-slate-900">Requirements & Qualifications</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start space-x-2 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-slate-900">Benefits & Perks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {job.benefits.map((ben, i) => (
                  <div key={i} className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{ben}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer & Apply Button */}
        <div className="pt-8 border-t border-slate-100 space-y-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-slate-400 max-w-md">
            Job listings are summarized from original sources. Please verify details and apply on the original site.
          </p>
          <a
            href={job.applyUrl || job.sourceUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-medium text-sm shadow-md transition-all text-center flex items-center justify-center space-x-2 ${
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

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <div className="space-y-6 pt-6">
          <h2 className="text-xl font-medium text-slate-900">Similar Jobs in {job.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedJobs.map(rel => (
              <div
                key={rel.id}
                onClick={() => onNavigate(`/jobs/${rel.id}`)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={rel.companyLogo || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80'} alt={rel.company} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                    <div>
                      <h3 className="font-medium text-slate-900 text-sm hover:text-indigo-600 transition-colors">{rel.title}</h3>
                      <p className="text-xs text-slate-500">{rel.company} • {rel.location}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    {rel.currency}{rel.salaryMin.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
