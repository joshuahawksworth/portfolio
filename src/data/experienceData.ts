import { Job } from '../types/experience';
import cmapMailImage from '../assets/cmap-mail.png';

export const jobsData: Job[] = [
  {
    id: 'cmap-software',
    company: 'CMap Software',
    role: 'Senior Software Developer',
    period: 'March 2024 - October 2025',
    skills: [
      'Senior Management',
      'React + TypeScript',
      'UI/UX (Figma)',
      'CI/CD',
      'TDD'
    ],
    summary: 'Led the design and development of an intelligent email management solution, transforming how professionals organize and retrieve their communications within SharePoint environments.',
    responsibilities: [
      'Architected and deployed a modern Outlook add-in using React and TypeScript',
      'Designed intuitive UI/UX workflows in Figma for seamless email filing experiences',
      'Integrated intelligent conversation threading with SharePoint file management systems',
      'Implemented automated email organization to reduce manual filing by 80%',
      'Established CI/CD pipelines and TDD practices for reliable releases'
    ],
    projects: [
      {
        name: 'CMap Mail',
        description: 'An assisted email filing solution that automatically organizes emails by conversation, maintains thread integrity, and intelligently files future correspondence. Built specifically for architects and engineers managing complex project communications.',
        demoLink: 'https://www.cmap.io/product-tours/atvero-mail-overview',
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