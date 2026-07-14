import { forwardRef, type TdHTMLAttributes, type ReactNode } from 'react';

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  align?: 'left' | 'center' | 'right';
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, align = 'left', className = '', style, ...props }, ref) => {
    const combinedStyle = {
      textAlign: align,
      ...style,
    };

    return (
      <td ref={ref} className={className} style={combinedStyle} {...props}>
        {children}
      </td>
    );
  }
);

TableCell.displayName = 'TableCell';
