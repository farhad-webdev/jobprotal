import type { Job } from '../types';

type SalaryLike = Pick<Job, 'salaryMin' | 'salaryMax' | 'currency' | 'salaryCurrency' | 'salaryText'>;

/** Human-friendly salary: range when known, otherwise salaryText / "Negotiable". */
export function formatSalary(job: SalaryLike): string {
  const min = Number(job.salaryMin) || 0;
  const max = Number(job.salaryMax) || 0;
  const cur = job.currency || job.salaryCurrency || 'BDT';
  if (min > 0 && max > 0) return `${cur}${min.toLocaleString()} - ${cur}${max.toLocaleString()}`;
  if (min > 0) return `${cur}${min.toLocaleString()}`;
  if (max > 0) return `${cur}${max.toLocaleString()}`;
  return job.salaryText || 'Negotiable';
}
