import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PurchaseOrderRepository } from '../core/interfaces/PurchaseOrderRepository.interface';
import { PurchaseOrder, PurchaseOrderItem } from '../domain';

@Injectable()
export class PostgresPurchaseOrderRepo implements PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<PurchaseOrder[]> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toPurchaseOrder(o));
  }

  async findById(id: string, tenantId: string): Promise<PurchaseOrder | null> {
    const o = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    return o ? this.toPurchaseOrder(o) : null;
  }

  async create(order: PurchaseOrder): Promise<PurchaseOrder> {
    const created = await this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          id: order.id,
          tenantId: order.tenantId,
          supplierId: order.supplierId,
          userId: order.userId,
          status: order.status,
          total: order.total,
          notes: order.notes,
          items: {
            create: order.items.map((i) => ({
              tenantId: order.tenantId,
              product: { connect: { id: i.productId } },
              quantity: i.quantity,
              cost: i.cost,
              subtotal: i.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new Error(`Producto ${item.productId} no encontrado`);

        const currentStock = product.stock;
        const currentCost = Number(product.cost);
        const purchasedQty = item.quantity;
        const purchaseCost = item.cost;

        const newStock = currentStock + purchasedQty;
        const newCost =
          currentStock + purchasedQty > 0
            ? (currentStock * currentCost + purchasedQty * purchaseCost) /
              (currentStock + purchasedQty)
            : purchaseCost;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            cost: Math.round(newCost * 100) / 100,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId: order.tenantId,
            productId: item.productId,
            type: 'purchase',
            quantity: item.quantity,
            reference: `Compra: ${po.id}`,
            userId: order.userId,
          },
        });
      }

      return po;
    });

    return this.toPurchaseOrder(created);
  }

  private toPurchaseOrder(o: any): PurchaseOrder {
    return new PurchaseOrder(
      o.id,
      o.tenantId,
      o.supplierId,
      o.userId,
      o.status,
      Number(o.total),
      o.notes,
      o.items?.map(
        (i: any) =>
          new PurchaseOrderItem(
            i.productId,
            i.quantity,
            Number(i.cost),
            Number(i.subtotal),
          ),
      ) ?? [],
      o.createdAt,
    );
  }
}
