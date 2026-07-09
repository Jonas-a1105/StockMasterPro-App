import { AccountsPayable } from './accounts-payable.entity';
import {
  PayableAlreadyPaidException,
  InvalidPaymentAmountException,
} from './accounts-payable.errors';

describe('AccountsPayable entity', () => {
  const createPayable = (overrides?: Partial<AccountsPayable>) =>
    new AccountsPayable(
      'payable-1',
      'tenant-1',
      'supplier-1',
      'po-1',
      1000,
      1000,
      new Date('2025-12-31'),
      'pending',
      null,
      new Date(),
    );

  it('should reduce pending amount on valid payment', () => {
    const payable = createPayable();
    const newPending = payable.applyPayment(300);
    expect(newPending).toBe(700);
  });

  it('should throw if payment exceeds pending amount', () => {
    const payable = createPayable();
    expect(() => payable.applyPayment(1500)).toThrow(
      InvalidPaymentAmountException,
    );
  });

  it('should throw if payment amount is zero', () => {
    const payable = createPayable();
    expect(() => payable.applyPayment(0)).toThrow(
      InvalidPaymentAmountException,
    );
  });

  it('should throw if payment amount is negative', () => {
    const payable = createPayable();
    expect(() => payable.applyPayment(-100)).toThrow(
      InvalidPaymentAmountException,
    );
  });

  it('should throw if payable is already paid', () => {
    const paidPayable = new AccountsPayable(
      'payable-2',
      'tenant-1',
      'supplier-1',
      null,
      500,
      0,
      new Date('2025-12-31'),
      'paid',
      null,
      new Date(),
    );
    expect(() => paidPayable.applyPayment(100)).toThrow(
      PayableAlreadyPaidException,
    );
  });

  it('should be fully paid when pendingAmount is 0', () => {
    const paidPayable = new AccountsPayable(
      'payable-3',
      'tenant-1',
      'supplier-1',
      null,
      500,
      0,
      new Date('2025-12-31'),
      'paid',
      null,
      new Date(),
    );
    expect(paidPayable.isFullyPaid()).toBe(true);
  });

  it('should not be fully paid when pendingAmount > 0', () => {
    const payable = createPayable();
    expect(payable.isFullyPaid()).toBe(false);
  });

  it('should detect overdue when past due date and pending', () => {
    const overduePayable = new AccountsPayable(
      'payable-4',
      'tenant-1',
      'supplier-1',
      null,
      500,
      500,
      new Date('2020-01-01'),
      'pending',
      null,
      new Date(),
    );
    expect(overduePayable.isOverdue()).toBe(true);
  });

  it('should not be overdue if already paid even if past date', () => {
    const paidOverdue = new AccountsPayable(
      'payable-5',
      'tenant-1',
      'supplier-1',
      null,
      500,
      0,
      new Date('2020-01-01'),
      'paid',
      null,
      new Date(),
    );
    expect(paidOverdue.isOverdue()).toBe(false);
  });

  it('should reduce pending to 0 with exact payment', () => {
    const payable = createPayable();
    const newPending = payable.applyPayment(1000);
    expect(newPending).toBe(0);
  });
});
