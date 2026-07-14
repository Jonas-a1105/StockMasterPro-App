import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  addonRight?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, helperText, addonRight, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${props.name || Math.random().toString(36).slice(2, 9)}`;
    const classes = [
      styles.input,
      error ? styles.inputError : '',
      addonRight ? styles.hasAddon : '',
      leftIcon ? styles.hasLeftIcon : '',
      rightIcon ? styles.hasRightIcon : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrap}>
          {leftIcon && <div className={styles.leftIconWrap}>{leftIcon}</div>}
          <input ref={ref} id={inputId} className={classes} {...props} />
          {rightIcon && <div className={styles.rightIconWrap}>{rightIcon}</div>}
          {addonRight && <span className={styles.addonRight}>{addonRight}</span>}
        </div>
        {error && <span className={styles.error}>{error}</span>}
        {helperText && !error && <span className={styles.helper}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
