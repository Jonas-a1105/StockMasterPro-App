import { createContext } from 'react';

export const TableContext = createContext<{ striped?: boolean; hoverable?: boolean }>({
  striped: false,
  hoverable: true
});
