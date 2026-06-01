import styles from './SkillsApp.module.css';
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

const STACK = [
  { name: 'HTML5',        icon: htmlIcon,         cat: 'Frontend' },
  { name: 'CSS3',         icon: cssIcon,          cat: 'Frontend' },
  { name: 'JavaScript',   icon: jsIcon,           cat: 'Frontend' },
  { name: 'TypeScript',   icon: tsIcon,           cat: 'Frontend' },
  { name: 'React',        icon: reactIcon,        cat: 'Frontend' },
  { name: 'Vue.js',       icon: vueIcon,          cat: 'Frontend' },
  { name: 'React Native', icon: reactNativeIcon,  cat: 'Mobile'   },
  { name: 'Node.js',      icon: nodeIcon,         cat: 'Backend'  },
  { name: 'PHP',          icon: phpIcon,          cat: 'Backend'  },
  { name: 'Laravel',      icon: laravelIcon,      cat: 'Backend'  },
  { name: 'SQL',          icon: sqlIcon,          cat: 'Backend'  },
  { name: 'Nest.js',      icon: nestIcon,         cat: 'Backend'  },
  { name: 'Git',          icon: gitIcon,          cat: 'Tools'    },
  { name: 'Azure',        icon: azureIcon,        cat: 'Tools'    },
  { name: 'Docker',       icon: dockerIcon,       cat: 'Tools'    },
  { name: 'Figma',        icon: figmaIcon,        cat: 'Tools'    },
];

const CATS = ['Frontend', 'Backend', 'Mobile', 'Tools'] as const;

export default function SkillsApp() {
  return (
    <div className={styles.root}>
      {CATS.map(cat => {
        const items = STACK.filter(s => s.cat === cat);
        return (
          <div key={cat} className={styles.section}>
            <h3 className={styles.catLabel}>{cat}</h3>
            <div className={styles.grid}>
              {items.map(item => (
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
