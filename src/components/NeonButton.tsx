import React from 'react';
import styles from './NeonButton.module.css';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
}

/**
 * Large, accessible neon-style button for children
 * High contrast, big touch targets, retro glow effect
 */
function NeonButton({
  children,
  onClick,
  variant = 'primary',
  size = 'large',
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}: NeonButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.neonBtn} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
    >
      <span className={styles.text}>{children}</span>
    </button>
  );
}

export default NeonButton;
