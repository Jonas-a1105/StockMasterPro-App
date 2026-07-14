import { forwardRef, type ThHTMLAttributes, type ReactNode } from 'react';

interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ children, align = 'left', className = '', style, ...props }, ref) => {
    const combinedStyle = {
      textAlign: align,
      ...style,
    };

    return (
      <th ref={ref} className={`tableCell ${className}`} style={combinedStyle} {...props}>
        {children}
      </th>
    );
  }
);

TableHeaderCell.displayName = 'TableHeaderCell';
