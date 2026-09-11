/**
 * Offline answers for Ask Claude.
 *
 * Guests (and every visitor when no ANTHROPIC_API_KEY is configured) get replies built
 * straight from the portfolio data in the browser, so the app always answers and never
 * costs anything to run. Replies use the same light markdown the chat renders.
 */
import { jobsContent, type JobContent } from '../data/experienceContent';

const CONTACT = {
  email: 'joshuahawksworth@me.com',
  github: 'https://github.com/joshuahawksworth',
  linkedin: 'https://www.linkedin.com/in/joshua-hawksworth-9741aa209/',
  location: 'Manchester, UK',
  cv: 'https://hawksworth.dev/JoshuaHawksworthCV.pdf',
};

/** What each employer does, for "which industries" style questions. */
const INDUSTRIES: Record<string, string> = {
  'cmap-software': 'architecture and engineering software (document and email management)',
  '17-oranges': 'consumer social apps',
  'the-access-group': 'hospitality ordering',
  'drawing-room-creative': 'retail loyalty and customer engagement',
  'langley-foxall': 'fitness, healthcare and B2B sales (agency work)',
  edynamix: 'automotive retail',
};

const YEARS_EXPERIENCE = (() => {
  const start = new Date(2019, 9, 1); // first role, Oct 2019
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
})();

function jobLine(job: JobContent): string {
  return `- **${job.role}** at ${job.company} (${job.period})`;
}

function projectLine(job: JobContent): string {
  return job.projects
    .map(
      (p) =>
        `- **${p.name}** at ${job.company}: ${firstSentence(p.description)}${
          p.externalProjectLink ? ` [${p.linkText ?? 'Link'}](${p.externalProjectLink})` : ''
        }`
    )
    .join('\n');
}

function firstSentence(text: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(text);
  return m ? m[1] : text;
}

