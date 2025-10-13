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
import nestIcon from '../../assets/tech-icons/nestjs.svg';

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
    { name: 'Nest.js', icon: nestIcon, category: 'backend' },
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
            Senior Full Stack Developer with 6 years building React and React Native applications
            across multiple industries. I specialize in creating web and mobile applications using
            TypeScript and React.js, with a focus on user experience and clean code. Recently led
            development of an email management platform for architects, building a monorepo that
            connects Outlook with SharePoint by allowing users to file emails to SharePoint Projects
            using the Microsoft Graph API. Previously created a mobile loyalty app that gained 150K
            users in its first year. Working in a collaborative environment and mentoring developers
            is where I feel I do my best work.
          </p>

          <p className={styles.description}>
            Outside of work, I'm currently learning about .NET Blazor and MongoDB through an
            automotive side project with my dad! Other things I enjoy in my free time include
            keeping up with the latest frontend technologies via YouTube and Twitch, working on
            small video game side projects and participating in game jams, staying sharp with daily
            code katas, and hitting the gym for weight training. My office is supervised by Jiji, my
            cat and code reviewer, who specializes in keyboard QA testing (usually at the worst
            possible moments 🐈‍⬛).
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
