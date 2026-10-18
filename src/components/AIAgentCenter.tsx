import React, { useState } from 'react';
import { Bot, Sparkles, Send, CheckCircle2, Play, RefreshCw, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';
import { Job, JobCategory } from '../types';

interface AIAgentCenterProps {
  onJobsScraped: () => void;
}

export const AIAgentCenter: React.FC<AIAgentCenterProps> = ({ onJobsScraped }) => {
  const [query, setQuery] = useState('Top remote AI and ML engineering jobs posted this week');
  const [category, setCategory] = useState<JobCategory>('Engineering');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [scrapedJobs, setScrapedJobs] = useState<Job[]>([]);
  const [logs, setLogs] = useState<string[]>([
    'AI Agent initialized with Gemini 2.5 Flash model.',
    'Ready to crawl and curate authentic job postings with validated future deadlines.'
  ]);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultMessage('');
    setScrapedJobs([]);

    setLogs(prev => [
      `[${new Date().toLocaleTimeString()}] Starting AI Agent search for: "${query}"...`,
      ...prev
    ]);

    try {
      const res = await fetch('/api/ai/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category, count })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute AI agent.');
      }

      setScrapedJobs(data.jobs);
      setResultMessage(`Successfully curated and posted ${data.jobs.length} authentic jobs to CMS!`);
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] SUCCESS: Curated ${data.jobs.length} jobs with verified future deadlines.`,
        ...prev
      ]);
      onJobsScraped();
    } catch (err: any) {
      setResultMessage(err.message || 'Error running AI agent');
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`,
        ...prev
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
            <Bot className="w-4 h-4 text-violet-400" />
            <span>Autonomous AI Curation Agent</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            AI Job Scraper & Auto-Poster Hub
          </h1>
          <p className="text-slate-300 text-sm">
            Leverage Gemini AI to automatically discover authentic job opportunities across major portals, enforce strict future application deadline rules, and instantly publish them to your CMS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Agent Control Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span>Agent Parameters</span>
          </h2>

          <form onSubmit={handleRunAgent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Search Prompt / Focus</label>
              <textarea
                rows={3}
                required
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Remote senior full stack engineering roles with Python & React"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as JobCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Number of Jobs to Curate</label>
              <input
                type="number"
                min={1}
                max={5}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-violet-400" />
              <span>Guarantees verified future application deadlines automatically.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{loading ? 'AI Agent Crawling...' : 'Run AI Job Agent'}</span>
            </button>
          </form>
        </div>

        {/* Agent Logs & Live Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Live Execution Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Autonomous Agent Live Terminal Logs</span>
            </h2>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1.5">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-violet-400">›</span>
                  <span className={idx === 0 ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Results */}
          {resultMessage && (
            <div className={`p-4 rounded-xl text-sm flex items-center space-x-3 ${scrapedJobs.length > 0 ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}

          {scrapedJobs.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Recently Posted by AI Agent</h3>
              <div className="space-y-3">
                {scrapedJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{job.title}</h4>
                      <p className="text-xs text-indigo-400">{job.company} • {job.location}</p>
                      <span className="text-xs text-emerald-400 font-medium">Deadline: {job.applicationDeadline}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                      Auto-Posted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
