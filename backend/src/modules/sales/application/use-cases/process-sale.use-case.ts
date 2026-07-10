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

    const createdSale = await this.saleRepo.create(sale, input.offlineId);

    // Generate fiscal invoice number
    try {
      const { invoiceNumber } = await this.invoiceSeqService.getNextInvoiceNumber(
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

    // Post-sale financial integration (within same RLS transaction)
    if (input.paymentMethod === 'credit') {
      if (!input.customerId) {
        throw new InvalidSaleOperationException(
          'Debe seleccionar un cliente para ventas a crédito.',
        );
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await this.receivableRepo.create({
        tenantId: input.tenantId,
        customerId: input.customerId,
        saleId: createdSale.id,
        totalAmount: total,
        dueDate: dueDate.toISOString().split('T')[0],
        notes: `Venta #${createdSale.id.slice(0, 8)}`,
      });
    } else if (
      input.paymentMethod === 'cash' ||
      input.paymentMethod === 'card' ||
      input.paymentMethod === 'transfer'
    ) {
      const openSession = await this.cashRepo.findOpenSession(
        input.userId,
        input.tenantId,
      );
      if (openSession) {
        await this.cashRepo.addTransaction({
          tenantId: input.tenantId,
          sessionId: openSession.id,
          amount: total,
          type: 'sale',
          description: `Venta #${createdSale.id.slice(0, 8)}`,
        });
      }
    }

    return createdSale;
  }
}
