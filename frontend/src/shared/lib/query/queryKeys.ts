export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, unknown>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', id] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  warehouses: {
    all: ['warehouses'] as const,
  },
  sales: {
    all: ['sales'] as const,
    list: (params?: Record<string, unknown>) => ['sales', 'list', params] as const,
    detail: (id: string) => ['sales', id] as const,
    dailySummary: ['sales', 'daily-summary'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params?: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
  },
  accountsPayable: {
    all: ['accounts-payable'] as const,
  },
  expenses: {
    all: ['expenses'] as const,
  },
  creditNotes: {
    all: ['credit-notes'] as const,
  },
  reports: {
    netProfit: (params?: Record<string, unknown>) => ['reports', 'net-profit', params] as const,
    monthlyProfit: (year?: number) => ['reports', 'monthly-profit', year] as const,
    bestSellers: (params?: Record<string, unknown>) => ['reports', 'best-sellers', params] as const,
    deadProducts: (params?: Record<string, unknown>) => ['reports', 'dead-products', params] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  exchangeRate: {
    dolar: ['exchange-rate', 'dolar'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
};
