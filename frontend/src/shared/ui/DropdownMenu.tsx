import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import styles from './DropdownMenu.module.css';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  dividerAfter?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, items, align = 'right', className = '' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`${styles.container} ${className}`}>
      <div ref={triggerRef} className={styles.trigger} onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      
      {open && (
        <div 
          ref={dropdownRef} 
          className={`${styles.dropdown} ${align === 'right' ? styles.alignRight : ''}`}
        >
          <div className={styles.menu}>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                <button
                  className={`${styles.item} ${item.disabled ? styles.disabled : ''} ${item.danger ? styles.danger : ''}`}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                  <span className={styles.itemLabel}>{item.label}</span>
                </button>
                {item.dividerAfter && <div className={styles.divider} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SelectDropdownProps {
  value: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SelectDropdown({ 
  value, 
  placeholder, 
  options, 
  onChange, 
  className = '',
  disabled = false 
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`${styles.selectContainer} ${className}`}>
      <div 
        ref={triggerRef}
        className={`${styles.selectTrigger} ${open ? styles.open : ''}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={styles.selectValue}>
          {value ? options.find(o => o.value === value)?.label : placeholder || 'Seleccionar'}
        </span>
        <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </div>

      {open && !disabled && (
        <div ref={dropdownRef} className={styles.selectDropdown}>
          {placeholder && (
            <button
              className={styles.selectOption}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.selectOption} ${value === opt.value ? styles.selected : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ActionMenuProps {
  items: DropdownItem[];
  children: ReactNode;
}

export function ActionMenu({ items, children }: ActionMenuProps) {
  return (
    <DropdownMenu
      trigger={<div className={styles.actionTrigger}>{children}</div>}
      items={items}
      align="right"
    />
  );
}