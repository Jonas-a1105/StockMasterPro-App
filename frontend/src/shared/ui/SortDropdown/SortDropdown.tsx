import { useState, useRef, useEffect, type ReactNode, type HTMLAttributes } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './SortDropdown.module.css';

export interface SortOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SortDropdownProps extends HTMLAttributes<HTMLDivElement> {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SortDropdown({ options, value, onChange, placeholder = 'Ordenar', className = '', ...props }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  return (
    <div ref={dropdownRef} className={`${styles.dropdown} ${className}`} {...props}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.label}>{displayLabel}</span>
        {isOpen ? <ChevronUp size={14} className={styles.chevron} /> : <ChevronDown size={14} className={styles.chevron} />}
      </button>

      {isOpen && (
        <div className={styles.menu} role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.option} ${value === option.value ? styles.optionActive : ''}`}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              role="option"
              aria-selected={value === option.value}
            >
              {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
              <span className={styles.optionLabel}>{option.label}</span>
              {value === option.value && <ChevronDown size={12} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}