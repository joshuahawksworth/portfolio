import styles from './SkillsApp.module.css';
import htmlIcon from '../../assets/tech-icons/html.png';
import cssIcon from '../../assets/tech-icons/css.svg';
import jsIcon from '../../assets/tech-icons/javascript.png';
import tsIcon from '../../assets/tech-icons/typescript.png';
import reactIcon from '../../assets/tech-icons/react.png';
import vueIcon from '../../assets/tech-icons/vue.png';
import angularIcon from '../../assets/tech-icons/angular.svg';
import nextIcon from '../../assets/tech-icons/nextjs.svg';
import bootstrapIcon from '../../assets/tech-icons/bootstrap.svg';
import jqueryIcon from '../../assets/tech-icons/jquery.svg';
import viteIcon from '../../assets/tech-icons/vite.svg';
import nodeIcon from '../../assets/tech-icons/node.png';
import phpIcon from '../../assets/tech-icons/php.png';
import laravelIcon from '../../assets/tech-icons/laravel.png';
import reactNativeIcon from '../../assets/tech-icons/react-native.svg';
import expoIcon from '../../assets/tech-icons/expo.svg';
import swiftIcon from '../../assets/tech-icons/swift.svg';
import sqlIcon from '../../assets/tech-icons/sql.svg';
import gitIcon from '../../assets/tech-icons/git.svg';
import githubIcon from '../../assets/tech-icons/github.svg';
import azureIcon from '../../assets/tech-icons/azure.png';
import azureDevopsIcon from '../../assets/tech-icons/azure-devops.svg';
import awsIcon from '../../assets/tech-icons/aws.svg';
import dockerIcon from '../../assets/tech-icons/docker.svg';
import figmaIcon from '../../assets/tech-icons/figma.svg';
import nestIcon from '../../assets/tech-icons/nestjs.svg';
import jestIcon from '../../assets/tech-icons/jest.svg';
import vitestIcon from '../../assets/tech-icons/vitest.svg';
import phpunitIcon from '../../assets/tech-icons/phpunit.svg';
import postmanIcon from '../../assets/tech-icons/postman.svg';
import jiraIcon from '../../assets/tech-icons/jira.svg';
import microsoft365Icon from '../../assets/tech-icons/microsoft-365.svg';
import photoshopIcon from '../../assets/tech-icons/photoshop.svg';
import illustratorIcon from '../../assets/tech-icons/illustrator.svg';
import adobeXdIcon from '../../assets/tech-icons/adobe-xd.svg';
import claudeIcon from '../../assets/tech-icons/claude.svg';
import codexIcon from '../../assets/tech-icons/codex.svg';

const STACK = [
  { name: 'HTML5', icon: htmlIcon, cat: 'Frontend' },
  { name: 'CSS3', icon: cssIcon, cat: 'Frontend' },
  { name: 'JavaScript', icon: jsIcon, cat: 'Frontend' },
  { name: 'TypeScript', icon: tsIcon, cat: 'Frontend' },
  { name: 'React', icon: reactIcon, cat: 'Frontend' },
  { name: 'Next.js', icon: nextIcon, cat: 'Frontend' },
  { name: 'Vue.js', icon: vueIcon, cat: 'Frontend' },
  { name: 'Angular', icon: angularIcon, cat: 'Frontend' },
  { name: 'Bootstrap', icon: bootstrapIcon, cat: 'Frontend' },
  { name: 'jQuery', icon: jqueryIcon, cat: 'Frontend' },
  { name: 'Vite', icon: viteIcon, cat: 'Frontend' },
  { name: 'React Native', icon: reactNativeIcon, cat: 'Mobile' },
  { name: 'Expo', icon: expoIcon, cat: 'Mobile' },
  { name: 'Swift', icon: swiftIcon, cat: 'Mobile' },
  { name: 'Node.js', icon: nodeIcon, cat: 'Backend' },
  { name: 'Nest.js', icon: nestIcon, cat: 'Backend' },
  { name: 'PHP', icon: phpIcon, cat: 'Backend' },
  { name: 'Laravel', icon: laravelIcon, cat: 'Backend' },
  { name: 'SQL', icon: sqlIcon, cat: 'Backend' },
  { name: 'Jest', icon: jestIcon, cat: 'Testing' },
  { name: 'Vitest', icon: vitestIcon, cat: 'Testing' },
  { name: 'PHPUnit', icon: phpunitIcon, cat: 'Testing' },
  { name: 'Claude', icon: claudeIcon, cat: 'AI' },
  { name: 'Codex', icon: codexIcon, cat: 'AI' },
  { name: 'AWS', icon: awsIcon, cat: 'Cloud' },
  { name: 'Azure', icon: azureIcon, cat: 'Cloud' },
  { name: 'Azure DevOps', icon: azureDevopsIcon, cat: 'Cloud' },
  { name: 'Docker', icon: dockerIcon, cat: 'Cloud' },
  { name: 'Git', icon: gitIcon, cat: 'Tools' },
  { name: 'GitHub', icon: githubIcon, cat: 'Tools' },
  { name: 'Postman', icon: postmanIcon, cat: 'Tools' },
  { name: 'Jira', icon: jiraIcon, cat: 'Tools' },
  { name: 'Microsoft 365', icon: microsoft365Icon, cat: 'Tools' },
  { name: 'Figma', icon: figmaIcon, cat: 'Design' },
  { name: 'Photoshop', icon: photoshopIcon, cat: 'Design' },
  { name: 'Illustrator', icon: illustratorIcon, cat: 'Design' },
  { name: 'Adobe XD', icon: adobeXdIcon, cat: 'Design' },
];

const CATS = [
  'Frontend',
  'Mobile',
  'Backend',
  'Testing',
  'AI',
  'Cloud',
  'Tools',
  'Design',
] as const;

export default function SkillsApp() {
  return (
    <div className={styles.root}>
      {CATS.map((cat) => {
        const items = STACK.filter((s) => s.cat === cat);
        return (
          <div key={cat} className={styles.section}>
            <h3 className={styles.catLabel}>{cat}</h3>
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item.name} className={styles.card}>
                  <img src={item.icon} alt={item.name} className={styles.icon} />
                  <span className={styles.name}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
