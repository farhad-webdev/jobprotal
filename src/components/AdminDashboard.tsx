import React, { useState, useEffect } from 'react';
import { Job, Company, Category } from '../types';
import { LayoutDashboard, Briefcase, Users, Eye, PlusCircle, Trash2, Edit, Calendar, AlertCircle, CheckCircle2, Clock, FileText, Search, Bot, Building2, FolderTree, Check, X, ShieldAlert, Copy, ArrowUpDown, Sparkles } from 'lucide-react';
import { JobFormModal } from './JobFormModal';

interface AdminDashboardProps {
  onJobChange: () => void;
  currentUser: { email: string; role: 'admin' | 'editor' };
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onJobChange, currentUser, onLogout }) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'jobs' | 'review' | 'companies' | 'categories' | 'ai-agent'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Job table filters & selection
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Company form modal
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [compName, setCompName] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');

  // Category form modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // AI Agent Curation state
  const [aiQuery, setAiQuery] = useState('Remote senior AI & React engineering positions');
  const [aiCategory, setAiCategory] = useState<any>('Engineering');
  const [aiCount, setAiCount] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState<string[]>(['Agent initialized. Ready to curate and queue drafts.']);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, compsRes, catsRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/jobs').then(r => r.json()),
        fetch('/api/companies').then(r => r.json()),
        fetch('/api/categories').then(r => r.json())
      ]);

      setStats(statsRes);
      setJobs(jobsRes);
      setCompanies(compsRes);
      setCategories(catsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    loadAll();
    onJobChange();
  };

  const handleDuplicateJob = async (job: Job) => {
    const payload = {
      ...job,
      title: `${job.title} (Copy)`,
      id: undefined,
      postedDate: new Date().toISOString().split('T')[0]
    };
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    loadAll();
    onJobChange();
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedJobIds.length === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedJobIds.length} selected jobs?`)) return;

    if (action === 'delete') {
      await Promise.all(selectedJobIds.map(id => fetch(`/api/jobs/${id}`, { method: 'DELETE' })));
    } else {
      const status = action === 'publish' ? 'active' : 'archived';
      await Promise.all(selectedJobIds.map(id => 
        fetch(`/api/jobs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      ));
    }

    setSelectedJobIds([]);
    loadAll();
    onJobChange();
  };

  // Review Queue actions
  const handleApproveDraft = async (job: Job) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (job.applicationDeadline < todayStr) {
      alert('Cannot approve job: Application deadline has already passed!');
      return;
    }
    await fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' })
    });
    loadAll();
    onJobChange();
  };

  const handleRejectDraft = async (job: Job) => {
    const reason = prompt('Enter rejection reason for agent draft:');
    if (!reason) return;
    await fetch(`/api/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived', rejectionReason: reason })
    });
    loadAll();
  };

  // Company CRUD submit
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingComp ? `/api/companies/${editingComp.id}` : '/api/companies';
    const method = editingComp ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: compName, logo: compLogo, website: compWebsite, description: compDesc })
    });
    setCompModalOpen(false);
    setEditingComp(null);
    setCompName(''); setCompLogo(''); setCompWebsite(''); setCompDesc('');
    loadAll();
  };

  // Category CRUD submit
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
    const method = editingCat ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, slug: catSlug || catName.toLowerCase().replace(/\s+/g, '-') })
    });
    setCatModalOpen(false);
    setEditingCat(null);
    setCatName(''); setCatSlug('');
    loadAll();
  };

  // AI Agent run
  const handleRunAiAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setAiLogs(prev => [`[${new Date().toLocaleTimeString()}] Running agent for "${aiQuery}"...`, ...prev]);

    try {
      const res = await fetch('/api/ai/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery, category: aiCategory, count: aiCount })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAiLogs(prev => [`[${new Date().toLocaleTimeString()}] SUCCESS: Added ${data.count} jobs to review queue as drafts.`, ...prev]);
      loadAll();
    } catch (err: any) {
      setAiLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`, ...prev]);
    } finally {
      setAiLoading(false);
    }
  };

  const draftJobs = jobs.filter(j => j.status === 'draft');
  const activeJobsList = jobs.filter(j => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false;
    if (sourceFilter !== 'All' && !j.source.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
    if (categoryFilter !== 'All' && j.category !== categoryFilter) return false;
    if (searchFilter && !j.title.toLowerCase().includes(searchFilter.toLowerCase()) && !j.company.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Admin Header */}
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold capitalize">
              Role: {currentUser.role}
            </span>
            <span className="text-xs text-slate-500">{currentUser.email}</span>
          </div>
          <h1 className="text-2xl font-medium text-slate-900">Admin CMS Control Center</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingJob(null);
              setJobModalOpen(true);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'jobs', label: 'Job Management', icon: Briefcase, count: jobs.length },
          { id: 'review', label: 'Agent Review Queue', icon: Bot, count: draftJobs.length, alert: draftJobs.length > 0 },
          { id: 'companies', label: 'Companies', icon: Building2, count: companies.length },
          { id: 'categories', label: 'Categories', icon: FolderTree, count: categories.length },
          { id: 'ai-agent', label: 'AI Curation Agent', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${tab.alert ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-indigo-700'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {adminTab === 'overview' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Active Jobs</span>
              <div className="text-2xl font-medium text-emerald-600">{stats.totalActiveJobs}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Expiring in 3 Days</span>
              <div className="text-2xl font-medium text-amber-600">{stats.expiringIn3Days}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Expired / Archived</span>
              <div className="text-2xl font-medium text-rose-600">{stats.expiredJobs}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Drafts in Review</span>
              <div className="text-2xl font-medium text-violet-600">{stats.draftsWaitingReview}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Total Companies</span>
              <div className="text-2xl font-medium text-slate-900">{stats.totalCompanies}</div>
            </div>
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">Total Categories</span>
              <div className="text-2xl font-medium text-slate-900">{categories.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h2 className="text-base font-medium text-slate-900 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-violet-600" />
                <span>Recent Agent-Posted Jobs</span>
              </h2>
              <div className="space-y-3">
                {stats.recentAgentPosts.map((job: Job) => (
                  <div key={job.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-900">{job.title}</div>
                      <div className="text-slate-500">{job.company} • {job.source}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${job.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h2 className="text-base font-medium text-slate-900 flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>Recent Manual Posts</span>
              </h2>
              <div className="space-y-3">
                {stats.recentManualPosts.map((job: Job) => (
                  <div key={job.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-900">{job.title}</div>
                      <div className="text-slate-500">{job.company} • Posted {job.postedDate}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: JOB MANAGEMENT */}
      {adminTab === 'jobs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="bg-transparent text-slate-900 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {selectedJobIds.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">{selectedJobIds.length} selected</span>
                <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">Publish</button>
                <button onClick={() => handleBulkAction('archive')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">Archive</button>
                <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold">Delete</button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={e => {
                        if (e.target.checked) setSelectedJobIds(activeJobsList.map(j => j.id));
                        else setSelectedJobIds([]);
                      }}
                      checked={selectedJobIds.length === activeJobsList.length && activeJobsList.length > 0}
                      className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-4">Title & Company</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Source / Posted By</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeJobsList.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedJobIds.includes(job.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedJobIds(prev => [...prev, job.id]);
                          else setSelectedJobIds(prev => prev.filter(id => id !== job.id));
                        }}
                        className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{job.title}</div>
                      <div className="text-xs text-indigo-600">{job.company}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-600">{job.location}</td>
                    <td className="p-4 text-xs font-semibold text-amber-700">{job.applicationDeadline}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        job.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        job.status === 'draft' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600">
                      <div>{job.source}</div>
                      <div className="text-slate-400 font-mono">By: {job.postedBy}</div>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button onClick={() => handleDuplicateJob(job)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingJob(job); setJobModalOpen(true); }} className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AGENT REVIEW QUEUE */}
      {adminTab === 'review' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-lg font-medium text-slate-900">Agent Review Queue ({draftJobs.length} Drafts)</h2>
              <p className="text-xs text-slate-500 mt-1">Review, approve, or edit agent-curated job postings before publishing.</p>
            </div>
          </div>

          {draftJobs.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-medium text-slate-900">Queue is Empty</h3>
              <p className="text-sm text-slate-500">All agent-posted jobs have been reviewed and processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {draftJobs.map(job => {
                const todayStr = new Date().toISOString().split('T')[0];
                const isPastDeadline = job.applicationDeadline < todayStr;

                return (
                  <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold">{job.source}</span>
                          <span className="text-xs text-slate-500">Deadline: <strong className={isPastDeadline ? 'text-rose-600' : 'text-emerald-600'}>{job.applicationDeadline}</strong></span>
                        </div>
                        <h3 className="text-xl font-medium text-slate-900">{job.title}</h3>
                        <p className="text-indigo-600 text-sm font-semibold">{job.company} • {job.location} ({job.type})</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          disabled={isPastDeadline}
                          onClick={() => handleApproveDraft(job)}
                          className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-1 shadow-sm ${isPastDeadline ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'}`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          onClick={() => { setEditingJob(job); setJobModalOpen(true); }}
                          className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all"
                        >
                          Edit & Approve
                        </button>
                        <button
                          onClick={() => handleRejectDraft(job)}
                          className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-semibold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {isPastDeadline && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Deadline check failed: Application deadline is in the past. Approval blocked until deadline is extended.</span>
                      </div>
                    )}

                    <p className="text-sm text-slate-600 leading-relaxed">{job.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPANIES */}
      {adminTab === 'companies' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Company Directory Management</h2>
            <button
              onClick={() => {
                setEditingComp(null);
                setCompName(''); setCompLogo(''); setCompWebsite(''); setCompDesc('');
                setCompModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {companies.map(comp => (
              <div key={comp.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center space-x-4">
                  <img src={comp.logo} alt={comp.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50" />
                  <div>
                    <h3 className="font-medium text-slate-900 text-base">{comp.name}</h3>
                    <a href={comp.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">{comp.website}</a>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{comp.description}</p>
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingComp(comp);
                      setCompName(comp.name);
                      setCompLogo(comp.logo);
                      setCompWebsite(comp.website);
                      setCompDesc(comp.description);
                      setCompModalOpen(true);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-lg text-xs"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete company?')) {
                        await fetch(`/api/companies/${comp.id}`, { method: 'DELETE' });
                        loadAll();
                      }
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CATEGORIES */}
      {adminTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Category Management</h2>
            <button
              onClick={() => {
                setEditingCat(null);
                setCatName(''); setCatSlug('');
                setCatModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 text-base">{cat.name}</h3>
                  <p className="text-xs text-indigo-600 font-mono">Slug: /{cat.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingCat(cat);
                      setCatName(cat.name);
                      setCatSlug(cat.slug);
                      setCatModalOpen(true);
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-lg text-xs"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete category?')) {
                        await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
                        loadAll();
                      }
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: AI CURATION AGENT */}
      {adminTab === 'ai-agent' && (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-sm max-w-2xl mx-auto">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-center mx-auto text-violet-600">
              <Bot className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium text-slate-900">AI Job Curation Agent</h2>
            <p className="text-xs text-slate-500">Postings found by the AI Agent are automatically routed to the Review Queue as drafts.</p>
          </div>

          <form onSubmit={handleRunAiAgent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Search Prompt / Topic</label>
              <textarea
                rows={3}
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-violet-600"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={aiCategory}
                  onChange={e => setAiCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs focus:outline-none"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Count</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={aiCount}
                  onChange={e => setAiCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={aiLoading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-violet-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{aiLoading ? 'Agent Crawling Portals...' : 'Run Curation Agent'}</span>
            </button>
          </form>

          {aiLogs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-40 overflow-y-auto space-y-1">
              {aiLogs.map((log, idx) => <div key={idx} className="text-indigo-300">› {log}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Job Form Modal for Create/Edit */}
      {jobModalOpen && (
        <JobFormModal
          job={editingJob}
          onClose={() => setJobModalOpen(false)}
          onSaved={() => {
            loadAll();
            onJobChange();
          }}
        />
      )}

      {/* Company Modal */}
      {compModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 text-slate-900 shadow-xl">
            <h3 className="text-lg font-medium">{editingComp ? 'Edit Company' : 'Add Company'}</h3>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Company Name *</label>
                <input type="text" required value={compName} onChange={e => setCompName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Logo Image URL</label>
                <input type="text" value={compLogo} onChange={e => setCompLogo(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Website URL</label>
                <input type="text" value={compWebsite} onChange={e => setCompWebsite(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea rows={3} value={compDesc} onChange={e => setCompDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600"></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setCompModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 text-slate-900 shadow-xl">
            <h3 className="text-lg font-medium">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Category Name *</label>
                <input type="text" required value={catName} onChange={e => setCatName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Slug</label>
                <input type="text" value={catSlug} onChange={e => setCatSlug(e.target.value)} placeholder="e.g. engineering" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm mt-1 focus:outline-none focus:border-indigo-600" />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setCatModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
