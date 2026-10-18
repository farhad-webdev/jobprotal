export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Internship';
export type JobStatus = 'draft' | 'published' | 'archived' | 'expired' | 'rejected';
export type PostedBy = 'admin' | 'agent';
export type JobCategory = string;

export interface Company {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  companyId: string;
  companyName: string;
  company: string;
  companyLogo?: string;
  location: string;
  jobType: JobType;
  type: JobType;
  category: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  currency: string;
  salaryText: string;
  descriptionSummary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  vacancy?: number;
  vacancyCount?: number;
  experienceRequired?: string;
  applyUrl: string;
  sourceName: string;
  source: string;
  sourceUrl: string;
  postedDate: string;
  deadline: string;
  applicationDeadline: string;
  status: JobStatus;
  postedBy: PostedBy;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
  applicantsCount?: number;
  viewsCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle?: string;
  companyName?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  resumeText: string;
  coverLetter: string;
  appliedDate: string;
  status: 'submitted' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
  notes?: string;
}
