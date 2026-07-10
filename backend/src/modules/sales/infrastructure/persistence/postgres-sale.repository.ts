import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  SaleRepository,
  SaleFilters,
} from '../../application/ports/sale.repository.interface';
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
      include: { items: true, customer: true },
    });
    return s ? this.toSale(s) : null;
  }

  async findAll(
    tenantId: string,
    filters?: SaleFilters,
    limit = 50,
    offset = 0,
  ): Promise<Sale[]> {
    const where: any = { tenantId };

    if (filters) {
      if (filters.search) {
        where.OR = [
          {
            customer: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
          {
            items: {
              some: {
                product: {
                  name: { contains: filters.search, mode: 'insensitive' },
                },
              },
            },
          },
        ];
      }
      if (filters.startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(filters.startDate),
        };
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt = { ...where.createdAt, lte: end };
      }
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }
      if (filters.status) {
        where.status = filters.status;
      }
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return sales.map((s) => this.toSale(s));
  }

  async count(tenantId: string, filters?: SaleFilters): Promise<number> {
    const where: any = { tenantId };
    if (filters) {
      if (filters.search) {
        where.OR = [
          {
            customer: {
              name: { contains: filters.search, mode: 'insensitive' },
            },
          },
        ];
      }
      if (filters.startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(filters.startDate),
        };
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt = { ...where.createdAt, lte: end };
      }
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
      if (filters.status) where.status = filters.status;
    }
    return this.prisma.sale.count({ where });
  }

  async create(sale: Sale, offlineId?: string): Promise<Sale> {
    const created = await this.prisma.$transaction(async (tx) => {
      if (sale.paymentMethod === 'credit') {
        if (!sale.customerId) {
          throw new InvalidSaleOperationException(
            'Debe seleccionar un cliente para ventas a crédito.',
          );
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
          where: { id: sale.customerId, tenantId: sale.tenantId },
          data: { balance: newBalance },
        });
        if (count === 0)
          throw new InvalidSaleOperationException('Cliente no encontrado.');
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
              taxRate: i.taxRate ?? 0,
              discount: i.discount ?? 0,
              subtotal: i.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // === AUTHORITATIVE STOCK CHECK (pessimistic lock) ===
      for (const item of sale.items) {
        const locked = await tx.$queryRaw<
          { id: string; stock: number; name: string }[]
        >`
          SELECT id, stock, name FROM "products"
          WHERE id = ${item.productId} AND "tenant_id" = ${sale.tenantId}
          FOR UPDATE
        `;
        if (!locked[0]) throw new ProductNotFoundException(item.productId);
        if (locked[0].stock < item.quantity) {
          throw new InsufficientStockException(
            locked[0].name,
            locked[0].stock,
            item.quantity,
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

  async voidSale(id: string, tenantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, tenantId },
        include: { items: true },
      });

      if (!sale) throw new InvalidSaleOperationException('Venta no encontrada');
      if (sale.status === 'cancelled')
        throw new InvalidSaleOperationException('La venta ya está anulada');

      await tx.sale.update({
        where: { id },
        data: { status: 'cancelled' },
      });

      // Restore stock
      for (const item of sale.items) {
        await tx.product.updateMany({
          where: { id: item.productId, tenantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'void',
            quantity: item.quantity,
            reference: `Anulación venta: ${id}`,
            userId: '',
          },
        });
      }

      // Reverse credit if applicable
      if (sale.paymentMethod === 'credit' && sale.customerId) {
        await tx.customer.updateMany({
          where: { id: sale.customerId, tenantId },
          data: { balance: { decrement: Number(sale.total) } },
        });
      }
    });
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
            Number(i.taxRate ?? 0),
            Number(i.discount ?? 0),
            Number(i.subtotal),
          ),
      ) ?? [],
      s.createdAt,
    );
  }
}
