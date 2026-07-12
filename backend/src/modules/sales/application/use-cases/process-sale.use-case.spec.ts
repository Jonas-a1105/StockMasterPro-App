import { ProcessSaleUseCase } from './process-sale.use-case';
import type { SaleRepository } from '../ports/sale.repository.interface';
import type { ProductRepository } from '@modules/inventory';
import type { AccountsReceivableRepository } from '@modules/accounts-receivable';
import type { CashRegisterRepository } from '@modules/cash-register';
import { InvoiceSequenceService } from '@modules/fiscal/application/invoice-sequence.service';
import type { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Sale, SaleItem } from '../../domain';
import {
  ProductNotFoundException,
  InsufficientStockException,
  InvalidSaleOperationException,
} from '../../domain/sales.errors';

describe('ProcessSaleUseCase', () => {
  let useCase: ProcessSaleUseCase;
  let saleRepo: jest.Mocked<SaleRepository>;
  let productRepo: jest.Mocked<ProductRepository>;
  let receivableRepo: jest.Mocked<AccountsReceivableRepository>;
  let cashRepo: jest.Mocked<CashRegisterRepository>;
  let invoiceSeqService: jest.Mocked<InvoiceSequenceService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockProduct = {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Test Product',
    barcode: '123456',
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

  const baseInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    items: [{ productId: 'prod-1', quantity: 2 }],
    paymentMethod: 'cash' as const,
  };

  beforeEach(() => {
    saleRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      getDailySummary: jest.fn(),
    } as unknown as jest.Mocked<SaleRepository>;

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

    invoiceSeqService = {
      getNextInvoiceNumber: jest.fn().mockResolvedValue({
        invoiceNumber: 'FACT-000001',
        sequenceNumber: 1,
        series: 'FACT',
      }),
      getOrCreateSequence: jest.fn(),
      resetSequence: jest.fn(),
    } as unknown as jest.Mocked<InvoiceSequenceService>;

    prisma = {
      sale: { update: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    useCase = new ProcessSaleUseCase(
      saleRepo,
      productRepo,
      receivableRepo,
      cashRepo,
      invoiceSeqService,
      prisma,
    );
  });

  it('should process a cash sale successfully', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    const result = await useCase.execute(baseInput);

    expect(result).toBeInstanceOf(Sale);
    expect(result.subtotal).toBe(200);
    expect(result.total).toBe(200);
    expect(result.paymentMethod).toBe('cash');
    expect(result.items).toHaveLength(1);
    expect(productRepo.findByIds).toHaveBeenCalledWith(['prod-1'], 'tenant-1');
    expect(saleRepo.create).toHaveBeenCalled();
    expect(cashRepo.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200, type: 'sale' }),
    );
    expect(receivableRepo.create).not.toHaveBeenCalled();
  });

  it('should process a credit sale and create receivable', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);

    await useCase.execute({
      ...baseInput,
      paymentMethod: 'credit',
      customerId: 'cust-1',
    });

    expect(receivableRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        customerId: 'cust-1',
        totalAmount: 200,
      }),
    );
    expect(cashRepo.addTransaction).not.toHaveBeenCalled();
  });

  it('should throw if credit sale has no customer', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);

    await expect(
      useCase.execute({ ...baseInput, paymentMethod: 'credit' }),
    ).rejects.toThrow(InvalidSaleOperationException);
  });

  it('should throw if product not found', async () => {
    productRepo.findByIds.mockResolvedValue([]);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      ProductNotFoundException,
    );
  });

  it('should throw if insufficient stock', async () => {
    productRepo.findByIds.mockResolvedValue([{ ...mockProduct, stock: 1 }]);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      InsufficientStockException,
    );
  });

  it('should apply discount and tax correctly', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    const result = await useCase.execute({
      ...baseInput,
      discount: 10,
      taxRate: 16,
    });

    // subtotal: 200, discount: 20, taxable: 180, tax: 28.8, total: 208.8
    expect(result.subtotal).toBe(200);
    expect(result.discount).toBe(20);
    expect(result.tax).toBe(28.8);
    expect(result.total).toBe(208.8);
  });

  it('should skip cash transaction if no open session', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue(null);

    await useCase.execute(baseInput);

    expect(cashRepo.addTransaction).not.toHaveBeenCalled();
  });

  it('should propagate error if sale creation fails (rollback at repo level)', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockRejectedValue(new Error('DB error'));
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    await expect(useCase.execute(baseInput)).rejects.toThrow('DB error');
    expect(cashRepo.addTransaction).not.toHaveBeenCalled();
    expect(receivableRepo.create).not.toHaveBeenCalled();
  });

  it('should propagate error if cash transaction fails after sale creation', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);
    cashRepo.addTransaction.mockRejectedValue(new Error('Cash error'));

    await expect(useCase.execute(baseInput)).rejects.toThrow('Cash error');
  });

  it('should propagate error if receivable creation fails after sale creation', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    saleRepo.create.mockImplementation(async (sale) => sale);
    receivableRepo.create.mockRejectedValue(new Error('Receivable error'));

    await expect(
      useCase.execute({
        ...baseInput,
        paymentMethod: 'credit',
        customerId: 'cust-1',
      }),
    ).rejects.toThrow('Receivable error');
  });

  it('should pass offlineId to repository for idempotency', async () => {
    productRepo.findByIds.mockResolvedValue([mockProduct]);
    const createMock = jest
      .fn()
      .mockImplementation(async (sale, offlineId, payments) => sale);
    saleRepo.create = createMock;
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    await useCase.execute({ ...baseInput, offlineId: 'offline-123' });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      'offline-123',
      expect.any(Array),
    );
  });

  it('should process sale with multiple items', async () => {
    const products = [
      mockProduct,
      {
        ...mockProduct,
        id: 'prod-2',
        name: 'Product 2',
        price: 50,
        cost: 30,
        stock: 20,
      },
    ];
    productRepo.findByIds.mockResolvedValue(products);
    saleRepo.create.mockImplementation(async (sale) => sale);
    cashRepo.findOpenSession.mockResolvedValue({ id: 'session-1' } as any);

    const result = await useCase.execute({
      ...baseInput,
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 3 },
      ],
    });

    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(350); // 200 + 150
    expect(result.total).toBe(350);
  });
});
