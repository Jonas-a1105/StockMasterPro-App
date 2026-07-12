import { Inject, Injectable } from '@nestjs/common';
import {
  SaleRepository,
  SALES_REPOSITORY,
} from '../ports/sale.repository.interface';
import { ProductRepository, PRODUCT_REPOSITORY } from '@modules/inventory';
import {
  AccountsReceivableRepository,
  ACCOUNTS_RECEIVABLE_REPOSITORY,
} from '@modules/accounts-receivable';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
} from '@modules/cash-register';
import { InvoiceSequenceService } from '@modules/fiscal/application/invoice-sequence.service';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Sale, PaymentMethod, SaleItem } from '../../domain';
import {
  ProductNotFoundException,
  InsufficientStockException,
  InvalidSaleOperationException,
} from '../../domain/sales.errors';
import * as crypto from 'crypto';

export interface SalePaymentInput {
  paymentMethod: PaymentMethod;
  amount: number;
  exchangeRate?: number;
  reference?: string;
}

interface ProcessSaleItem {
  productId: string;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

interface ProcessSaleInput {
  tenantId: string;
  userId: string;
  customerId?: string;
  items: ProcessSaleItem[];
  paymentMethod: PaymentMethod;
  payments?: SalePaymentInput[];
  discount?: number;
  taxRate?: number;
  offlineId?: string;
}

@Injectable()
export class ProcessSaleUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    @Inject(ACCOUNTS_RECEIVABLE_REPOSITORY)
    private readonly receivableRepo: AccountsReceivableRepository,
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly cashRepo: CashRegisterRepository,
    private readonly invoiceSeqService: InvoiceSequenceService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: ProcessSaleInput): Promise<Sale> {
    const productIds = input.items.map((i) => i.productId);
    const products = await this.productRepo.findByIds(
      productIds,
      input.tenantId,
    );

    const productMap = new Map(products.filter(Boolean).map((p) => [p.id, p]));
    const saleItems: SaleItem[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new ProductNotFoundException(item.productId);
      if (product.stock < item.quantity)
        throw new InsufficientStockException(
          product.name,
          product.stock,
          item.quantity,
        );
      saleItems.push(
        SaleItem.create(
          product.id,
          item.quantity,
          product.price,
          product.cost,
          item.discount ?? 0,
          item.taxRate ?? 0,
        ),
      );
    }

    const { subtotal, tax, discount, total } = Sale.calculateTotal(
      saleItems.map((i) => ({
        price: i.price,
        quantity: i.quantity,
        discount: i.discount,
        taxRate: i.taxRate,
      })),
      input.discount ?? 0,
      input.taxRate ?? 0,
    );

    // Validate payments if provided
    const payments =
      input.payments && input.payments.length > 0
        ? input.payments
        : [{ paymentMethod: input.paymentMethod, amount: total }];

    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentsTotal - total) > 0.01) {
      throw new InvalidSaleOperationException(
        `La suma de los pagos (${paymentsTotal.toFixed(2)}) no coincide con el total (${total.toFixed(2)})`,
      );
    }

    const sale = new Sale(
      crypto.randomUUID(),
      input.tenantId,
      input.userId,
      input.customerId ?? null,
      subtotal,
      tax,
      discount,
      total,
      input.paymentMethod,
      'completed',
      saleItems,
      new Date(),
    );

    const createdSale = await this.saleRepo.create(
      sale,
      input.offlineId,
      payments,
    );

    // Generate fiscal invoice number
    try {
      const { invoiceNumber } =
        await this.invoiceSeqService.getNextInvoiceNumber(
          input.tenantId,
          'FACT',
        );
      await this.prisma.sale.update({
        where: { id: createdSale.id },
        data: { invoiceNumber, invoiceSeries: 'FACT', documentType: 'factura' },
      });
      createdSale.invoiceNumber = invoiceNumber;
    } catch {
      // Non-critical: if invoice sequence fails, sale still works
    }

    // Post-sale financial integration
    const hasCreditPayment = payments.some((p) => p.paymentMethod === 'credit');
    if (hasCreditPayment) {
      if (!input.customerId) {
        throw new InvalidSaleOperationException(
          'Debe seleccionar un cliente para pagos a crédito.',
        );
      }

      const creditAmount = payments
        .filter((p) => p.paymentMethod === 'credit')
        .reduce((sum, p) => sum + p.amount, 0);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await this.receivableRepo.create({
        tenantId: input.tenantId,
        customerId: input.customerId,
        saleId: createdSale.id,
        totalAmount: creditAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        notes: `Venta #${createdSale.id.slice(0, 8)} (pago parcial crédito)`,
      });
    }

    // Handle cash register transactions for non-credit payments
    for (const payment of payments) {
      if (
        ['cash', 'card', 'transfer', 'mobile'].includes(payment.paymentMethod)
      ) {
        const openSession = await this.cashRepo.findOpenSession(
          input.userId,
          input.tenantId,
        );
        if (openSession) {
          await this.cashRepo.addTransaction({
            tenantId: input.tenantId,
            sessionId: openSession.id,
            amount: payment.amount,
            type: 'sale',
            description: `Venta #${createdSale.id.slice(0, 8)} (${payment.paymentMethod})`,
          });
        }
      }
    }

    return createdSale;
  }
}
