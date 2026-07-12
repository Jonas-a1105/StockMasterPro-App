import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${props.name || Math.random().toString(36).slice(2, 9)}`;
    const classes = [styles.input, error ? styles.inputError : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input ref={ref} id={inputId} className={classes} {...props} />
        {error && <span className={styles.error}>{error}</span>}
        {helperText && !error && <span className={styles.helper}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
