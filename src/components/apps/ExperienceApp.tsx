import { useState } from 'react';
import { jobsData } from '../../data/experienceData';
import { Job } from '../../types/experience';
import { downloadCv, openCv } from '../../lib/cv';
import styles from './ExperienceApp.module.css';

interface Props {
  props?: Record<string, unknown>;
}

const FIRST_YEAR = 2019;

/** "Nov 2025 – Present" → "Present"; "Mar 2024 - Oct 2025" → "Oct 2025". */
function endOf(period: string): string {
  return period.split(' - ')[1] ?? '';
}

/**
 * Work Experience: every role on one screen for a recruiter or hiring manager. The
 * toolbar keeps the CV one click away wherever they are in the timeline.
 */
export default function ExperienceApp({ props }: Props) {
  const [selectedId, setSelectedId] = useState((props?.jobId as string) ?? jobsData[0].id);
  const selected = jobsData.find((j) => j.id === selectedId) ?? jobsData[0];
  const years = new Date().getFullYear() - FIRST_YEAR;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <span className={styles.toolbarTitle}>Joshua Hawksworth</span>
          <span className={styles.toolbarSub}>
            {years}+ years · React, React Native &amp; TypeScript
          </span>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.secondaryBtn} onClick={openCv}>
            View CV
          </button>
          <button type="button" className={styles.primaryBtn} onClick={downloadCv}>
            <svg
              viewBox="0 0 16 16"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2v8M4.5 7l3.5 3.5L11.5 7" />
              <path d="M2.5 13h11" />
            </svg>
            Download CV
          </button>
        </div>
      </div>

      <div className={styles.split}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>Timeline</p>
          {jobsData.map((job) => (
            <button
              key={job.id}
              className={`${styles.sidebarItem} ${selectedId === job.id ? styles.active : ''}`}
              onClick={() => setSelectedId(job.id)}
            >
              {job.logo ? (
                <img src={job.logo} alt={job.company} className={styles.sidebarLogo} />
              ) : (
                <div className={styles.logoFallback}>{job.company[0]}</div>
              )}
              <div className={styles.sidebarText}>
                <span className={styles.sidebarCompany}>{job.company}</span>
                <span className={styles.sidebarPeriod}>{endOf(job.period)}</span>
              </div>
            </button>
          ))}
        </aside>

        {/* Detail */}
        <main className={styles.detail} key={selected.id}>
          <JobDetail job={selected} />
        </main>
      </div>
    </div>
  );
}

function JobDetail({ job }: { job: Job }) {
  return (
    <div className={styles.jobDetail}>
      {/* Header */}
      <div className={styles.jobHeader}>
        <div className={styles.jobLogoWrap}>
          {job.logo ? (
            <img src={job.logo} alt={job.company} className={styles.jobLogo} />
          ) : (
            <div className={styles.jobLogoFallback}>{job.company[0]}</div>
          )}
        </div>
        <div>
          <h2 className={styles.jobCompany}>{job.company}</h2>
          <p className={styles.jobRole}>{job.role}</p>
          <p className={styles.jobPeriod}>{job.period}</p>
        </div>
      </div>

      {/* Skills */}
      <div className={styles.skillTags}>
        {job.skills.map((s) => (
          <span key={s} className={styles.tag}>
            {s}
          </span>
        ))}
      </div>

      {/* Summary */}
      <p className={styles.summary}>{job.summary}</p>

      {/* Impact */}
      <h3 className={styles.sectionTitle}>What I did</h3>
      <ul className={styles.responsibilities}>
        {job.responsibilities.map((r, i) => (
          <li key={i} className={styles.responsibility}>
            {r}
          </li>
        ))}
      </ul>

      {/* Projects */}
      {job.projects.map((project) => (
        <div key={project.name} className={styles.project}>
          {project.image && (
            <img src={project.image} alt={project.name} className={styles.projectImage} />
          )}
          <div className={styles.projectBody}>
            <h4 className={styles.projectName}>{project.name}</h4>
            <p className={styles.projectDesc}>{project.description}</p>
            {project.externalProjectLink && (
              <a
                href={project.externalProjectLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.projectLink}
              >
                {project.linkText ?? 'View project'} ↗
              </a>
            )}
          </div>
        </div>
      ))}

      <div className={styles.jobFooter}>
        <span>Want the full picture?</span>
        <button type="button" className={styles.linkBtn} onClick={downloadCv}>
          Download the CV (PDF)
        </button>
      </div>
    </div>
  );
}
