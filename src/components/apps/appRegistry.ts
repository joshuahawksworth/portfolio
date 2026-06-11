import type { ComponentType } from 'react';
import AboutApp from './AboutApp';
import CalculatorApp from './CalculatorApp';
import ContactApp from './ContactApp';
import DoomApp from './DoomApp';
import ExperienceApp from './ExperienceApp';
import FinderApp from './FinderApp';
import ImageViewerApp from './ImageViewerApp';
import KeyboardShortcutsApp from './KeyboardShortcutsApp';
import LocationApp from './LocationApp';
import RubberDuckApp from './RubberDuckApp';
import SafariApp from './SafariApp';
import SkillsApp from './SkillsApp';
import SlotslopApp from './SlotslopApp';
import TerminalApp from './TerminalApp';
import TextEditorApp from './TextEditorApp';
import TrashApp from './TrashApp';

type Size = { width: number; height: number };

export type PortfolioAppId =
  | 'about'
  | 'experience'
  | 'skills'
  | 'contact'
  | 'location'
  | 'terminal'
  | 'finder'
  | 'trash'
  | 'safari'
  | 'githubapp'
  | 'doom'
  | 'snake'
  | 'rubberduck'
  | 'shortcuts'
  | 'texteditor'
  | 'imageviewer'
  | 'slotslop'
  | 'calculator';

export type PortfolioAppComponent = ComponentType<{ props?: Record<string, unknown> }>;

export interface PortfolioAppDefinition {
  id: PortfolioAppId;
  title: string;
  component?: PortfolioAppComponent;
  defaultSize: Size;
  minSize: Size;
  maxSize: Size;
}

export const PORTFOLIO_APPS = {
  about: {
    id: 'about',
    title: 'About Josh',
    component: AboutApp,
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
    maxSize: { width: 720, height: 600 },
  },
  experience: {
    id: 'experience',
    title: 'Work Experience',
    component: ExperienceApp,
    defaultSize: { width: 820, height: 580 },
    minSize: { width: 500, height: 380 },
    maxSize: { width: 1060, height: 700 },
  },
  skills: {
    id: 'skills',
    title: 'Skills & Tech',
    component: SkillsApp,
    defaultSize: { width: 560, height: 460 },
    minSize: { width: 360, height: 280 },
    maxSize: { width: 820, height: 620 },
  },
  contact: {
    id: 'contact',
    title: 'New Message',
    component: ContactApp,
    defaultSize: { width: 520, height: 480 },
    minSize: { width: 360, height: 300 },
    maxSize: { width: 680, height: 560 },
  },
  location: {
    id: 'location',
    title: 'Manchester, UK',
    component: LocationApp,
    defaultSize: { width: 700, height: 520 },
    minSize: { width: 380, height: 280 },
    maxSize: { width: 960, height: 700 },
  },
  terminal: {
    id: 'terminal',
    title: 'Terminal',
    component: TerminalApp,
    defaultSize: { width: 680, height: 460 },
    minSize: { width: 380, height: 240 },
    maxSize: { width: 960, height: 640 },
  },
  finder: {
    id: 'finder',
    title: 'Finder',
    component: FinderApp,
    defaultSize: { width: 780, height: 520 },
    minSize: { width: 460, height: 320 },
    maxSize: { width: 1060, height: 720 },
  },
  trash: {
    id: 'trash',
    title: 'Trash',
    component: TrashApp,
    defaultSize: { width: 480, height: 360 },
    minSize: { width: 320, height: 240 },
    maxSize: { width: 580, height: 440 },
  },
  safari: {
    id: 'safari',
    title: 'Google Chrome',
    component: SafariApp,
    defaultSize: { width: 900, height: 620 },
    minSize: { width: 600, height: 400 },
    maxSize: { width: 900, height: 620 },
  },
  githubapp: {
    id: 'githubapp',
    title: 'GitHub',
    component: SafariApp,
    defaultSize: { width: 900, height: 620 },
    minSize: { width: 600, height: 400 },
    maxSize: { width: 900, height: 620 },
  },
  doom: {
    id: 'doom',
    title: 'DOOM',
    component: DoomApp,
    defaultSize: { width: 800, height: 640 },
    minSize: { width: 540, height: 460 },
    maxSize: { width: 1060, height: 760 },
  },
  snake: {
    id: 'snake',
    title: 'Snake',
    component: undefined,
    defaultSize: { width: 480, height: 560 },
    minSize: { width: 380, height: 440 },
    maxSize: { width: 640, height: 680 },
  },
  rubberduck: {
    id: 'rubberduck',
    title: 'Rubber Duck',
    component: RubberDuckApp,
    defaultSize: { width: 460, height: 460 },
    minSize: { width: 360, height: 360 },
    maxSize: { width: 620, height: 560 },
  },
  shortcuts: {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    component: KeyboardShortcutsApp,
    defaultSize: { width: 560, height: 500 },
    minSize: { width: 380, height: 360 },
    maxSize: { width: 760, height: 640 },
  },
  texteditor: {
    id: 'texteditor',
    title: 'Text Editor',
    component: TextEditorApp,
    defaultSize: { width: 780, height: 540 },
    minSize: { width: 480, height: 340 },
    maxSize: { width: 1060, height: 740 },
  },
  imageviewer: {
    id: 'imageviewer',
    title: 'Image Viewer',
    component: ImageViewerApp,
    defaultSize: { width: 720, height: 560 },
    minSize: { width: 400, height: 360 },
    maxSize: { width: 1060, height: 760 },
  },
  slotslop: {
    id: 'slotslop',
    title: 'Slotslop',
    component: SlotslopApp,
    defaultSize: { width: 980, height: 700 },
    minSize: { width: 760, height: 520 },
    maxSize: { width: 1120, height: 760 },
  },
  calculator: {
    id: 'calculator',
    title: 'Calculator',
    component: CalculatorApp,
    defaultSize: { width: 280, height: 420 },
    minSize: { width: 240, height: 360 },
    maxSize: { width: 400, height: 620 },
  },
} satisfies Record<PortfolioAppId, PortfolioAppDefinition>;

export const APP_DEFAULTS = Object.fromEntries(
  Object.entries(PORTFOLIO_APPS).map(([id, app]) => [id, { title: app.title, ...app.defaultSize }])
) as Record<string, { title: string; width: number; height: number }>;

export const APP_MIN = Object.fromEntries(
  Object.entries(PORTFOLIO_APPS).map(([id, app]) => [id, app.minSize])
) as Record<string, Size>;

export const APP_MAX = Object.fromEntries(
  Object.entries(PORTFOLIO_APPS).map(([id, app]) => [id, app.maxSize])
) as Record<string, Size>;

export const APP_COMPONENTS = Object.fromEntries(
  Object.entries(PORTFOLIO_APPS)
    .filter(([, app]) => app.component)
    .map(([id, app]) => [id, app.component])
) as Record<string, PortfolioAppComponent>;
