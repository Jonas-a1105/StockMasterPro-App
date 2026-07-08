import { AsyncLocalStorage } from 'node:async_hooks';

export interface RLSStore {
  tenantId?: string;
  tx?: any;
}

export const rlsStorage = new AsyncLocalStorage<RLSStore>();
