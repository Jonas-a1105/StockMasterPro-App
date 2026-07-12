import { type ReactNode, type HTMLAttributes } from 'react';
import styles from './Table.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No hay datos',
  striped = false,
  hoverable = true,
  className = '',
  onRowClick,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <table className={`${styles.table} ${striped ? styles.striped : ''} ${hoverable ? styles.hoverable : ''}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
                className={col.className}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                  className={col.className}
                >
                  {col.render ? col.render(row, rowIndex) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function TableContainer({ children, className = '', ...props }: TableContainerProps) {
  return <div className={`${styles.container} ${className}`} {...props}>{children}</div>;
}