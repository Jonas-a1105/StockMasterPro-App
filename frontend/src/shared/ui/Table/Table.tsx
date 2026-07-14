import { forwardRef, type TableHTMLAttributes, type ReactNode } from 'react';
import { TableContext } from './TableContext';
import styles from './Table.module.css';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, striped = false, hoverable = true, className = '', ...props }, ref) => {
    return (
      <TableContext.Provider value={{ striped, hoverable }}>
        <div className={`${styles.tableOuter} bgSurface border roundedLg shadowCard overflowXAuto`}>
          <table ref={ref} className={`table ${className}`} {...props}>
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );
  }
);

Table.displayName = 'Table';
