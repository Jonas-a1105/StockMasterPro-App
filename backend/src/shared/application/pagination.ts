export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export function paginate(page = 1, limit = 50): { take: number; skip: number } {
  const safeLimit = Math.min(Math.max(1, limit), 500);
  const safePage = Math.max(1, page);
  return { take: safeLimit, skip: (safePage - 1) * safeLimit };
}
