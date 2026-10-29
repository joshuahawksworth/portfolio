import { useEffect } from 'react';
import { jobsData } from '../../data/experienceData';
import { CV_URL } from '../../lib/cv';
import styles from './PlainPortfolioSite.module.css';

/** The address the browser shows for this page; typed into a real browser it lands on the site itself. */
export const PLAIN_SITE_URL = 'https://hawksworth.dev/classic';

const EMAIL = 'joshuahawksworth@me.com';
const GITHUB = 'https://github.com/joshuahawksworth';
const LINKEDIN = 'https://www.linkedin.com/in/joshua-hawksworth-9741aa209';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600&display=swap';

const SKILLS: [string, string[]][] = [
  [
    'Front End',
    ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next', 'Vue', 'Angular', 'Vite'],
  ],
  ['Mobile', ['React Native', 'Expo', 'Swift', 'iOS & Android', 'App Store releases', 'CI/CD']],
  [
    'Back End & Tools',
    [
      'Node',
      'Nest',
      'PHP',
      'Laravel',
      'SQL',
      'AWS',
      'Azure',
      'Docker',
      'Git',
      'Jest',
      'Playwright',
      'Claude',
    ],
  ],
];

const SECTIONS = ['About', 'Skills', 'Projects', 'Contact'] as const;

function scrollTo(id: string) {
  document.getElementById(`plain-${id}`)?.scrollIntoView({ block: 'start' });
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

/**
 * The portfolio inside the portfolio: a one-page personal site in the style most developers
 * ship (dark theme, one accent colour, hero with a tilted photo, centred section titles), shown
 * in the browser when the desktop opens. Deliberately ordinary next to the desktop around it.
 */
export default function PlainPortfolioSite() {
  // Quicksand is only used by this page, so it is fetched when the page first shows.
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const projects = jobsData.flatMap((job) =>
    job.projects.map((project) => ({
      ...project,
      company: job.company,
      skills: job.skills,
      logo: job.logo,
    }))
  );

  return (
    <div className={styles.site}>
      <div className={styles.page} id="plain-top">
        <div className={styles.glow} aria-hidden="true" />

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

        <aside className={styles.rail} aria-label="Contact links">
          <a href={`mailto:${EMAIL}`} aria-label="Email">
            <MailIcon />
          </a>
          <a href={LINKEDIN} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedInIcon />
          </a>
          <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub">
            <GitHubIcon />
          </a>
          <span className={styles.railLine} />
        </aside>

        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <p className={styles.kicker}>Hello! I am</p>
              <h1>Joshua Hawksworth</h1>
              <p className={styles.role}>
                Senior Full Stack Developer <span className={styles.dot} /> React &amp; React Native
              </p>
              <p className={styles.lead}>
                I'm a Senior Full Stack Developer based in Manchester, UK, with six years of
                building web and mobile applications in React, React Native and TypeScript. I'm
                currently on the Innovation team at Arcus FM, where I took a React Native work-order
                app from prototype to production and helped the team make Claude part of how they
                build software. I care about user experience, clean code and shipping often.
              </p>
              <a className={styles.outline} href={CV_URL} target="_blank" rel="noreferrer">
                Get my resume
              </a>
            </div>
            <div className={styles.photoWrap}>
              <span className={styles.photoBack} aria-hidden="true" />
              <img
                className={styles.photo}
                src="/josh.jpg"
                alt="Joshua Hawksworth"
                width={300}
                height={300}
              />
            </div>
          </section>

          <div className={styles.scrollCue} aria-hidden="true">
            <svg
              viewBox="0 0 24 40"
              width="22"
              height="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="2" y="2" width="20" height="30" rx="10" />
              <line x1="12" y1="8" x2="12" y2="13" strokeLinecap="round" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <section id="plain-about" className={styles.section}>
            <h2 className={styles.title}>About Me</h2>
            <div className={styles.triptych}>
              <div>
                <h3>Past</h3>
                <p>
                  I started in 2019 as a junior web developer and designer at eDynamix, building
                  sites for car dealerships. Agency work at Langley Foxall followed, then a move
                  into mobile: loyalty apps for retail, ordering for hospitality and a social
                  planning app, each one shipped to both app stores.
                </p>
              </div>
              <div>
                <h3>Present</h3>
                <p>
                  I'm a Senior Mobile Developer on the Innovation team at Arcus FM, a UK facilities
                  management company. I took a React Native work-order app from first prototype to
                  production for field engineers, and I coach the wider team on building with Claude
                  through AWS Bedrock.
                </p>
              </div>
              <div className={styles.wide}>
                <h3>Future</h3>
                <p>
                  More products that people use every day, on whichever platform they are on.
                  Outside work I'm learning .NET Blazor through an automotive side project, keeping
                  up with front-end tooling and tinkering with small games.
                </p>
              </div>
            </div>
          </section>

          <section id="plain-skills" className={styles.section}>
            <h2 className={styles.title}>Skills</h2>
            {SKILLS.map(([group, items]) => (
              <div key={group} className={styles.skillGroup}>
                <h3>{group}</h3>
                <ul className={styles.chips}>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section id="plain-projects" className={styles.section}>
            <h2 className={styles.title}>Projects</h2>
            <ul className={styles.projects}>
              {projects.map((project) => (
                <li key={project.name} className={styles.project}>
                  {project.image ? (
                    <span className={styles.shot}>
                      <img src={project.image} alt="" loading="lazy" />
                    </span>
                  ) : (
                    <span className={`${styles.shot} ${styles.shotEmpty}`} aria-hidden="true">
                      {project.logo && <img src={project.logo} alt="" />}
                    </span>
                  )}
                  <div className={styles.projectText}>
                    <h3>{project.name}</h3>
                    <p className={styles.madeWith}>
                      Made with:
                      {project.skills.slice(0, 5).map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </p>
                    <p>{project.description}</p>
                    {project.externalProjectLink && (
                      <a
                        className={styles.outline}
                        href={project.externalProjectLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalIcon /> {project.linkText ?? 'Live'}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="plain-contact" className={styles.section}>
            <h2 className={styles.title}>Want To</h2>
            <div className={styles.triptych}>
              <div>
                <h3>offer a role?</h3>
                <p>
                  I'm open to senior web and mobile roles, in Manchester or remote. If you have a
                  team that ships React or React Native products and wants someone who can own them
                  end to end, let's talk.
                </p>
              </div>
              <div>
                <h3>Connect?</h3>
                <p>
                  I like meeting other developers, designers and founders. If you want to compare
                  notes on mobile, AI-assisted development or just how your project is going, say
                  hello.
                </p>
              </div>
              <div className={styles.wide}>
                <h3>Build something?</h3>
                <p>
                  From a first prototype to the app stores and the backend behind it, I've done the
                  whole journey a few times over. If you have an idea that needs building properly,
                  I'd love to hear about it.
                </p>
              </div>
            </div>
            <div className={styles.footerLinks}>
              <a href={`mailto:${EMAIL}`}>Email</a>
              <a href={GITHUB} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={CV_URL} target="_blank" rel="noreferrer">
                Resume
              </a>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.toTop}
            onClick={() => scrollTo('top')}
            aria-label="Back to top"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <p>© 2019-present Joshua Hawksworth. All Rights Reserved</p>
        </footer>
      </div>
    </div>
  );
}
