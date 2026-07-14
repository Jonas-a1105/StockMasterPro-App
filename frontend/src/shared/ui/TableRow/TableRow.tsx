import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <tr ref={ref} className={className} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';
