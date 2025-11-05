import React from 'react';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  return (
    <div className={styles.errorBanner} role="alert">
      <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
      <p className={styles.errorMessage}>{message}</p>
      {onDismiss && (
        <button
          className={styles.errorDismiss}
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};
