import { useState } from 'react';
import styles from './JobCard.module.css';
import { Job } from '../../types/experience';

interface JobCardProps {
  job: Job;
}

function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.jobCard}>
      {/* Clickable preview card */}
      <div
        className={`${styles.previewCard} ${isExpanded ? styles.expanded : ''}`}
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleExpand();
          }
        }}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {job.logo && (
              <img src={job.logo} alt={`${job.company} logo`} className={styles.companyLogo} />
            )}
            <div>
              <h3 className={styles.company}>{job.company}</h3>
              <p className={styles.role}>{job.role}</p>
              <p className={styles.period}>{job.period}</p>
            </div>
          </div>
          <div className={styles.expandIcon}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isExpanded ? styles.rotated : ''}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* Skills tags */}
        <div className={styles.skills}>
          {job.skills.map((skill, index) => (
            <span key={index} className={styles.skillTag}>
              {skill}
            </span>
          ))}
        </div>

        {/* Project preview (if exists) */}
        {job.projects.length > 0 && (
          <div className={styles.projectPreview}>
            <span className={styles.projectBadge}>Featured Project</span>
            <span className={styles.projectName}>{job.projects[0].name}</span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      <div className={`${styles.expandedContent} ${isExpanded ? styles.show : ''}`}>
        <div className={styles.details}>
          {/* Summary */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Overview</h4>
            <p className={styles.summary}>{job.summary}</p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Key Responsibilities</h4>
              <ul className={styles.responsibilitiesList}>
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Projects */}
          {job.projects.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Projects</h4>
              {job.projects.map((project, index) => (
                <div key={index} className={styles.project}>
                  <div className={styles.projectContent}>
                    <h5 className={styles.projectTitle}>{project.name}</h5>
                    <p className={styles.projectDescription}>{project.description}</p>
                    {project.externalProjectLink && (
                      <a
                        href={project.externalProjectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.demoLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.linkText || 'View Project'} →
                      </a>
                    )}
                  </div>
                  {project.image && (
                    <div className={styles.projectImage}>
                      <img src={project.image} alt={project.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobCard;
