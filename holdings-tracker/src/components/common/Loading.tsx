import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'medium', text }) => {
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[`spinner-${size}`]}`} role="status" aria-label="Loading">
        <span className={styles.srOnly}>Loading...</span>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ width?: string; height?: string }> = ({ width = '100%', height = '20px' }) => {
  return <div className={styles.skeleton} style={{ width, height }} />;
};
