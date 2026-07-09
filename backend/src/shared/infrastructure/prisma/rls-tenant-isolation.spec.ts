import { ProcessSaleUseCase } from '@modules/sales/application/use-cases/process-sale.use-case';
import type { SaleRepository } from '@modules/sales/application/ports/sale.repository.interface';
import type { ProductRepository } from '@modules/inventory';
import type { AccountsReceivableRepository } from '@modules/accounts-receivable';
import type { CashRegisterRepository } from '@modules/cash-register';

describe('Tenant Isolation — IDOR Prevention', () => {
  let useCase: ProcessSaleUseCase;
  let saleRepo: jest.Mocked<SaleRepository>;
  let productRepo: jest.Mocked<ProductRepository>;
  let receivableRepo: jest.Mocked<AccountsReceivableRepository>;
  let cashRepo: jest.Mocked<CashRegisterRepository>;

  const tenantAProduct = {
    id: 'prod-a',
    tenantId: 'tenant-a',
    name: 'Product A',
    barcode: '111',
    price: 100,
    cost: 60,
    stock: 50,
    minStock: 5,
    categoryId: null,
    description: null,
    isActive: true,
    imageUrl: null,
    brand: null,
    profitMargin: 40,
    isLowStock: () => false,
    updateStock: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tenantBProduct = {
    id: 'prod-b',
    tenantId: 'tenant-b',
    name: 'Product B',
    barcode: '222',
    price: 200,
    cost: 100,
    stock: 30,
    minStock: 5,
    categoryId: null,
    description: null,
    isActive: true,
    imageUrl: null,
    brand: null,
    profitMargin: 50,
    isLowStock: () => false,
    updateStock: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    saleRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      getDailySummary: jest.fn(),
      count: jest.fn(),
    };

    productRepo = {
      findByIds: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByBarcode: jest.fn(),
      adjustStock: jest.fn(),
      findLowStock: jest.fn(),
      getMovements: jest.fn(),
      findAdjustments: jest.fn(),
      count: jest.fn(),
      addMovement: jest.fn(),
      findAllAdjustments: jest.fn(),
    } as unknown as jest.Mocked<ProductRepository>;

    receivableRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCustomer: jest.fn(),
      findPayments: jest.fn(),
    } as unknown as jest.Mocked<AccountsReceivableRepository>;

    cashRepo = {
      findOpenSession: jest.fn(),
      addTransaction: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByUser: jest.fn(),
      getTransactions: jest.fn(),
    } as unknown as jest.Mocked<CashRegisterRepository>;

    useCase = new ProcessSaleUseCase(
      saleRepo,
      productRepo,
      receivableRepo,
      cashRepo,
    );
  });

  it('should query products scoped to the correct tenant', async () => {
    productRepo.findByIds.mockResolvedValue([tenantAProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    await useCase.execute({
      tenantId: 'tenant-a',
      userId: 'user-1',
      items: [{ productId: 'prod-a', quantity: 1 }],
      paymentMethod: 'cash',
    });

    expect(productRepo.findByIds).toHaveBeenCalledWith(['prod-a'], 'tenant-a');
  });

  it('should not allow tenant A to sell tenant B product (product not found)', async () => {
    productRepo.findByIds.mockImplementation(
      async (ids: string[], tenantId: string) =>
        ids.includes('prod-b')
          ? tenantId === 'tenant-b'
            ? [tenantBProduct]
            : []
          : [tenantAProduct],
    );

    await expect(
      useCase.execute({
        tenantId: 'tenant-a',
        userId: 'user-1',
        items: [{ productId: 'prod-b', quantity: 1 }],
        paymentMethod: 'cash',
      }),
    ).rejects.toThrow(/Producto/);
  });

  it('should pass tenantId to all repository calls consistently', async () => {
    productRepo.findByIds.mockResolvedValue([tenantAProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    await useCase.execute({
      tenantId: 'tenant-a',
      userId: 'user-1',
      items: [{ productId: 'prod-a', quantity: 1 }],
      paymentMethod: 'cash',
    });

    expect(cashRepo.findOpenSession).toHaveBeenCalledWith('user-1', 'tenant-a');
  });

  it('should create receivable scoped to the sale tenant', async () => {
    productRepo.findByIds.mockResolvedValue([tenantAProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);

    await useCase.execute({
      tenantId: 'tenant-a',
      userId: 'user-1',
      customerId: 'cust-1',
      items: [{ productId: 'prod-a', quantity: 1 }],
      paymentMethod: 'credit',
    });

    expect(receivableRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-a' }),
    );
  });
});
