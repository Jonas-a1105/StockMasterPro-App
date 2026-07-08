import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SaleRepository } from '../core/interfaces/SaleRepository.interface';
import { Sale, SaleItem } from '../domain';

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

  async create(sale: Sale): Promise<Sale> {
    const created = await this.prisma.$transaction(async (tx) => {
      if (sale.paymentMethod === 'credit') {
        if (!sale.customerId) {
          throw new Error('Debe seleccionar un cliente para ventas a crédito.');
        }

        const customer = await tx.customer.findFirst({
          where: { id: sale.customerId, tenantId: sale.tenantId },
        });

        if (!customer) {
          throw new Error('Cliente no encontrado.');
        }

        const currentBalance = Number(customer.balance);
        const creditLimit = Number(customer.creditLimit ?? 0);
        const newBalance = currentBalance + sale.total;

        if (creditLimit > 0 && newBalance > creditLimit) {
          throw new Error(
            `Límite de crédito excedido. Límite: $${creditLimit.toFixed(2)}, Nuevo saldo esperado: $${newBalance.toFixed(2)}`
          );
        }

        await tx.customer.update({
          where: { id: sale.customerId },
          data: { balance: newBalance },
        });
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

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
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

  private toSale(s: any): Sale {
    return new Sale(
      s.id,
      s.tenantId,
      s.userId,
      s.customerId,
      Number(s.subtotal),
      Number(s.tax),
      Number(s.discount),
      Number(s.total),
      s.paymentMethod,
      s.status,
      s.items?.map(
        (i: any) =>
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
