import { forwardRef, type TableHTMLAttributes, type ReactNode } from 'react';
import styles from './Table.module.css';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, striped = false, hoverable = true, className = '', ...props }, ref) => {
    const tableClasses = [
      styles.table,
      striped ? styles.striped : '',
      hoverable ? styles.hoverable : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={styles.tableOuter}>
        <table ref={ref} className={tableClasses} {...props}>
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';
