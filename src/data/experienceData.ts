import { Job } from '../types/experience';
import cmapMailImage from '../assets/cmap-mail.png';
import cmapLogo from '../assets/company-logos/cmap.svg';
import orangesLogo from '../assets/company-logos/17oranges.jpg';

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
      'Monorepo Architecture',
    ],
    summary:
      'Led the architecture and development of a email management ecosystem, building a monorepo that integrates a Outlook Add-in with SharePoint to enhance how architects organize and retrieve their emails, records, and drawings within a architectual project. This tool allows architects to prepare for auditing season.',
    responsibilities: [
      'Architected and maintained a monorepo containing four interconnected applications',
      'Developed an Outlook Add-in enabling users to file emails directly into SharePoint sites',
      'Built a Discovery web app leveraging Microsoft Graph API for email retrieval and management',
      'Created an Admin portal for project migration and user management across SharePoint sites',
      'Engineered an Install web app for automated SharePoint hub site provisioning, including search schemas, site designs, and granular permission management',
      'Designed intuitive UI/UX workflows in Figma across all four applications',
      'Established CI/CD pipelines and TDD practices across the team, ensuring reliable deployments',
    ],
    projects: [
      {
        name: 'CMap Mail',
        description:
          'A monorepo consisting of four integrated applications: an Outlook Add-in for email filing, a Discovery platform using Microsoft Graph API for email search and retrieval, an Admin site for project migration and user management, and an Install application for automated SharePoint hub site provisioning with search schemas, site designs, and permission configurations. Built for architects and engineers wanting to manage project documents and prepare for auditing season.',
        externalProjectLink: 'https://www.cmap.io/product-tours/atvero-mail-overview',
        linkText: 'View Live Demo',
        image: cmapMailImage,
      },
    ],
  },
  {
    id: '17-oranges',
    company: '17 Oranges',
    logo: orangesLogo,
    role: 'Lead Mobile Developer',
    period: 'Feb 2023 - March 2024',
    skills: [
      'React Native',
      'TypeScript',
      'iOS & Android',
      'NestJS',
      'Git Management',
      'UI/UX Design',
      'Expo',
    ],
    summary:
      'Led the end-to-end development of a social planning mobile application from concept to deployment, collaborating closely with customers to transform their vision into a market-ready product that makes planning and organising group event simple and easy.',
    responsibilities: [
      'Designed and implemented comprehensive UI/UX workflows',
      'Architected and built robust backend APIs using NestJS and TypeScript',
      'Led a team of 3 developers while overseeing all technical aspects of the project',
      'Facilitated workshop sessions with customers to define product requirements',
      'Managed Git workflows and deployment processes for both iOS and Android platforms',
      'Collaborated with clients ensuring continuous feedback and satisfaction throughout development',
    ],
    projects: [
      {
        name: 'Kwando',
        description:
          'A social planning mobile application that streamlines group coordination by simplifying it to a single platform. Built from scratch using React Native for cross-platform deployment, with a custom NestJS backend API. The app eliminates the frustration of coordinating events across various apps, phone calls, and emails, providing users with a unified solution for managing their social lives.',
        externalProjectLink: 'https://www.17oranges.com/about/case-studies/app-development',
        linkText: 'Read Case Study',
      },
    ],
  },
];
