export interface Project {
  name: string;
  description: string;
  demoLink?: string;
  image?: string;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  period: string;
  skills: string[];
  summary: string;
  responsibilities: string[];
  projects: Project[];
}