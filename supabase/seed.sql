-- JobPulse CMS seed data (optional demo content)
-- Run AFTER 001 + 002 migrations, in Supabase SQL Editor.
-- Deadlines are relative to CURRENT_DATE so seeded jobs are never expired.

-- Companies
insert into companies (name, logo, website, description) values
('NeuralScale Labs', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', 'https://neuralscale.example.com', 'AI infrastructure & agentic workflow builders.'),
('PixelCraft Studio', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80', 'https://pixelcraft.example.com', 'Enterprise design systems & SaaS UI.'),
('GrowthVortex', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=80', 'https://growthvortex.example.com', 'B2B SaaS performance marketing.')
on conflict do nothing;

-- Categories
insert into categories (name, slug, icon) values
('Engineering', 'engineering', 'Code'),
('Product', 'product', 'BriefcaseBusiness'),
('Design', 'design', 'Palette'),
('Marketing', 'marketing', 'Megaphone'),
('Sales', 'sales', 'TrendingUp'),
('Data', 'data', 'Database')
on conflict (slug) do nothing;

-- Sample jobs (all published, future deadlines)
insert into jobs (slug, title, company_name, company_logo, location, job_type, category, salary_min, salary_max, salary_currency, salary_text, description_summary, responsibilities, requirements, benefits, vacancy, experience_required, apply_url, source_name, source_url, posted_date, deadline, status, posted_by, is_featured)
values
('senior-full-stack-ai-engineer-neuralscale-labs-seed', 'Senior Full Stack AI Engineer', 'NeuralScale Labs',
 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
 'Dhaka', 'Full-time', 'Engineering', 160000, 210000, 'BDT', '160k - 210k BDT / mo',
 'We are looking for an experienced Full Stack AI Engineer to build cutting-edge agentic workflows and multi-modal apps using React and Node.js.',
 array['Design and build scalable React/Node.js full-stack architectures', 'Integrate LLM and generative AI APIs', 'Optimize vector databases and RAG pipelines'],
 array['5+ years of full-stack software development experience', 'Deep proficiency in TypeScript, React, and Node.js', 'Experience integrating LLMs and generative AI APIs'],
 array['Competitive salary + equity package', 'Health insurance', 'Flexible working hours'],
 2, '5+ years',
 'https://neuralscale.example.com/careers/ai-engineer/apply', 'Company Career Page', 'https://neuralscale.example.com/careers/ai-engineer',
 CURRENT_DATE, CURRENT_DATE + interval '60 days', 'published', 'admin', true),

('lead-product-designer-pixelcraft-studio-seed', 'Lead Product Designer (UX/UI)', 'PixelCraft Studio',
 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop&q=80',
 'Remote', 'Remote', 'Design', 130000, 175000, 'BDT', 'Negotiable',
 'Join our award-winning design team shaping enterprise SaaS dashboards and AI interfaces with cutting-edge design systems.',
 array['Lead design systems and user research', 'Create high-fidelity prototypes in Figma', 'Collaborate closely with frontend engineers'],
 array['4+ years designing complex web applications', 'Mastery of Figma and design tokens', 'Strong portfolio showcasing SaaS case studies'],
 array['100% remote work', 'Wellness stipend'],
 1, '4+ years',
 'https://pixelcraft.example.com/apply', 'BDJobs', 'https://bdjobs.example.com/job/pixelcraft-designer',
 CURRENT_DATE, CURRENT_DATE + interval '45 days', 'published', 'admin', false),

('digital-marketing-manager-growthvortex-seed', 'Digital Marketing Manager', 'GrowthVortex',
 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&auto=format&fit=crop&q=80',
 'Dhaka', 'Full-time', 'Marketing', 90000, 120000, 'BDT', '90k - 120k BDT / mo',
 'Own the growth engine for our B2B SaaS suite - from paid acquisition to lifecycle marketing across the funnel.',
 array['Plan and run paid campaigns across Google and Meta', 'Own marketing analytics and reporting', 'Lead a team of 3 marketers'],
 array['3+ years in B2B SaaS marketing', 'Hands-on with Google Ads and analytics', 'Strong written English'],
 array['Performance bonuses', 'Health insurance', 'Hybrid work'],
 1, '3+ years',
 'https://growthvortex.example.com/careers/marketing-manager/apply', 'Company Career Page', 'https://growthvortex.example.com/careers/marketing-manager',
 CURRENT_DATE, CURRENT_DATE + interval '30 days', 'published', 'admin', false)
on conflict (slug) do nothing;
