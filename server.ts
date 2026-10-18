import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';
import type { Job, Company, Category } from './src/types';

// Repo root at runtime (works in dev ESM via tsx/bun and in the bundled CJS server.cjs)
const DIST_DIR = path.join(process.cwd(), 'dist');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AGENT_API_KEY = process.env.AGENT_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PORT = process.env.PORT || 3000;

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('[JobPulse] Supabase connected.');
} else {
  console.warn('[JobPulse] WARNING: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. DB routes will return 503 until configured.');
}
if (!AGENT_API_KEY) {
  console.warn('[JobPulse] WARNING: AGENT_API_KEY not set. Agent POST /api/jobs is disabled until configured.');
}

function requireDb(res: express.Response): boolean {
  if (!supabase) {
    res.status(503).json({
      error: 'SUPABASE_NOT_CONFIGURED',
      message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars and restart the server.'
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAsiaDhakaToday(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function pick(body: any, ...keys: string[]): any {
  for (const k of keys) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') return body[k];
  }
  return undefined;
}

function slugify(...parts: string[]): string {
  const base = parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base}-${Math.floor(Math.random() * 10000)}`;
}

// DB (snake_case) -> API (camelCase, matches src/types.ts Job)
function toApiJob(row: any): Job {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    companyId: row.company_id || '',
    companyName: row.company_name,
    company: row.company_name,
    companyLogo: row.company_logo || '',
    location: row.location,
    jobType: row.job_type,
    type: row.job_type,
    category: row.category,
    salaryMin: Number(row.salary_min ?? 0),
    salaryMax: Number(row.salary_max ?? 0),
    salaryCurrency: row.salary_currency || 'BDT',
    currency: row.salary_currency || 'BDT',
    salaryText: row.salary_text || 'Negotiable',
    descriptionSummary: row.description_summary || '',
    description: row.description_summary || '',
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    vacancy: row.vacancy ?? 1,
    vacancyCount: row.vacancy ?? 1,
    experienceRequired: row.experience_required || '',
    applyUrl: row.apply_url,
    sourceName: row.source_name,
    source: row.source_name,
    sourceUrl: row.source_url,
    postedDate: row.posted_date,
    deadline: row.deadline,
    applicationDeadline: row.deadline,
    status: row.status,
    postedBy: row.posted_by,
    isFeatured: !!row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicantsCount: Number(row.applicants_count ?? 0),
    viewsCount: Number(row.views_count ?? 0)
  } as Job;
}

// Request body (camelCase or snake_case) -> DB row (snake_case)
function toDbJob(body: any, postedBy: 'admin' | 'agent', status: string) {
  const title = pick(body, 'title');
  const companyName = pick(body, 'companyName', 'company_name', 'company');
  const location = pick(body, 'location');
  const deadline = pick(body, 'deadline', 'applicationDeadline', 'application_deadline');
  const applyUrl = pick(body, 'applyUrl', 'apply_url');
  const sourceUrl = pick(body, 'sourceUrl', 'source_url');
  return {
    slug: pick(body, 'slug') || slugify(title || 'job', companyName || 'company'),
    title,
    company_id: pick(body, 'companyId', 'company_id') || null,
    company_name: companyName,
    company_logo: pick(body, 'companyLogo', 'company_logo') || null,
    location,
    job_type: pick(body, 'jobType', 'job_type', 'type') || 'Full-time',
    category: pick(body, 'category') || 'Engineering',
    salary_min: pick(body, 'salaryMin', 'salary_min') ?? null,
    salary_max: pick(body, 'salaryMax', 'salary_max') ?? null,
    salary_currency: pick(body, 'salaryCurrency', 'salary_currency') || 'BDT',
    salary_text: pick(body, 'salaryText', 'salary_text') || 'Negotiable',
    description_summary: pick(body, 'descriptionSummary', 'description_summary', 'description') || '',
    responsibilities: pick(body, 'responsibilities') || [],
    requirements: pick(body, 'requirements') || [],
    benefits: pick(body, 'benefits') || [],
    vacancy: pick(body, 'vacancy', 'vacancyCount', 'vacancy_count') ?? 1,
    experience_required: pick(body, 'experienceRequired', 'experience_required') || null,
    apply_url: applyUrl,
    source_name: pick(body, 'sourceName', 'source_name', 'source') || 'Company Career Page',
    source_url: sourceUrl,
    posted_date: pick(body, 'postedDate', 'posted_date') || getAsiaDhakaToday(),
    deadline,
    status,
    posted_by: postedBy,
    is_featured: !!(pick(body, 'isFeatured', 'is_featured'))
  };
}

// Rate limiter for agent API (50 req / hour per key) + AI scrape (10 / hour)
const rateLimitLog: Record<string, number[]> = {};
function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const windowStart = now - 3600000;
  if (!rateLimitLog[key]) rateLimitLog[key] = [];
  rateLimitLog[key] = rateLimitLog[key].filter(t => t > windowStart);
  if (rateLimitLog[key].length >= max) return false;
  rateLimitLog[key].push(now);
  return true;
}

// Auto-expire: published jobs whose deadline passed -> expired
async function autoExpireJobs() {
  if (!supabase) return;
  const today = getAsiaDhakaToday();
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'published')
    .lt('deadline', today);
  if (error) console.error('[JobPulse] auto-expire failed:', error.message);
}
setInterval(() => { autoExpireJobs(); }, 60000);

async function isDuplicateSourceUrl(sourceUrl: string, excludeId?: string): Promise<boolean> {
  if (!supabase) return false;
  let q = supabase.from('jobs').select('id').eq('source_url', sourceUrl).limit(1);
  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q;
  return !!(data && data.length > 0);
}

// ---------------------------------------------------------------------------
// Server + routes
// ---------------------------------------------------------------------------
async function startServer() {
  const app = express();
  app.use(express.json());

  // GET /api/health
  app.get('/api/health', async (_req, res) => {
    if (!supabase) {
      return res.json({ ok: false, error: 'SUPABASE_NOT_CONFIGURED', time: new Date().toISOString(), activeJobsCount: 0 });
    }
    await autoExpireJobs();
    const today = getAsiaDhakaToday();
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('deadline', today);
    res.json({ ok: true, time: new Date().toISOString(), activeJobsCount: count ?? 0 });
  });

  // ---- Companies ----
  app.get('/api/companies', async (_req, res) => {
    if (!requireDb(res)) return;
    const { data, error } = await supabase!.from('companies').select('*').order('name');
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json(data);
  });

  app.post('/api/companies', async (req, res) => {
    if (!requireDb(res)) return;
    const { data, error } = await supabase!
      .from('companies')
      .insert({
        name: req.body.name,
        logo: req.body.logo || null,
        website: req.body.website || null,
        description: req.body.description || null
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.status(201).json(data);
  });

  app.delete('/api/companies/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const { error } = await supabase!.from('companies').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json({ success: true });
  });

  // ---- Categories ----
  app.get('/api/categories', async (_req, res) => {
    if (!requireDb(res)) return;
    const { data, error } = await supabase!.from('categories').select('*').order('name');
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json(data);
  });

  app.post('/api/categories', async (req, res) => {
    if (!requireDb(res)) return;
    const { data, error } = await supabase!
      .from('categories')
      .insert({
        name: req.body.name,
        slug: req.body.slug || String(req.body.name || '').toLowerCase().replace(/\s+/g, '-'),
        icon: req.body.icon || 'Briefcase'
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.status(201).json(data);
  });

  app.delete('/api/categories/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const { error } = await supabase!.from('categories').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json({ success: true });
  });

  // ---- Public job listing (NEVER shows expired or non-published) ----
  app.get('/api/jobs', async (req, res) => {
    if (!requireDb(res)) return;
    await autoExpireJobs();
    const {
      status = 'published',
      category, location, jobType, sourceName, search, minSalary,
      sort = 'newest', page = '1', limit = '12'
    } = req.query as Record<string, string>;

    const today = getAsiaDhakaToday();
    let dbQuery = supabase!.from('jobs').select('*');
    if (status === 'draft') dbQuery = dbQuery.eq('status', 'draft');
    else if (status === 'all') { /* no filter */ }
    else dbQuery = dbQuery.eq('status', 'published').gte('deadline', today);

    const { data, error } = await dbQuery;
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });

    let filtered = (data || []).map(toApiJob);

    if (category && category !== 'All') filtered = filtered.filter(j => j.category === category);
    if (location && location !== 'All') {
      const q = location.toLowerCase();
      filtered = filtered.filter(j => j.location.toLowerCase().includes(q));
    }
    if (jobType && jobType !== 'All') filtered = filtered.filter(j => j.jobType === jobType);
    if (sourceName && sourceName !== 'All') {
      const q = sourceName.toLowerCase();
      filtered = filtered.filter(j => j.sourceName.toLowerCase().includes(q));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.descriptionSummary || '').toLowerCase().includes(q) ||
        (j.requirements || []).some(r => r.toLowerCase().includes(q))
      );
    }
    if (minSalary) filtered = filtered.filter(j => (j.salaryMax || 0) >= Number(minSalary));

    if (sort === 'deadline') filtered.sort((a, b) => a.deadline.localeCompare(b.deadline));
    else if (sort === 'salary-high') filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    else filtered.sort((a, b) => b.postedDate.localeCompare(a.postedDate));

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const start = (pageNum - 1) * limitNum;
    res.json({
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
      jobs: filtered.slice(start, start + limitNum)
    });
  });

  // ---- Admin: all jobs ----
  app.get('/api/admin/jobs', async (_req, res) => {
    if (!requireDb(res)) return;
    await autoExpireJobs();
    const { data, error } = await supabase!
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json((data || []).map(toApiJob));
  });

  // ---- Job details (+ view counter) ----
  app.get('/api/jobs/:slugOrId', async (req, res) => {
    if (!requireDb(res)) return;
    await autoExpireJobs();
    const q = req.params.slugOrId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    let row: any = null;
    if (isUuid) {
      const r = await supabase!.from('jobs').select('*').eq('id', q).maybeSingle();
      row = r.data;
    }
    if (!row) {
      const r = await supabase!.from('jobs').select('*').eq('slug', q).maybeSingle();
      row = r.data;
    }
    if (!row) return res.status(404).json({ error: 'Job not found' });
    supabase!.from('jobs').update({ views_count: (row.views_count || 0) + 1 }).eq('id', row.id).then(() => {});
    res.json(toApiJob(row));
  });

  // ---- AGENT API: POST /api/jobs (requires x-api-key) ----
  app.post('/api/jobs', async (req, res) => {
    if (!requireDb(res)) return;
    if (!AGENT_API_KEY) {
      return res.status(503).json({ error: 'AGENT_API_DISABLED', message: 'Set AGENT_API_KEY env var to enable the agent posting API.' });
    }
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey || apiKey !== AGENT_API_KEY) {
      return res.status(401).json({ error: 'UNAUTHORIZED_API_KEY' });
    }
    if (!checkRateLimit(`agent:${apiKey}`, 50)) {
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
    }

    const body = req.body || {};
    const title = pick(body, 'title');
    const companyName = pick(body, 'companyName', 'company_name', 'company');
    const location = pick(body, 'location');
    const deadline = pick(body, 'deadline', 'applicationDeadline', 'application_deadline');
    const applyUrl = pick(body, 'applyUrl', 'apply_url');
    const sourceUrl = pick(body, 'sourceUrl', 'source_url');

    if (!title || !companyName || !location || !deadline) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    }
    if (!applyUrl || !sourceUrl || !applyUrl.startsWith('http') || !sourceUrl.startsWith('http')) {
      return res.status(400).json({ error: 'INVALID_URLS' });
    }
    if (deadline < getAsiaDhakaToday()) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }
    if (await isDuplicateSourceUrl(sourceUrl)) {
      return res.status(400).json({ error: 'DUPLICATE_SOURCE_URL' });
    }
    const { data: sameTitle } = await supabase!
      .from('jobs').select('id').ilike('title', title).ilike('company_name', companyName).limit(1);
    if (sameTitle && sameTitle.length > 0) {
      return res.status(400).json({ error: 'DUPLICATE_SOURCE_URL' });
    }

    const { data, error } = await supabase!
      .from('jobs')
      .insert(toDbJob(body, 'agent', 'draft'))
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.status(201).json({ success: true, id: data.id, slug: data.slug, status: data.status });
  });

  // ---- ADMIN API: manual job create (used by dashboard; no agent key needed) ----
  app.post('/api/admin/jobs', async (req, res) => {
    if (!requireDb(res)) return;
    const body = req.body || {};
    const title = pick(body, 'title');
    const companyName = pick(body, 'companyName', 'company_name', 'company');
    const location = pick(body, 'location');
    const deadline = pick(body, 'deadline', 'applicationDeadline', 'application_deadline');
    const applyUrl = pick(body, 'applyUrl', 'apply_url');
    const sourceUrl = pick(body, 'sourceUrl', 'source_url') || applyUrl;

    if (!title || !companyName || !location || !deadline) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    }
    if (!applyUrl || !applyUrl.startsWith('http')) {
      return res.status(400).json({ error: 'INVALID_URLS' });
    }
    let status = pick(body, 'status') || 'draft';
    const today = getAsiaDhakaToday();
    if (status === 'published' && deadline < today) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }
    if (deadline < today) status = 'expired';
    if (await isDuplicateSourceUrl(sourceUrl)) {
      return res.status(400).json({ error: 'DUPLICATE_SOURCE_URL' });
    }
    const { data, error } = await supabase!
      .from('jobs')
      .insert(toDbJob({ ...body, source_url: sourceUrl }, pick(body, 'posted_by', 'postedBy') || 'admin', status))
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.status(201).json(toApiJob(data));
  });

  // ---- Update job ----
  app.put('/api/jobs/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const { data: existing, error: fetchError } = await supabase!
      .from('jobs').select('*').eq('id', req.params.id).maybeSingle();
    if (fetchError) return res.status(500).json({ error: 'DB_ERROR', message: fetchError.message });
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const body = req.body || {};
    const today = getAsiaDhakaToday();
    const deadline = pick(body, 'deadline', 'applicationDeadline', 'application_deadline') || existing.deadline;
    let status = body.status !== undefined ? body.status : existing.status;
    if (status === 'published' && deadline < today) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }
    if (deadline < today) status = 'expired';

    const patch = toDbJob({ ...body, title: pick(body, 'title') || existing.title }, existing.posted_by, status);
    patch.slug = pick(body, 'slug') || existing.slug;
    patch.posted_date = pick(body, 'postedDate', 'posted_date') || existing.posted_date;
    delete (patch as any).posted_by;

    if (patch.source_url && patch.source_url !== existing.source_url) {
      if (await isDuplicateSourceUrl(patch.source_url, req.params.id)) {
        return res.status(400).json({ error: 'DUPLICATE_SOURCE_URL' });
      }
    }

    const { data, error } = await supabase!
      .from('jobs')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json(toApiJob(data));
  });

  // ---- Approve / reject / archive ----
  app.patch('/api/jobs/:id/status', async (req, res) => {
    if (!requireDb(res)) return;
    await autoExpireJobs();
    const { data: existing, error: fetchError } = await supabase!
      .from('jobs').select('*').eq('id', req.params.id).maybeSingle();
    if (fetchError) return res.status(500).json({ error: 'DB_ERROR', message: fetchError.message });
    if (!existing) return res.status(404).json({ error: 'Job not found' });

    const { status } = req.body || {};
    if (status === 'published' && existing.deadline < getAsiaDhakaToday()) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }
    const { data, error } = await supabase!
      .from('jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json(toApiJob(data));
  });

  app.delete('/api/jobs/:id', async (req, res) => {
    if (!requireDb(res)) return;
    const { error } = await supabase!.from('jobs').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    res.json({ success: true });
  });

  // ---- Admin stats ----
  app.get('/api/admin/stats', async (_req, res) => {
    if (!requireDb(res)) return;
    await autoExpireJobs();
    const today = getAsiaDhakaToday();
    const in3 = new Date();
    in3.setDate(in3.getDate() + 3);
    const in3Str = in3.toISOString().split('T')[0];

    const { data: jobs, error } = await supabase!.from('jobs').select('id,status,deadline,source_name,posted_by,created_at');
    if (error) return res.status(500).json({ error: 'DB_ERROR', message: error.message });
    const { count: companyCount } = await supabase!.from('companies').select('id', { count: 'exact', head: true });

    const list = jobs || [];
    const bySource: Record<string, number> = {};
    list.forEach(j => { const s = j.source_name || 'Other'; bySource[s] = (bySource[s] || 0) + 1; });

    const { data: recent } = await supabase!
      .from('jobs').select('*').order('created_at', { ascending: false }).limit(20);
    const recentList = (recent || []).map(toApiJob);

    res.json({
      totalActiveJobs: list.filter(j => j.status === 'published').length,
      expiringIn3Days: list.filter(j => j.status === 'published' && j.deadline >= today && j.deadline <= in3Str).length,
      expiredJobs: list.filter(j => j.status === 'expired' || j.status === 'archived').length,
      draftsWaitingReview: list.filter(j => j.status === 'draft').length,
      totalCompanies: companyCount ?? 0,
      jobsBySource: bySource,
      recentAgentPosts: recentList.filter(j => j.postedBy === 'agent').slice(0, 10),
      recentManualPosts: recentList.filter(j => j.postedBy === 'admin').slice(0, 10)
    });
  });

  // ---- AI scrape (Gemini with search grounding -> drafts) ----
  app.post('/api/ai/scrape', async (req, res) => {
    if (!requireDb(res)) return;
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_NOT_CONFIGURED', message: 'Set GEMINI_API_KEY env var to enable AI curation.' });
    }
    if (!checkRateLimit('ai-scrape', 10)) {
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
    }
    const { query, category, count } = req.body || {};
    const n = Math.min(Math.max(parseInt(String(count), 10) || 3, 1), 10);
    const today = getAsiaDhakaToday();

    const prompt = `You are a job curation assistant for a job portal. Today is ${today} (Asia/Dhaka).

TASK: Use Google Search to find REAL, currently-open job postings matching: "${query || 'recent job openings'}".
Category focus: ${category || 'any'}.

STRICT RULES:
- ONLY real postings from official company career pages or official job boards. NEVER LinkedIn, NEVER Facebook.
- Each job MUST have a real application deadline stated on the posting, and it MUST be after ${today}. If you cannot verify the deadline, SKIP that job.
- Write an ORIGINAL 2-3 sentence summary for descriptionSummary. NEVER copy the posting text verbatim.
- Return AT MOST ${n} jobs.

Return ONLY a JSON array (no markdown, no commentary). Each item:
{"title": "...", "companyName": "...", "location": "...", "jobType": "Full-time|Part-time|Contract|Remote|Internship", "category": "${category || 'Engineering'}", "salaryText": "...", "descriptionSummary": "...", "responsibilities": ["..."], "requirements": ["..."], "benefits": ["..."], "experienceRequired": "...", "vacancy": 1, "applyUrl": "https://...", "sourceName": "...", "sourceUrl": "https://...", "deadline": "YYYY-MM-DD"}`;

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
      });
      const raw = (result as any).text || '';
      const jsonStr = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
      let items: any[] = [];
      try { items = JSON.parse(jsonStr); } catch { items = []; }
      if (!Array.isArray(items)) items = [];

      const inserted: Job[] = [];
      const skipped: { title: string; reason: string }[] = [];
      for (const item of items.slice(0, n)) {
        const title = item.title, companyName = item.companyName, location = item.location;
        const deadline = item.deadline, applyUrl = item.applyUrl, sourceUrl = item.sourceUrl;
        if (!title || !companyName || !location || !deadline || !applyUrl || !sourceUrl) {
          skipped.push({ title: title || '(unknown)', reason: 'missing required fields' });
          continue;
        }
        if (!/^https?:\/\//.test(applyUrl) || !/^https?:\/\//.test(sourceUrl)) {
          skipped.push({ title, reason: 'invalid URLs' });
          continue;
        }
        if (deadline < today) {
          skipped.push({ title, reason: 'deadline not in the future' });
          continue;
        }
        if (await isDuplicateSourceUrl(sourceUrl)) {
          skipped.push({ title, reason: 'duplicate of existing job' });
          continue;
        }
        const { data, error } = await supabase!
          .from('jobs')
          .insert(toDbJob(item, 'agent', 'draft'))
          .select()
          .single();
        if (error) {
          skipped.push({ title, reason: 'db error: ' + error.message });
          continue;
        }
        inserted.push(toApiJob(data));
      }
      res.json({ jobs: inserted, inserted: inserted.length, skipped });
    } catch (err: any) {
      console.error('[JobPulse] AI scrape failed:', err?.message || err);
      res.status(500).json({ error: 'AI_SCRAPE_FAILED', message: err?.message || 'Unknown error' });
    }
  });

  // ---- Static frontend ----
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[JobPulse] Server running on http://localhost:${PORT}`);
  });
}

startServer();
