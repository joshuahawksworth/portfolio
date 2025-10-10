import styles from './About.module.css';
import htmlIcon from '../../assets/tech-icons/html.png';
import cssIcon from '../../assets/tech-icons/css.svg';
import jsIcon from '../../assets/tech-icons/javascript.png';
import tsIcon from '../../assets/tech-icons/typescript.png';
import reactIcon from '../../assets/tech-icons/react.png';
import vueIcon from '../../assets/tech-icons/vue.png';
import nodeIcon from '../../assets/tech-icons/node.png';
import phpIcon from '../../assets/tech-icons/php.png';
import laravelIcon from '../../assets/tech-icons/laravel.png';
import reactNativeIcon from '../../assets/tech-icons/react-native.svg';
import sqlIcon from '../../assets/tech-icons/sql.svg';
import gitIcon from '../../assets/tech-icons/git.svg';
import azureIcon from '../../assets/tech-icons/azure.png';
import dockerIcon from '../../assets/tech-icons/docker.svg';
import figmaIcon from '../../assets/tech-icons/figma.svg';

interface TechItem {
  name: string;
  icon: string;
  category: 'frontend' | 'backend' | 'mobile' | 'tools';
}

function About() {
  const techStack: TechItem[] = [
    { name: 'HTML5', icon: htmlIcon, category: 'frontend' },
    { name: 'CSS3', icon: cssIcon, category: 'frontend' },
    { name: 'JavaScript', icon: jsIcon, category: 'frontend' },
    { name: 'TypeScript', icon: tsIcon, category: 'frontend' },
    { name: 'React', icon: reactIcon, category: 'frontend' },
    { name: 'React Native', icon: reactNativeIcon, category: 'frontend' },
    { name: 'Vue.js', icon: vueIcon, category: 'frontend' },
    { name: 'Node.js', icon: nodeIcon, category: 'backend' },
    { name: 'PHP', icon: phpIcon, category: 'backend' },
    { name: 'Laravel', icon: laravelIcon, category: 'backend' },
    { name: 'SQL', icon: sqlIcon, category: 'backend' },
    { name: 'Git', icon: gitIcon, category: 'tools' },
    { name: 'Azure', icon: azureIcon, category: 'tools' },
    { name: 'Docker', icon: dockerIcon, category: 'tools' },
    { name: 'Figma', icon: figmaIcon, category: 'tools' },
  ];

  return (
    <section id="about" className={styles.aboutSection}>
      <div className={styles.container}>
        <h2 className={styles.title}>About Me</h2>

        <div className={styles.content}>
          <p className={styles.description}>
            Full Stack Senior Developer with over 5 years of experience building scalable web and
            mobile applications across diverse industries. I specialize in architecting modern
            solutions using React, TypeScript, and Node.js, with a strong focus on user experience
            and clean code. From leading monorepo projects to mentoring junior developers, I thrive
            in collaborative environments where I can solve complex problems and deliver products
            that make a real impact.
          </p>

          <div className={styles.techSection}>
            <h3 className={styles.techTitle}>Technologies & Tools</h3>
            <div className={styles.techGrid}>
              {techStack.map((tech) => (
                <div key={tech.name} className={styles.techItem}>
                  <img src={tech.icon} alt={tech.name} className={styles.techIcon} />
                  <span className={styles.techName}>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
