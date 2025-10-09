import { Job } from '../types/experience';
import cmapMailImage from '../assets/cmap-mail.png';
import cmapLogo from '../assets/company-logos/cmap.svg';

export const jobsData: Job[] = [
    {
    id: 'cmap-software',
    company: 'CMap Software',
    logo: cmapLogo,
    role: 'Senior Software Developer',
    period: 'March 2024 - October 2025',
    skills: [
        'Senior Management',
        'React + TypeScript',
        'Microsoft Graph API',
        'SharePoint',
        'UI/UX (Figma)',
        'CI/CD',
        'TDD',
        'Monorepo Architecture'
    ],
    summary: 'Led the architecture and development of a comprehensive email management ecosystem, building a monorepo solution that integrates Outlook with SharePoint to enhance how architects organize and retrieve their emails, records, and drawings within a project. This tool streamlines the filing process for architects preparing for auditing season.',
    responsibilities: [
        'Architected and maintained a monorepo containing four interconnected applications',
        'Developed an Outlook Add-in enabling users to file emails directly into SharePoint sites',
        'Built a Discovery web app leveraging Microsoft Graph API for email retrieval and management',
        'Created an Admin portal for project migration and user management across SharePoint sites',
        'Engineered an Install web app for automated SharePoint hub site provisioning, including search schemas, site designs, and granular permission management',
        'Designed intuitive UI/UX workflows in Figma across all four applications',
        'Established CI/CD pipelines and TDD practices across the team, ensuring reliable deployments'
    ],
    projects: [
        {
            name: 'CMap Mail',
            description: 'A sophisticated monorepo consisting of four integrated applications: an Outlook Add-in for seamless email filing, a Discovery platform using Microsoft Graph API for email search and retrieval, an Admin site for project migration and user management, and an Install application for automated SharePoint hub site provisioning with search schemas, site designs, and permission configurations. Built specifically for architects and engineers managing complex project communications and preparing for auditing season.',
            externalProjectLink: 'https://www.cmap.io/product-tours/atvero-mail-overview',
            image: cmapMailImage
        }
    ]
    },
  // Placeholder for other companies
  {
    id: 'company-2',
    company: 'Company 2',
    role: 'Role',
    period: '2022 - 2023',
    skills: ['Skill 1', 'Skill 2'],
    summary: 'Brief summary of your role and impact.',
    responsibilities: ['Responsibility 1', 'Responsibility 2'],
    projects: []
  },
  {
    id: 'company-3',
    company: 'Company 3',
    role: 'Role',
    period: '2021 - 2022',
    skills: ['Skill 1', 'Skill 2'],
    summary: 'Brief summary of your role and impact.',
    responsibilities: ['Responsibility 1', 'Responsibility 2'],
    projects: []
  },
  {
    id: 'company-4',
    company: 'Company 4',
    role: 'Role',
    period: '2020 - 2021',
    skills: ['Skill 1', 'Skill 2'],
    summary: 'Brief summary of your role and impact.',
    responsibilities: ['Responsibility 1', 'Responsibility 2'],
    projects: []
  },
  {
    id: 'company-5',
    company: 'Company 5',
    role: 'Role',
    period: '2019 - 2020',
    skills: ['Skill 1', 'Skill 2'],
    summary: 'Brief summary of your role and impact.',
    responsibilities: ['Responsibility 1', 'Responsibility 2'],
    projects: []
  },
  {
    id: 'company-6',
    company: 'Company 6',
    role: 'Role',
    period: '2018 - 2019',
    skills: ['Skill 1', 'Skill 2'],
    summary: 'Brief summary of your role and impact.',
    responsibilities: ['Responsibility 1', 'Responsibility 2'],
    projects: []
  }
];