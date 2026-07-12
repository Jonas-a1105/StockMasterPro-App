import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, label, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${props.name || Math.random().toString(36).slice(2, 9)}`;
    const classes = [styles.select, error ? styles.selectError : '', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <select ref={ref} id={selectId} className={classes} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
