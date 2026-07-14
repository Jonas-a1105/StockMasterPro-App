import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, helperText, className = '', id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const classes = [styles.textarea, error ? styles.textareaError : '', className].filter(Boolean).join(' ');

    return (
      <div className={styles.wrapper}>
        {props.label && (
          <label htmlFor={textareaId} className={styles.label}>
            {props.label}
          </label>
        )}
        <textarea ref={ref} id={textareaId} className={classes} {...props} />
        {error && <span className={styles.error}>{error}</span>}
        {helperText && !error && <span className={styles.helper}>{helperText}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';