function has(q: string, ...words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

function jobsWithSkill(term: string): JobContent[] {
  const t = term.toLowerCase();
  return jobsContent.filter(
    (j) =>
      j.skills.some((s) => s.toLowerCase().includes(t)) ||
      j.summary.toLowerCase().includes(t) ||
      j.responsibilities.some((r) => r.toLowerCase().includes(t)) ||
      j.projects.some((p) => p.description.toLowerCase().includes(t))
  );
}

const SKILL_ALIASES: Array<[RegExp, string]> = [
  [/react native|mobile app|ios|android/, 'react native'],
  [/\breact\b(?! native)/, 'react'],
  [/typescript|\bts\b/, 'typescript'],
  [/vue/, 'vue'],
  [/laravel|php/, 'laravel'],
  [/nest\.?js|nestjs/, 'nest'],
  [/node/, 'node'],
  [/sharepoint|graph api|outlook|microsoft/, 'sharepoint'],
  [/bluetooth/, 'bluetooth'],
  [/wordpress/, 'wordpress'],
  [/figma|ui\/?ux|design/, 'ui'],
  [/ci\/?cd|pipeline|devops|azure/, 'ci/cd'],
  [/tdd|test/, 'tdd'],
  [/mentor|lead|senior|management/, 'mentor'],
  [/cms/, 'cms'],
];

const SKILL_LABELS: Record<string, string> = {
  'react native': 'React Native',
  react: 'React',
  typescript: 'TypeScript',
  vue: 'Vue.js',
  laravel: 'PHP and Laravel',
  nest: 'NestJS',
  node: 'Node.js',
  sharepoint: 'Microsoft 365 (SharePoint, Graph API, Outlook add-ins)',
  bluetooth: 'Bluetooth integration',
  wordpress: 'WordPress',
  ui: 'UI/UX design',
  'ci/cd': 'CI/CD and DevOps',
  tdd: 'testing and TDD',
  mentor: 'leadership and mentoring',
  cms: 'CMS development',
};

export function answerLocally(question: string): string {
  const q = question.trim().toLowerCase();

  // Greetings and meta
  if (/^(hi|hey|hello|yo|hiya)\b/.test(q) || q === '') {
    return `Hi! I can tell you about Josh's experience, the projects he's shipped, the tech he works with, and how to get in touch. What would you like to know?`;
  }
  if (has(q, 'who are you', 'what are you', 'are you claude', 'are you real')) {
    return `I'm the portfolio's built-in assistant. Right now I'm answering from Josh's portfolio data on this device rather than calling a live model, so replies are quick, free and focused on Josh.`;
  }

  // Contact
  if (
    has(
      q,
      'contact',
      'email',
      'reach',
      'hire',
      'get in touch',
      'linkedin',
      'github',
      'cv',
      'resume'
    )
  ) {
    return [
      `Here's how to reach Josh:`,
      `- **Email**: ${CONTACT.email}`,
      `- **LinkedIn**: [linkedin.com/in/joshua-hawksworth-9741aa209](${CONTACT.linkedin})`,
      `- **GitHub**: [github.com/joshuahawksworth](${CONTACT.github})`,
      `- **CV**: [Download the PDF](${CONTACT.cv})`,
      ``,
      `He's based in ${CONTACT.location} and open to new roles.`,
    ].join('\n');
  }

  // Location
  if (has(q, 'where', 'based', 'location', 'live', 'remote', 'relocate')) {
    return `Josh is based in **${CONTACT.location}**. Open the Location app on the desktop for a map, or the Contact app to get in touch about remote or hybrid roles.`;
  }

  // Industries
  if (has(q, 'industr', 'sector', 'domain', 'field')) {
    const lines = jobsContent.map(
      (j) => `- **${j.company}**: ${INDUSTRIES[j.id] ?? 'software development'}`
    );
    return [`Josh has worked across a good spread of industries:`, ...lines].join('\n');
  }

  // Summary / overview
  if (
    has(
      q,
      'summar',
      'overview',
      'experience',
      'background',
      'career',
      'history',
      'tell me about josh',
      'about josh'
    )
  ) {
    return [
      `Josh is a **Senior Full Stack Developer** with ${YEARS_EXPERIENCE}+ years building React and React Native applications across several industries. His roles so far:`,
      ...jobsContent.map(jobLine),
      ``,
      `Most recently he led the architecture of an email management ecosystem at CMap Software, and before that he was the sole frontend developer on a social planning app and led the frontend of a loyalty app that onboarded 150,000+ users in its first year.`,
    ].join('\n');
  }

  // Skills / stack
  if (has(q, 'skill', 'stack', 'tech', 'language', 'framework', 'tools', 'what can', 'good at')) {
    return [
      `Josh's core stack:`,
      `- **Frontend**: React, TypeScript, JavaScript, Vue.js, HTML5 and CSS3`,
      `- **Mobile**: React Native (iOS and Android), Expo`,
      `- **Backend**: Node.js, NestJS, PHP and Laravel, SQL, RESTful APIs`,
      `- **Tools**: Git, Azure DevOps, Docker, Figma, CI/CD pipelines, TDD`,
      ``,
      `He's most at home in TypeScript and React on web and mobile, and has led architecture, mentoring and UI/UX work as well as writing code. Ask about any one of these and I'll show where he used it.`,
    ].join('\n');
  }

  // Projects
  if (
    has(
      q,
      'project',
      'built',
      'build',
      'made',
      'shipped',
      'portfolio',
      'work on',
      'worked on',
      'app'
    )
  ) {
    const skill = SKILL_ALIASES.find(([re]) => re.test(q))?.[1];
    const jobs = skill ? jobsWithSkill(skill) : jobsContent;
    if (skill && jobs.length > 0) {
      return [
        `Here's what Josh has built with **${SKILL_LABELS[skill] ?? skill}**:`,
        ...jobs.map(projectLine),
      ].join('\n');
    }
    return [`Josh's main projects:`, ...jobsContent.map(projectLine)].join('\n');
  }

  // A named company
  const company = jobsContent.find((j) => q.includes(j.company.toLowerCase().split(' ')[0]));
  if (company) {
    return [
      `**${company.role}** at ${company.company} (${company.period})`,
      ``,
      company.summary,
      ``,
      `Highlights:`,
      ...company.responsibilities.slice(0, 4).map((r) => `- ${r}`),
      ``,
      projectLine(company),
    ].join('\n');
  }

  // A named skill
  const skill = SKILL_ALIASES.find(([re]) => re.test(q))?.[1];
  if (skill) {
    const jobs = jobsWithSkill(skill);
    if (jobs.length > 0) {
      return [
        `Josh has used **${SKILL_LABELS[skill] ?? skill}** at:`,
        ...jobs.map(
          (j) => `- **${j.company}** (${j.role}, ${j.period}): ${firstSentence(j.summary)}`
        ),
      ].join('\n');
    }
  }

  // Years
  if (has(q, 'how long', 'years', 'how many')) {
    return `Josh has been building software professionally since October 2019, so **${YEARS_EXPERIENCE}+ years**, most of it in React and React Native.`;
  }

  return [
    `I can answer questions about Josh's experience, projects, skills and how to contact him. Try one of these:`,
    `- What has Josh built with React Native?`,
    `- Summarise Josh's experience`,
    `- Which industries has Josh worked in?`,
    `- What did Josh do at CMap Software?`,
    `- How do I contact Josh?`,
  ].join('\n');
}

/**
 * Emit `text` in small chunks with a short delay so the reply reads as if it's being
 * typed. Stops early if the signal is aborted.
 */
export async function streamLocally(
  text: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const words = text.split(/(\s+)/);
  let buffer = '';
  await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));
  for (const word of words) {
    if (signal?.aborted) return;
    buffer += word;
    if (buffer.length >= 6 || word.includes('\n')) {
      onChunk(buffer);
      buffer = '';
      await new Promise((r) => setTimeout(r, 18 + Math.random() * 30));
    }
  }
  if (buffer && !signal?.aborted) onChunk(buffer);
}
