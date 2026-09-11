import type { Job } from '../types/experience';
import { jobsContent } from './experienceContent';
import arcusLogo from '../assets/company-logos/arcusfm.png';
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

const ASSETS: Record<string, string> = {
  arcusLogo,
  cmapMailImage,
  cmapLogo,
  orangesLogo,
  accessGroupLogo,
  orderbeeImage,
  drawingRoomLogo,
  tofsImage,
  langleyFoxallLogo,
  ciclozoneImage,
  edynamixLogo,
  webMasterImage,
};

export const jobsData: Job[] = jobsContent.map(({ logoKey, projects, ...job }) => ({
  ...job,
  logo: logoKey ? ASSETS[logoKey] : undefined,
  projects: projects.map(({ imageKey, ...project }) => ({
    ...project,
    image: imageKey ? ASSETS[imageKey] : undefined,
  })),
}));
