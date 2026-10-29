import { jobsData } from '../../data/experienceData';
import { CV_URL } from '../../lib/cv';
import styles from './PlainPortfolioSite.module.css';

/** The address the browser shows for this page; typed into a real browser it lands on the site itself. */
export const PLAIN_SITE_URL = 'https://hawksworth.dev/classic';

const EMAIL = 'joshuahawksworth@me.com';
const GITHUB = 'https://github.com/joshuahawksworth';
const LINKEDIN = 'https://www.linkedin.com/in/joshua-hawksworth-9741aa209';

const SKILLS: [string, string[]][] = [
  ['Front end', ['React', 'TypeScript', 'Next.js', 'Vue.js', 'Angular', 'HTML5 and CSS3', 'Vite']],
  ['Mobile', ['React Native', 'Expo', 'Swift', 'App Store and Play Store releases', 'CI/CD']],
  [
    'Back end and tools',
    [
      'Node.js',
      'Nest.js',
      'PHP and Laravel',
      'SQL',
      'AWS',
      'Azure',
      'Docker',
      'Git',
      'Jest',
      'Claude',
    ],
  ],
];

const SECTIONS = ['About', 'Skills', 'Projects', 'Contact'] as const;

function scrollTo(id: string) {
  document.getElementById(`plain-${id}`)?.scrollIntoView({ block: 'start' });
}

/**
 * The portfolio inside the portfolio: a plain, one-page personal site of the kind most
 * developers have, shown in the browser when the desktop opens. It is deliberately ordinary.
 */
export default function PlainPortfolioSite() {
  const projects = jobsData.flatMap((job) =>
    job.projects.map((project) => ({ ...project, company: job.company, skills: job.skills }))
  );

  return (
    <div className={styles.site}>
      <header className={styles.nav}>
        <span className={styles.brand}>Joshua Hawksworth</span>
        <nav aria-label="Sections">
          {SECTIONS.map((label) => (
            <button key={label} type="button" onClick={() => scrollTo(label.toLowerCase())}>
              {label}
            </button>
          ))}
          <a href={CV_URL} target="_blank" rel="noreferrer">
            Resume
          </a>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Hi, I'm</p>
            <h1>Joshua Hawksworth</h1>
            <p className={styles.role}>Senior Full Stack Developer</p>
            <p className={styles.lead}>
              I build web and mobile applications with React, React Native and TypeScript. Based in
              Manchester, UK, currently on the Innovation team at Arcus FM.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.cta} href={CV_URL} target="_blank" rel="noreferrer">
                Get my CV
              </a>
              <a href={`mailto:${EMAIL}`}>Email</a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={GITHUB} target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </div>
          <img
            className={styles.photo}
            src="/josh.jpg"
            alt="Joshua Hawksworth"
            width={220}
            height={220}
          />
        </section>

        <section id="plain-about" className={styles.section}>
          <h2>About me</h2>
          <dl className={styles.timeline}>
            <dt>Past</dt>
            <dd>
              Started in 2019 as a junior web developer and designer at eDynamix, building sites for
              car dealerships, then moved into agency work at Langley Foxall and from there into
              mobile apps for retail, hospitality and social products.
            </dd>
            <dt>Present</dt>
            <dd>
              Senior Mobile Developer on the Innovation team at Arcus FM, where I took a React
              Native work-order app from prototype to production and helped the team make Claude
              part of how they build software.
            </dd>
            <dt>Future</dt>
            <dd>
              More products people use every day. Outside work I'm learning .NET Blazor through an
              automotive side project and keeping up with video game development.
            </dd>
          </dl>
        </section>

        <section id="plain-skills" className={styles.section}>
          <h2>Skills</h2>
          <dl className={styles.skills}>
            {SKILLS.map(([group, items]) => (
              <div key={group}>
                <dt>{group}</dt>
                <dd>{items.join(', ')}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="plain-projects" className={styles.section}>
          <h2>Projects</h2>
          <ul className={styles.projects}>
            {projects.map((project) => (
              <li key={project.name} className={styles.project}>
                {project.image && (
                  <img src={project.image} alt="" width={160} height={100} loading="lazy" />
                )}
                <div>
                  <h3>{project.name}</h3>
                  <p className={styles.meta}>
                    {project.company} · Made with {project.skills.slice(0, 4).join(', ')}
                  </p>
                  <p>{project.description}</p>
                  {project.externalProjectLink && (
                    <a href={project.externalProjectLink} target="_blank" rel="noreferrer">
                      {project.linkText ?? 'View'}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="plain-contact" className={styles.section}>
          <h2>Get in touch</h2>
          <p>
            Want to offer a role, work together on something, or just say hello? Email me at{' '}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or find me on{' '}
            <a href={LINKEDIN} target="_blank" rel="noreferrer">
              LinkedIn
            </a>{' '}
            and{' '}
            <a href={GITHUB} target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        © 2019 to {new Date().getFullYear()} Joshua Hawksworth
      </footer>
    </div>
  );
}
