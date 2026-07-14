import { forwardRef, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { TableContext } from '../Table/TableContext';

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', ...props }, ref) => {
    const { striped, hoverable } = useContext(TableContext);

    const rowClasses = [
      'tableRow',
      striped ? 'tableRowStriped' : '',
      hoverable ? 'tableRowHover' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <tr ref={ref} className={rowClasses} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';
