import { ValueObject } from '../value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  constructor(amount: number, currency = 'USD') {
    if (amount < 0) {
      throw new Error('El monto no puede ser negativo');
    }
    super({ amount: Math.round(amount * 100) / 100, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('No se pueden sumar diferentes monedas');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('No se pueden restar diferentes monedas');
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('El saldo resultante no puede ser negativo');
    }
    return new Money(result, this.currency);
  }
}
