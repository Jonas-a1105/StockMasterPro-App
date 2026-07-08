import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { SaleRepository } from '../../application/ports/sale.repository.interface';
import { Sale, SaleItem } from '../../domain';
import {
  ProductNotFoundException,
  InsufficientStockException,
  CreditLimitExceededException,
  InvalidSaleOperationException,
} from '../../domain/sales.errors';
import { Sale as PrismaSale, SaleItem as PrismaSaleItem } from '@prisma/client';

type PrismaSaleWithItems = PrismaSale & { items?: PrismaSaleItem[] };

@Injectable()
export class PostgresSaleRepo implements SaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Sale | null> {
    const s = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    return s ? this.toSale(s) : null;
  }

  async findAll(tenantId: string, limit = 50, offset = 0): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return sales.map((s) => this.toSale(s));
  }

  async create(sale: Sale, offlineId?: string): Promise<Sale> {
    const created = await this.prisma.$transaction(async (tx) => {
      if (sale.paymentMethod === 'credit') {
        if (!sale.customerId) {
          throw new InvalidSaleOperationException('Debe seleccionar un cliente para ventas a crédito.');
        }

        const customer = await tx.customer.findFirst({
          where: { id: sale.customerId, tenantId: sale.tenantId },
        });

        if (!customer) {
          throw new InvalidSaleOperationException('Cliente no encontrado.');
        }

        const currentBalance = Number(customer.balance);
        const creditLimit = Number(customer.creditLimit ?? 0);
        const newBalance = currentBalance + sale.total;

        if (creditLimit > 0 && newBalance > creditLimit) {
          throw new CreditLimitExceededException(creditLimit, newBalance);
        }

        const { count } = await tx.customer.updateMany({
          where: { id: sale.customerId!, tenantId: sale.tenantId },
          data: { balance: newBalance },
        });
        if (count === 0) throw new InvalidSaleOperationException('Cliente no encontrado.');
      }

      const s = await tx.sale.create({
        data: {
          id: sale.id,
          tenantId: sale.tenantId,
          userId: sale.userId,
          customerId: sale.customerId,
          subtotal: sale.subtotal,
          tax: sale.tax,
          discount: sale.discount,
          total: sale.total,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          isOffline: !!offlineId,
          offlineId: offlineId ?? null,
          items: {
            create: sale.items.map((i) => ({
              tenantId: sale.tenantId,
              product: { connect: { id: i.productId } },
              quantity: i.quantity,
              price: i.price,
              cost: i.cost,
              subtotal: i.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // === AUTHORITATIVE STOCK CHECK (pessimistic lock) ===
      // Lock products with FOR UPDATE to prevent concurrent overselling.
      // This is the ONLY place where stock is validated and decremented.
      for (const item of sale.items) {
        const locked = await tx.$queryRaw<{ id: string; stock: number; name: string }[]>`
          SELECT id, stock, name FROM "products"
          WHERE id = ${item.productId} AND "tenant_id" = ${sale.tenantId}
          FOR UPDATE
        `;
        if (!locked[0]) throw new ProductNotFoundException(item.productId);
        if (locked[0].stock < item.quantity) {
          throw new InsufficientStockException(
            locked[0].name,
            locked[0].stock,
            item.quantity
          );
        }

        const { count } = await tx.product.updateMany({
          where: { id: item.productId, tenantId: sale.tenantId },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) throw new ProductNotFoundException(item.productId);
        await tx.inventoryMovement.create({
          data: {
            tenantId: sale.tenantId,
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            reference: `Venta: ${s.id}`,
            userId: sale.userId,
          },
        });
      }

      return s;
    });

    return this.toSale(created);
  }

  async count(tenantId: string): Promise<number> {
    return this.prisma.sale.count({ where: { tenantId } });
  }

  async getDailySummary(
    tenantId: string,
  ): Promise<{ total: number; count: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.prisma.sale.aggregate({
      where: { tenantId, createdAt: { gte: today }, status: 'completed' },
      _sum: { total: true },
      _count: true,
    });
    return { total: Number(result._sum.total ?? 0), count: result._count };
  }

  private toSale(s: PrismaSaleWithItems): Sale {
    return new Sale(
      s.id,
      s.tenantId,
      s.userId,
      s.customerId,
      Number(s.subtotal),
      Number(s.tax),
      Number(s.discount),
      Number(s.total),
      s.paymentMethod as any,
      s.status as any,
      s.items?.map(
        (i: PrismaSaleItem) =>
          new SaleItem(
            i.productId,
            i.quantity,
            Number(i.price),
            Number(i.cost),
            Number(i.subtotal),
          ),
      ) ?? [],
      s.createdAt,
    );
  }
}
