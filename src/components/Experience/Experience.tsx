import { jobsData } from '../../data/experienceData';
import styles from './Experience.module.css';
import JobCard from '../JobCard/JobCard';

function Experience() {
  return (
    <section id="experience" className={styles.experienceSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Experience</h2>
        <div className={styles.jobsList}>
          {jobsData.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experience;