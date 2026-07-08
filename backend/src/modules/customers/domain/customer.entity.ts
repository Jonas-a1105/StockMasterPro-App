import { InvalidCreditAmountException } from './customers.errors';

export class Customer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly creditLimit: number,
    public readonly balance: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  payCredit(amount: number): number {
    if (amount <= 0) throw new InvalidCreditAmountException('El monto del abono debe ser mayor a cero');
    return Math.max(0, this.balance - amount);
  }

  chargeCredit(amount: number): number {
    if (amount <= 0) throw new InvalidCreditAmountException('El monto del cargo debe ser mayor a cero');
    const newBalance = this.balance + amount;
    if (newBalance > this.creditLimit && this.creditLimit > 0) {
      throw new InvalidCreditAmountException(`El cargo excede el límite de crédito disponible de ${this.creditLimit}`);
    }
    return newBalance;
  }
}
