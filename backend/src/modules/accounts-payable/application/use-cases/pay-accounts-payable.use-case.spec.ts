import { PayAccountsPayableUseCase } from './pay-accounts-payable.use-case';
import type {
  AccountsPayableRepository,
  PayablePaymentData,
} from '../ports/accounts-payable.repository.interface';
import { AccountsPayable } from '../../domain/accounts-payable.entity';
import { PayablePayment } from '../../domain/payable-payment.entity';
import {
  PayableNotFoundException,
  InvalidPaymentAmountException,
} from '../../domain/accounts-payable.errors';

describe('PayAccountsPayableUseCase', () => {
  let useCase: PayAccountsPayableUseCase;
  let repo: jest.Mocked<AccountsPayableRepository>;

  const mockPayable = new AccountsPayable(
    'payable-1',
    'tenant-1',
    'supplier-1',
    'po-1',
    1000,
    500,
    new Date('2025-12-31'),
    'pending',
    null,
    new Date(),
  );

  const baseInput: PayablePaymentData = {
    tenantId: 'tenant-1',
    accountPayableId: 'payable-1',
    amount: 200,
    paymentMethod: 'cash',
    paidAt: new Date().toISOString(),
  };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updatePendingAmount: jest.fn(),
      markAsPaid: jest.fn(),
      addPayment: jest.fn(),
      getPayments: jest.fn(),
    };

    useCase = new PayAccountsPayableUseCase(repo);
  });

  it('should process a valid payment and reduce pending amount', async () => {
    repo.findById.mockResolvedValue(mockPayable);
    repo.addPayment.mockImplementation(
      async (data) =>
        new PayablePayment(
          'payment-1',
          data.accountPayableId,
          data.amount,
          data.paymentMethod,
          data.notes ?? null,
          new Date(data.paidAt),
        ),
    );

    const result = await useCase.execute(baseInput);

    expect(result.amount).toBe(200);
    expect(repo.updatePendingAmount).toHaveBeenCalledWith(
      'payable-1',
      'tenant-1',
      300,
    );
    expect(repo.markAsPaid).not.toHaveBeenCalled();
  });

  it('should mark as paid when pending reaches zero', async () => {
    const payableFull = new AccountsPayable(
      'payable-2',
      'tenant-1',
      'supplier-1',
      null,
      500,
      500,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
    );
    repo.findById.mockResolvedValue(payableFull);
    repo.addPayment.mockImplementation(
      async (data) =>
        new PayablePayment(
          'payment-2',
          data.accountPayableId,
          data.amount,
          data.paymentMethod,
          data.notes ?? null,
          new Date(data.paidAt),
        ),
    );

    await useCase.execute({
      ...baseInput,
      accountPayableId: 'payable-2',
      amount: 500,
    });

    expect(repo.updatePendingAmount).toHaveBeenCalledWith(
      'payable-2',
      'tenant-1',
      0,
    );
    expect(repo.markAsPaid).toHaveBeenCalledWith('payable-2', 'tenant-1');
  });

  it('should throw if payable not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(baseInput)).rejects.toThrow(
      PayableNotFoundException,
    );
  });

  it('should delegate domain validation by calling applyPayment', async () => {
    repo.findById.mockResolvedValue(mockPayable);

    await expect(
      useCase.execute({ ...baseInput, amount: 999999 }),
    ).rejects.toThrow(InvalidPaymentAmountException);
  });

  it('should pass correct data to addPayment', async () => {
    repo.findById.mockResolvedValue(mockPayable);
    repo.addPayment.mockResolvedValue({} as PayablePayment);

    await useCase.execute(baseInput);

    expect(repo.addPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        accountPayableId: 'payable-1',
        amount: 200,
        paymentMethod: 'cash',
      }),
    );
  });
});
