import { Job } from '../types/experience';
import cmapMailImage from '../assets/cmap-mail.png';
import cmapLogo from '../assets/company-logos/cmap.svg';
import orangesLogo from '../assets/company-logos/17oranges.jpg';
import accessGroupLogo from '../assets/company-logos/access-group.svg';
import orderbeeImage from '../assets/orderbee.png';
import drawingRoomLogo from '../assets/company-logos/tdrc.jpg';
import tofsImage from '../assets/tofs.jpg';
import langleyFoxallLogo from '../assets/company-logos/langleyfoxall.png';
import ciclozoneImage from '../assets/ciclo-zone.png';
import edynamixLogo from '../assets/company-logos/edynamix.svg';
import webMasterImage from '../assets/webmaster.webp';

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
      'Monorepo',
    ],
    summary:
      'Led the architecture and development of an email management ecosystem, building a monorepo that integrates an Outlook Add-in with SharePoint to enhance how architects organize and retrieve their emails, records, and drawings within an architectural project. This tool allows architects to prepare for auditing season.',
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
        linkText: 'View Online Demo',
        image: cmapMailImage,
      },
    ],
  },
  {
    id: '17-oranges',
    company: '17 Oranges',
    logo: orangesLogo,
    role: 'Frontend Mobile Developer',
    period: 'Feb 2023 - March 2024',
    skills: [
      'React Native',
      'TypeScript',
      'iOS & Android',
      'UI/UX Design',
      'Expo',
      'Git Management',
    ],
    summary:
      'Sole frontend developer responsible for the complete mobile application interface of a social planning app, working from concept to deployment. Collaborated closely with customers and a senior backend developer to transform their vision into a market-ready product that makes planning and organizing group events simple and easy.',
    responsibilities: [
      'Designed and implemented UI/UX workflows for iOS and Android platforms',
      'Collaborated closely with a senior backend developer on API integration and requirements',
      'Participated in workshop sessions with customers to define product requirements',
      'Managed frontend Git workflows and deployment processes for both iOS and Android platforms',
      'Ensured continuous client feedback and satisfaction throughout the development cycle',
    ],
    projects: [
      {
        name: 'Kwando',
        description:
          'A social planning mobile application that streamlines group coordination by simplifying it to a single platform. Built the entire frontend from scratch using React Native for cross-platform deployment, integrated with a custom NestJS backend API. The app eliminates the frustration of coordinating events across various apps, phone calls, and emails, providing users with a unified solution for managing their social lives.',
        externalProjectLink: 'https://www.17oranges.com/about/case-studies/app-development',
        linkText: 'Read Case Study',
      },
    ],
  },
  {
    id: 'the-access-group',
    company: 'The Access Group',
    logo: accessGroupLogo,
    role: 'Full Stack Web and Mobile Developer',
    period: 'Sep 2022 - Feb 2023',
    skills: [
      'VueJS',
      'React Native',
      'TypeScript',
      'TDD',
      'Azure DevOps',
      'Scrum Methodology',
      'Agile Development',
      'Client Management',
    ],
    summary:
      'Contributed to the development of Orderbee, a hospitality ordering platform, working in a fast-paced agile environment to deliver features across web and mobile applications while managing client relationships and coordinating team workflows.',
    responsibilities: [
      'Developed features for Orderbee web application using VueJS and TypeScript',
      'Built and maintained mobile app functionality using React Native',
      'Practiced Test-Driven Development to ensure code quality and reliability',
      'Participated in daily standups, sprint planning, and retrospectives following Scrum methodology',
      'Coordinated development workflows through Azure DevOps',
      'Prioritized and triaged issues to maintain smooth development cycles for the team',
      'Delivered features in iterative sprints within an agency environment',
    ],
    projects: [
      {
        name: 'Orderbee',
        description:
          'A hospitality ordering solution that simplifies the ordering process for restaurants, pubs, and hotels. Built to support web and mobile, Orderbee enables customers to quickly order and pay and helps businesses manage these transactions easily. Worked on both the customer-facing applications and internal management systems.',
        externalProjectLink: 'https://www.theaccessgroup.com/en-gb/products/orderbee/',
        linkText: 'Learn More',
        image: orderbeeImage,
      },
    ],
  },
  {
    id: 'drawing-room-creative',
    company: 'The Drawing Room Creative',
    logo: drawingRoomLogo,
    role: 'Mobile Developer',
    period: 'Dec 2021 - Sep 2022',
    skills: [
      'React Native',
      'TypeScript',
      'iOS & Android',
      'Micro Services',
      'Git Management',
      'App Deployment',
      'CI/CD',
      'Team Leadership & Mentoring',
    ],
    summary:
      'Led frontend development for a loyalty application that onboarded over 150,000 users in its first year, delivering a bespoke solution in a fast-paced agency environment while mentoring team members and implementing CI/CD practices.',
    responsibilities: [
      'Architected and implemented a custom loyalty badge system with rewards and referral mechanics (achievements!)',
      'Built an interactive daily scratchcard game to drive user engagement and retention',
      'Integrated push notification system using Firebase Cloud Messaging for real-time user updates',
      'Collaborated with backend team to implement microservices architecture',
      'Mentored junior developers and conducted code reviews to maintain quality standards',
      'Deployed and maintained applications on both iOS and Android platforms',
      'Worked under tight deadlines in a high-pressure agency environment',
    ],
    projects: [
      {
        name: 'TOFS App',
        description:
          'A customer engagement and loyalty application for retailer The Original Factory Shop, featuring a badge collection system, daily scratchcard rewards, and personalized offers. The app successfully onboarded over 150,000 users in its first year, resulting in increased shopping frequency and higher average spend per customer. Built with React Native for cross-platform deployment.',
        externalProjectLink: 'https://thedrawingroomcreative.com/work/the-original-factory-shop',
        linkText: 'View Case Study',
        image: tofsImage,
      },
    ],
  },
  {
    id: 'langley-foxall',
    company: 'Langley Foxall',
    logo: langleyFoxallLogo,
    role: 'Web & Mobile Developer',
    period: 'Apr 2021 - Dec 2021',
    skills: [
      'React & React Native',
      'PHP Laravel',
      'RESTful APIs',
      'JS Unit Testing',
      'Bluetooth Integration',
      'AWS',
      'Pair Programming',
      'CMS Development',
    ],
    summary:
      'Delivered multiple client solutions in an agency environment, building custom content management systems for healthcare and sales sectors. Contributed to the development of a fitness platform called CicloZone featuring a mobile application with Bluetooth connectivity, video content management, and web brochure.',
    responsibilities: [
      'Developed CMS solutions for diverse clients including osteopathy clinics and a door manufacturing sales company',
      'Contributed to iOS and Android application development with Bluetooth connectivity for exercise bikes',
      'Designed and implemented RESTful APIs using PHP Laravel',
      'Worked on a Laravel-based video content management system for bike workout videos',
      'Practiced pair programming to ensure code quality and knowledge sharing',
    ],
    projects: [
      {
        name: 'CicloZone',
        description:
          'A fitness ecosystem consisting of three integrated components: a React Native mobile app with Bluetooth connectivity for pairing with exercise bikes and tracking workouts in real-time, a Laravel-based CMS for uploading and managing video content displayed during workouts, and a React brochure website.',
        externalProjectLink: 'https://www.ciclozone.com/',
        linkText: 'Visit Website',
        image: ciclozoneImage,
      },
    ],
  },
  {
    id: 'edynamix',
    company: 'eDynamix',
    logo: edynamixLogo,
    role: 'Junior Web Developer & Designer',
    period: 'Oct 2019 - Apr 2021',
    skills: [
      'PHP',
      'WordPress (JS + PHP)',
      'jQuery',
      'Laravel',
      'UI & UX Design',
      'RESTful APIs',
      'CMS Development',
    ],
    summary:
      'Contributed to the development of a CRM platform that enabled car dealerships to build and manage their websites through a content management system. Worked closely with a team to design user-friendly interfaces and implement custom functionality per customer requests.',
    responsibilities: [
      'Developed Web Master, a CRM platform for car dealership website creation and management',
      'Designed and implemented UI/UX workflows for the Web Master CRM interface',
      'Built a custom WordPress plugin using PHP and JavaScript',
      'Worked with Laravel framework for backend functionality and CRM features',
      'Maintained and updated existing dealership websites through the CRM platform',
    ],
    projects: [
      {
        name: 'Web Master',
        description:
          'A CRM platform designed specifically for the automotive industry, enabling car dealerships and developers to create, customize, and manage dealership websites without technical expertise. The system provides an intuitive interface for content management, vehicle inventory display, and customer engagement tools.',
        externalProjectLink: 'https://www.edynamix-demo.com/web-master',
        linkText: 'View Brochure Site',
        image: webMasterImage,
      },
    ],
  },
];
