import { useState, useEffect } from 'react';
import { jobsData } from '../../data/experienceData';
import { Job } from '../../types/experience';
import styles from './ExperienceApp.module.css';

interface Props { props?: Record<string, unknown> }

export default function ExperienceApp({ props }: Props) {
  const initialId = (props?.jobId as string) ?? jobsData[0].id;
  const [selectedId, setSelectedId] = useState(initialId);

  useEffect(() => {
    if (props?.jobId) setSelectedId(props.jobId as string);
  }, [props?.jobId]);

  const selected = jobsData.find(j => j.id === selectedId) ?? jobsData[0];

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <p className={styles.sidebarLabel}>Companies</p>
        {jobsData.map(job => (
          <button
            key={job.id}
            className={`${styles.sidebarItem} ${selectedId === job.id ? styles.active : ''}`}
            onClick={() => setSelectedId(job.id)}
          >
            {job.logo
              ? <img src={job.logo} alt={job.company} className={styles.sidebarLogo} />
              : <div className={styles.logoFallback}>{job.company[0]}</div>
            }
            <div className={styles.sidebarText}>
              <span className={styles.sidebarCompany}>{job.company}</span>
              <span className={styles.sidebarPeriod}>{job.period.split(' - ')[1] ?? ''}</span>
            </div>
          </button>
        ))}
      </aside>

      {/* Detail */}
      <main className={styles.detail} key={selected.id}>
        <JobDetail job={selected} />
      </main>
    </div>
  );
}

function JobDetail({ job }: { job: Job }) {
  return (
    <div className={styles.jobDetail}>
      {/* Header */}
      <div className={styles.jobHeader}>
        <div className={styles.jobLogoWrap}>
          {job.logo
            ? <img src={job.logo} alt={job.company} className={styles.jobLogo} />
            : <div className={styles.jobLogoFallback}>{job.company[0]}</div>
          }
        </div>
        <div>
          <h2 className={styles.jobCompany}>{job.company}</h2>
          <p className={styles.jobRole}>{job.role}</p>
          <p className={styles.jobPeriod}>{job.period}</p>
        </div>
      </div>

      {/* Skills */}
      <div className={styles.skillTags}>
        {job.skills.map(s => <span key={s} className={styles.tag}>{s}</span>)}
      </div>

      {/* Summary */}
      <p className={styles.summary}>{job.summary}</p>

      {/* Responsibilities */}
      <h3 className={styles.sectionTitle}>Responsibilities</h3>
      <ul className={styles.responsibilities}>
        {job.responsibilities.map((r, i) => (
          <li key={i} className={styles.responsibility}>{r}</li>
        ))}
      </ul>

      {/* Projects */}
      {job.projects.map(project => (
        <div key={project.name} className={styles.project}>
          <h3 className={styles.sectionTitle}>Project · {project.name}</h3>
          {project.image && (
            <img src={project.image} alt={project.name} className={styles.projectImage} />
          )}
          <p className={styles.projectDesc}>{project.description}</p>
          {project.externalProjectLink && (
            <a href={project.externalProjectLink} target="_blank" rel="noreferrer" className={styles.projectLink}>
              {project.linkText ?? 'View Project'}
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10 L10 2 M5 2 H10 V7"/></svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
