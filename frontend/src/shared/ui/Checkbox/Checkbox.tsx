import { forwardRef, type InputHTMLAttributes } from 'react';
import { Text } from '../Text';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;
    return (
      <label className={`${styles.checkboxLabel} ${className || ''}`}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={styles.checkbox}
          {...props}
        />
        <span className={styles.checkboxCustom}>
          {props.checked && (
            <svg className={styles.checkboxIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <Text variant="caption" color="muted" className={styles.checkboxText}>
          {label}
        </Text>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';