import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface TableHeadProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export const TableHead = forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <thead ref={ref} className={`tableHead ${className}`} {...props}>
        {children}
      </thead>
    );
  }
);

TableHead.displayName = 'TableHead';
