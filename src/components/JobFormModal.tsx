import React, { useState } from 'react';
import { Job, JobType, JobStatus } from '../types';
import { X, Save, ShieldAlert } from 'lucide-react';

interface JobFormModalProps {
  job: Job | null;
  onClose: () => void;
  onSaved: (job: Job) => void;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({ job, onClose, onSaved }) => {
  const [title, setTitle] = useState(job?.title || '');
  const [companyName, setCompanyName] = useState(job?.companyName || '');
  const [companyLogo, setCompanyLogo] = useState(job?.companyLogo || '');
  const [location, setLocation] = useState(job?.location || '');
  const [jobType, setJobType] = useState<JobType>(job?.jobType || 'Full-time');
  const [category, setCategory] = useState(job?.category || 'Engineering');
  const [salaryMin, setSalaryMin] = useState(job?.salaryMin?.toString() || '120000');
  const [salaryMax, setSalaryMax] = useState(job?.salaryMax?.toString() || '160000');
  const [salaryCurrency, setSalaryCurrency] = useState(job?.salaryCurrency || 'BDT');
  const [salaryText, setSalaryText] = useState(job?.salaryText || 'Negotiable');
  const [descriptionSummary, setDescriptionSummary] = useState(job?.descriptionSummary || '');
  const [responsibilitiesText, setResponsibilitiesText] = useState(job?.responsibilities?.join('\n') || '');
  const [requirementsText, setRequirementsText] = useState(job?.requirements?.join('\n') || '');
  const [benefitsText, setBenefitsText] = useState(job?.benefits?.join('\n') || '');
  const [deadline, setDeadline] = useState(
    job?.deadline || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<JobStatus>(job?.status || 'published');
  const [sourceName, setSourceName] = useState(job?.sourceName || 'Company Career Page');
  const [sourceUrl, setSourceUrl] = useState(job?.sourceUrl || '');
  const [applyUrl, setApplyUrl] = useState(job?.applyUrl || '');
  const [vacancy, setVacancy] = useState(job?.vacancy?.toString() || '1');
  const [experienceRequired, setExperienceRequired] = useState(job?.experienceRequired || '3+ years');
  const [isFeatured, setIsFeatured] = useState(job?.isFeatured || false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    // Form validation: All required fields must be filled
    if (!title || !companyName || !location || !descriptionSummary || !deadline || !applyUrl) {
      setErrorMsg('Please fill in all required fields (Title, Company, Location, Description Summary, Deadline, Apply URL).');
      setIsSubmitting(false);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (status === 'published' && deadline < todayStr) {
      setErrorMsg('Deadline must be today or in the future to publish this job.');
      setIsSubmitting(false);
      return;
    }

    const responsibilities = responsibilitiesText.split('\n').map(r => r.trim()).filter(Boolean);
    const requirements = requirementsText.split('\n').map(r => r.trim()).filter(Boolean);
    const benefits = benefitsText.split('\n').map(b => b.trim()).filter(Boolean);

    const payload = {
      title,
      company_name: companyName,
      companyLogo,
      location,
      job_type: jobType,
      category,
      salary_min: Number(salaryMin) || 0,
      salary_max: Number(salaryMax) || 0,
      salary_currency: salaryCurrency,
      salary_text: salaryText,
      description_summary: descriptionSummary,
      responsibilities,
      requirements,
      benefits,
      vacancy: Number(vacancy) || 1,
      experience_required: experienceRequired,
      apply_url: applyUrl,
      source_name: sourceName,
      source_url: sourceUrl || applyUrl,
      deadline,
      status,
      is_featured: isFeatured,
      posted_by: 'admin'
    };

    try {
      const url = job ? `/api/jobs/${job.id}` : '/api/admin/jobs';
      const method = job ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'DUPLICATE_SOURCE_URL') {
          setDuplicateWarning(true);
          setErrorMsg('Duplicate source URL detected. This job posting already exists.');
        } else if (data.error === 'EXPIRED_DEADLINE') {
          setErrorMsg('Deadline cannot be in the past.');
        } else {
          setErrorMsg(data.message || data.error || 'Failed to save job');
        }
        setIsSubmitting(false);
        return;
      }

      onSaved(data.job || data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto text-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-medium text-slate-900">{job ? 'Edit Job Listing' : 'Create New Job Listing'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in all required fields and original apply URL.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-700 text-xs">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-medium">Validation Error:</strong>
                <p className="mt-0.5">{errorMsg}</p>
                {duplicateWarning && (
                  <p className="mt-1 text-slate-700">Rule: Every job must have a unique source URL.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. TechCorp Bangladesh"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Dhaka or Remote"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Job Type</label>
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value as JobType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none cursor-pointer"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Data">Data</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Min Salary</label>
              <input
                type="number"
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Max Salary</label>
              <input
                type="number"
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Currency</label>
              <input
                type="text"
                value={salaryCurrency}
                onChange={e => setSalaryCurrency(e.target.value)}
                placeholder="BDT or USD"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Application Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Original Apply URL * (Must link to original career page)</label>
            <input
              type="url"
              required
              value={applyUrl}
              onChange={e => setApplyUrl(e.target.value)}
              placeholder="https://company.com/careers/job-123"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Source Name *</label>
              <input
                type="text"
                required
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                placeholder="e.g. BDJobs, Company Career Page"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Source URL *</label>
              <input
                type="url"
                required
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://originalpost.com/job"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Description Summary * (2-4 lines original summary)</label>
            <textarea
              rows={3}
              required
              value={descriptionSummary}
              onChange={e => setDescriptionSummary(e.target.value)}
              placeholder="Provide a concise original summary of the role..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Responsibilities (One per line)</label>
              <textarea
                rows={3}
                value={responsibilitiesText}
                onChange={e => setResponsibilitiesText(e.target.value)}
                placeholder="Develop web applications&#10;Collaborate with design team"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Requirements (One per line)</label>
              <textarea
                rows={3}
                value={requirementsText}
                onChange={e => setRequirementsText(e.target.value)}
                placeholder="3+ years React experience&#10;Strong TypeScript skills"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-xs focus:outline-none"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as JobStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none cursor-pointer"
              >
                <option value="draft">Draft (Review Needed)</option>
                <option value="published">Published (Active)</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Company Logo URL</label>
              <input
                type="url"
                value={companyLogo}
                onChange={e => setCompanyLogo(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-xs font-medium text-slate-700 cursor-pointer">
                Feature on Homepage
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Job Listing'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
