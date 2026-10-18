import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Job, Application, Company, Category, JobType, JobStatus, PostedBy } from './src/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let companies: Company[] = [
  { id: 'comp-1', name: 'NeuralScale Labs', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', website: 'https://neuralscale.example.com', description: 'AI infrastructure & agentic workflow builders.' },
  { id: 'comp-2', name: 'PixelCraft Studio', logo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80', website: 'https://pixelcraft.example.com', description: 'Enterprise design systems & SaaS UI.' },
  { id: 'comp-3', name: 'GrowthVortex', logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=80', website: 'https://growthvortex.example.com', description: 'B2B SaaS performance marketing.' },
];

let categories: Category[] = [
  { id: 'cat-1', name: 'Engineering', slug: 'engineering', icon: 'Code' },
  { id: 'cat-2', name: 'Product', slug: 'product', icon: 'BriefcaseBusiness' },
  { id: 'cat-3', name: 'Design', slug: 'design', icon: 'Palette' },
  { id: 'cat-4', name: 'Marketing', slug: 'marketing', icon: 'Megaphone' },
  { id: 'cat-5', name: 'Sales', slug: 'sales', icon: 'TrendingUp' },
  { id: 'cat-6', name: 'Data', slug: 'data', icon: 'Database' },
];

let jobs: Job[] = [
  {
    id: 'job-1',
    slug: 'senior-full-stack-ai-engineer-neuralscale-labs',
    title: 'Senior Full Stack AI Engineer',
    companyId: 'comp-1',
    companyName: 'NeuralScale Labs',
    company: 'NeuralScale Labs',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    location: 'Dhaka',
    jobType: 'Full-time',
    type: 'Full-time',
    category: 'Engineering',
    salaryMin: 160000,
    salaryMax: 210000,
    salaryCurrency: 'BDT',
    currency: 'BDT',
    salaryText: '160k - 210k BDT / mo',
    descriptionSummary: 'We are looking for an experienced Full Stack AI Engineer to build cutting-edge agentic workflows and multi-modal apps using React and Node.js.',
    description: 'We are looking for an experienced Full Stack AI Engineer to build cutting-edge agentic workflows and multi-modal apps using React and Node.js.',
    responsibilities: [
      'Design and build scalable React/Node.js full-stack architectures',
      'Integrate LLM and generative AI APIs (@google/genai)',
      'Optimize vector databases and RAG pipelines'
    ],
    requirements: [
      '5+ years of full-stack software development experience',
      'Deep proficiency in TypeScript, React, and Node.js',
      'Experience integrating LLMs and generative AI APIs'
    ],
    benefits: [
      'Competitive salary + equity package',
      'Comprehensive health, dental, and vision insurance',
      'Unlimited PTO and flexible working hours'
    ],
    vacancy: 2,
    vacancyCount: 2,
    experienceRequired: '5+ years',
    applyUrl: 'https://neuralscale.example.com/careers/ai-engineer/apply',
    sourceName: 'Company Career Page',
    source: 'Company Career Page',
    sourceUrl: 'https://neuralscale.example.com/careers/ai-engineer',
    postedDate: '2026-10-01',
    deadline: '2026-12-15',
    applicationDeadline: '2026-12-15',
    status: 'published',
    postedBy: 'admin',
    isFeatured: true,
    applicantsCount: 12,
    viewsCount: 340
  },
  {
    id: 'job-2',
    slug: 'lead-product-designer-pixelcraft-studio',
    title: 'Lead Product Designer (UX/UI)',
    companyId: 'comp-2',
    companyName: 'PixelCraft Studio',
    company: 'PixelCraft Studio',
    companyLogo: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80',
    location: 'Remote',
    jobType: 'Remote',
    type: 'Remote',
    category: 'Design',
    salaryMin: 130000,
    salaryMax: 175000,
    salaryCurrency: 'BDT',
    currency: 'BDT',
    salaryText: 'Negotiable',
    descriptionSummary: 'Join our award-winning design team shaping enterprise SaaS dashboards and AI interfaces with cutting-edge design systems.',
    description: 'Join our award-winning design team shaping enterprise SaaS dashboards and AI interfaces with cutting-edge design systems.',
    responsibilities: [
      'Lead design systems and user research',
      'Create high-fidelity prototypes in Figma',
      'Collaborate closely with frontend engineers'
    ],
    requirements: [
      '4+ years designing complex web applications',
      'Mastery of Figma and design tokens',
      'Strong portfolio showcasing SaaS case studies'
    ],
    benefits: [
      '100% remote work freedom with home office setup budget',
      'Flexible wellness stipend ($1,500/yr)'
    ],
    vacancy: 1,
    vacancyCount: 1,
    experienceRequired: '4+ years',
    applyUrl: 'https://pixelcraft.example.com/apply',
    sourceName: 'BDJobs',
    source: 'BDJobs',
    sourceUrl: 'https://bdjobs.com/job/pixelcraft-designer',
    postedDate: '2026-10-05',
    deadline: '2026-11-20',
    applicationDeadline: '2026-11-20',
    status: 'published',
    postedBy: 'agent',
    isFeatured: true,
    applicantsCount: 8,
    viewsCount: 215
  }
];

let applications: Application[] = [];

// Rate limiter storage for API keys (max 50 requests / hour)
const agentRateLimitLog: Record<string, number[]> = {};
function checkAgentRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  if (!agentRateLimitLog[apiKey]) agentRateLimitLog[apiKey] = [];
  agentRateLimitLog[apiKey] = agentRateLimitLog[apiKey].filter(t => t > oneHourAgo);
  if (agentRateLimitLog[apiKey].length >= 50) return false;
  agentRateLimitLog[apiKey].push(now);
  return true;
}

function getAsiaDhakaToday(): string {
  try {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function formatJob(job: Job): Job {
  return {
    ...job,
    company: job.companyName,
    type: job.jobType,
    currency: job.salaryCurrency,
    description: job.descriptionSummary,
    source: job.sourceName,
    applicationDeadline: job.deadline,
    vacancyCount: job.vacancy
  };
}

// EXPIRY LOGIC: At 00:05 Asia/Dhaka or on check, set status = expired where deadline < today AND status = published
function checkAndAutoExpireJobs() {
  const todayStr = getAsiaDhakaToday();
  jobs = jobs.map(job => {
    if (job.status === 'published' && job.deadline < todayStr) {
      return { ...job, status: 'expired' };
    }
    return job;
  });
}

// Daily Cron simulation at 00:05 Asia/Dhaka
setInterval(() => {
  checkAndAutoExpireJobs();
}, 60000); // check every minute

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET /api/health endpoint
  app.get('/api/health', (req, res) => {
    checkAndAutoExpireJobs();
    const activeJobsCount = jobs.filter(j => j.status === 'published' && j.deadline >= getAsiaDhakaToday()).length;
    res.json({
      ok: true,
      time: new Date().toISOString(),
      activeJobsCount
    });
  });

  app.get('/api/companies', (req, res) => res.json(companies));
  app.post('/api/companies', (req, res) => {
    const comp: Company = {
      id: `comp-${Date.now()}`,
      name: req.body.name,
      logo: req.body.logo || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100&auto=format&fit=crop&q=80',
      website: req.body.website || '',
      description: req.body.description || ''
    };
    companies.push(comp);
    res.status(201).json(comp);
  });

  app.get('/api/categories', (req, res) => res.json(categories));
  app.post('/api/categories', (req, res) => {
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: req.body.name,
      slug: req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, '-'),
      icon: req.body.icon || 'Briefcase'
    };
    categories.push(cat);
    res.status(201).json(cat);
  });

  // Public Jobs endpoint (NEVER shows jobs where deadline < today OR status != published)
  app.get('/api/jobs', (req, res) => {
    checkAndAutoExpireJobs();
    const { 
      status = 'published', 
      category, 
      location, 
      jobType, 
      sourceName, 
      search, 
      minSalary, 
      sort = 'newest',
      page = '1',
      limit = '12'
    } = req.query;

    const todayStr = getAsiaDhakaToday();
    let filtered = jobs.filter(j => j.status === 'published' && j.deadline >= todayStr);

    if (status === 'draft') {
      filtered = jobs.filter(j => j.status === 'draft');
    } else if (status === 'all') {
      filtered = [...jobs];
    }

    if (category && category !== 'All') {
      filtered = filtered.filter(j => j.category === category);
    }
    if (location && location !== 'All') {
      filtered = filtered.filter(j => j.location.toLowerCase().includes((location as string).toLowerCase()));
    }
    if (jobType && jobType !== 'All') {
      filtered = filtered.filter(j => j.jobType === jobType);
    }
    if (sourceName && sourceName !== 'All') {
      filtered = filtered.filter(j => j.sourceName.toLowerCase().includes((sourceName as string).toLowerCase()));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.companyName.toLowerCase().includes(q) || 
        j.location.toLowerCase().includes(q) ||
        j.descriptionSummary.toLowerCase().includes(q) ||
        j.requirements.some(r => r.toLowerCase().includes(q))
      );
    }
    if (minSalary) {
      filtered = filtered.filter(j => (j.salaryMax || 0) >= Number(minSalary));
    }

    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else if (sort === 'deadline') {
      filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (sort === 'salary-high') {
      filtered.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 12;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum).map(formatJob);

    res.json({
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(filtered.length / limitNum) || 1,
      jobs: paginated
    });
  });

  app.get('/api/admin/jobs', (req, res) => {
    checkAndAutoExpireJobs();
    res.json(jobs.map(formatJob));
  });

  app.get('/api/jobs/:slugOrId', (req, res) => {
    checkAndAutoExpireJobs();
    const query = req.params.slugOrId;
    const job = jobs.find(j => j.id === query || j.slug === query);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    job.viewsCount = (job.viewsCount || 0) + 1;
    res.json(formatJob(job));
  });

  // CRITICAL: AGENT API POST /api/jobs
  app.post('/api/jobs', (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    const validApiKey = process.env.AGENT_API_KEY || 'jobpulse_agent_secret_key_2026';

    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({ error: 'UNAUTHORIZED_API_KEY' });
    }

    if (!checkAgentRateLimit(apiKey)) {
      return res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
    }

    const body = req.body;
    const title = body.title;
    const companyName = body.companyName || body.company_name;
    const location = body.location;
    const deadline = body.deadline;
    const applyUrl = body.applyUrl || body.apply_url;
    const sourceUrl = body.sourceUrl || body.source_url;
    const sourceName = body.sourceName || body.source_name || 'Company Career Page';
    const descriptionSummary = body.descriptionSummary || body.description_summary || body.description;
    const jobType = body.jobType || body.job_type || 'Full-time';
    const category = body.category || 'Engineering';

    if (!title || !companyName || !location || !deadline) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    }

    if (!applyUrl || !sourceUrl || !applyUrl.startsWith('http') || !sourceUrl.startsWith('http')) {
      return res.status(400).json({ error: 'INVALID_URLS' });
    }

    const todayDhaka = getAsiaDhakaToday();
    if (deadline < todayDhaka) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }

    const duplicate = jobs.find(j => j.sourceUrl === sourceUrl || (j.title.toLowerCase() === title.toLowerCase() && j.companyName.toLowerCase() === companyName.toLowerCase()));
    if (duplicate) {
      return res.status(400).json({ error: 'DUPLICATE_SOURCE_URL' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(Math.random() * 1000)}`;

    const newJob: Job = formatJob({
      id: `agent-job-${Date.now()}`,
      slug,
      title,
      companyId: 'comp-1',
      companyName,
      company: companyName,
      companyLogo: body.companyLogo || body.company_logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80',
      location,
      jobType,
      type: jobType,
      category,
      salaryMin: body.salaryMin !== undefined ? Number(body.salaryMin) : (body.salary_min !== undefined ? Number(body.salary_min) : 0),
      salaryMax: body.salaryMax !== undefined ? Number(body.salaryMax) : (body.salary_max !== undefined ? Number(body.salary_max) : 0),
      salaryCurrency: body.salaryCurrency || body.salary_currency || 'BDT',
      currency: body.salaryCurrency || body.salary_currency || 'BDT',
      salaryText: body.salaryText || body.salary_text || 'Negotiable',
      descriptionSummary: descriptionSummary || 'No summary provided.',
      description: descriptionSummary || 'No summary provided.',
      responsibilities: body.responsibilities || [],
      requirements: body.requirements || [],
      benefits: body.benefits || [],
      vacancy: body.vacancy || 1,
      vacancyCount: body.vacancy || 1,
      experienceRequired: body.experienceRequired || body.experience_required || '2+ years',
      applyUrl,
      sourceName,
      source: sourceName,
      sourceUrl,
      postedDate: body.postedDate || body.posted_date || todayDhaka,
      deadline,
      applicationDeadline: deadline,
      status: 'draft',
      postedBy: 'agent',
      isFeatured: !!body.isFeatured || !!body.is_featured,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicantsCount: 0,
      viewsCount: 0
    });

    jobs.unshift(newJob);
    res.status(201).json({ success: true, id: newJob.id, slug: newJob.slug, status: newJob.status });
  });

  // PATCH /api/jobs/:id/status (Admin approval/rejection)
  app.patch('/api/jobs/:id/status', (req, res) => {
    checkAndAutoExpireJobs();
    const idx = jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });

    const { status } = req.body;
    const todayDhaka = getAsiaDhakaToday();

    if (status === 'published' && jobs[idx].deadline < todayDhaka) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }

    jobs[idx] = formatJob({
      ...jobs[idx],
      status,
      updatedAt: new Date().toISOString()
    });

    res.json(jobs[idx]);
  });

  app.put('/api/jobs/:id', (req, res) => {
    const idx = jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });

    const todayDhaka = getAsiaDhakaToday();
    let status = req.body.status !== undefined ? req.body.status : jobs[idx].status;
    const deadline = req.body.deadline || jobs[idx].deadline;

    if (status === 'published' && deadline < todayDhaka) {
      return res.status(400).json({ error: 'EXPIRED_DEADLINE' });
    }
    if (deadline < todayDhaka) {
      status = 'expired';
    }

    jobs[idx] = formatJob({
      ...jobs[idx],
      ...req.body,
      id: jobs[idx].id,
      status,
      updatedAt: new Date().toISOString()
    });

    res.json(jobs[idx]);
  });

  app.delete('/api/jobs/:id', (req, res) => {
    jobs = jobs.filter(j => j.id !== req.params.id);
    res.json({ success: true });
  });

  app.get('/api/admin/stats', (req, res) => {
    checkAndAutoExpireJobs();
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(today.getDate() + 3);

    const todayStr = getAsiaDhakaToday();
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const publishedJobs = jobs.filter(j => j.status === 'published');
    const expiringIn3Days = jobs.filter(j => j.status === 'published' && j.deadline >= todayStr && j.deadline <= in3DaysStr);
    const expiredJobs = jobs.filter(j => j.status === 'expired' || j.status === 'archived' || j.deadline < todayStr);
    const drafts = jobs.filter(j => j.status === 'draft');

    const bySource: Record<string, number> = {};
    jobs.forEach(j => {
      const src = j.sourceName || 'Other';
      bySource[src] = (bySource[src] || 0) + 1;
    });

    res.json({
      totalActiveJobs: publishedJobs.length,
      expiringIn3Days: expiringIn3Days.length,
      expiredJobs: expiredJobs.length,
      draftsWaitingReview: drafts.length,
      totalCompanies: companies.length,
      jobsBySource: bySource,
      recentAgentPosts: jobs.filter(j => j.postedBy === 'agent').map(formatJob).slice(0, 10),
      recentManualPosts: jobs.filter(j => j.postedBy === 'admin').map(formatJob).slice(0, 10)
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
