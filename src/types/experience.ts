export interface Project {
  name: string;
  description: string;
  externalProjectLink?: string;
  linkText?: string;
  image?: string;
}

export interface Job {
  id: string;
  company: string;
  logo?: string;
  role: string;
  period: string;
  skills: string[];
  summary: string;
  responsibilities: string[];
  projects: Project[];
}
