import { rlsStorage } from './rls.context';

describe('RLS Tenant Isolation', () => {
  it('should store tenantId in AsyncLocalStorage', () => {
    const testTenantId = 'tenant-a';

    rlsStorage.run({ tenantId: testTenantId }, () => {
      const store = rlsStorage.getStore();
      expect(store).toBeDefined();
      expect(store!.tenantId).toBe('tenant-a');
    });
  });

  it('should not leak tenantId between concurrent contexts', (done) => {
    rlsStorage.run({ tenantId: 'tenant-a' }, () => {
      const storeA = rlsStorage.getStore()!;

      setTimeout(() => {
        expect(rlsStorage.getStore()!.tenantId).toBe('tenant-a');
      }, 10);

      rlsStorage.run({ tenantId: 'tenant-b' }, () => {
        const storeB = rlsStorage.getStore()!;

        expect(storeA.tenantId).toBe('tenant-a');
        expect(storeB.tenantId).toBe('tenant-b');
        done();
      });
    });
  });

  it('should return undefined outside of any RLS context', () => {
    const store = rlsStorage.getStore();
    expect(store).toBeUndefined();
  });

  it('should preserve transaction reference in store', () => {
    const mockTx = { $executeRawUnsafe: jest.fn() };

    rlsStorage.run({ tenantId: 'tenant-1', tx: mockTx }, () => {
      const store = rlsStorage.getStore();
      expect(store!.tx).toBe(mockTx);
      expect(store!.tx.$executeRawUnsafe).toBeDefined();
    });
  });
});
