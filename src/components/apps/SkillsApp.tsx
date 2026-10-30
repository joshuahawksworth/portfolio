import { CATS, STACK } from '../../data/skills';
import styles from './SkillsApp.module.css';

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
