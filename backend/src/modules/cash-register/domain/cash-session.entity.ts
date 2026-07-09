import { SessionAlreadyClosedException } from './cash-register.errors';

export class CashSession {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly openingBalance: number,
    public readonly closingBalance: number | null,
    public readonly actualBalance: number | null,
    public readonly difference: number | null,
    public readonly status: 'open' | 'closed',
    public readonly openedAt: Date,
    public readonly closedAt: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isOpen(): boolean {
    return this.status === 'open';
  }

  validateOpen(): void {
    if (!this.isOpen()) {
      throw new SessionAlreadyClosedException();
    }
  }

  /**
   * Computes close values.
   * @param actualBalance - The physical cash counted by the user
   * @param transactionSum - Net sum of all transactions in the session
   *   (income/sale positive, expense/refund negative)
   */
  close(
    actualBalance: number,
    transactionSum: number,
  ): {
    closingBalance: number;
    actualBalance: number;
    difference: number;
  } {
    this.validateOpen();
    const closingBalance =
      Math.round((this.openingBalance + transactionSum) * 100) / 100;
    const difference = Math.round((actualBalance - closingBalance) * 100) / 100;
    return { closingBalance, actualBalance, difference };
  }
}
