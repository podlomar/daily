import { Layout } from '../../components/Layout/Layout';
import portrait from '../../assets/portrait.jpg';
import styles from './PortraitPage.module.css';

const CORE_VALUES = [
  'Placeholder value one',
  'Placeholder value two',
  'Placeholder value three',
  'Placeholder value four',
  'Placeholder value five',
];

export const PortraitPage = () => (
  <Layout>
    <div className={styles.frame}>
      <img src={portrait} alt="Portrait" className={styles.portrait} />
      <div className={styles.overlay}>
        <ul className={styles.values}>
          {CORE_VALUES.map((v) => (
            <li key={v} className={styles.value}>{v}</li>
          ))}
        </ul>
      </div>
    </div>
  </Layout>
);
