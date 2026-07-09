import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface PurchaseOrderInput {
  id: string;
  tenantId: string;
  supplierId: string;
  userId: string;
  status: string;
  total: number;
  notes?: string | null;
  items: {
    productId: string;
    quantity: number;
    cost: number;
    subtotal: number;
  }[];
}

@Injectable()
export class PostgresPurchaseOrderRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }

  async create(order: PurchaseOrderInput) {
    return this.prisma.$transaction(async (tx) => {
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
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId: order.tenantId },
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

        await tx.product.updateMany({
          where: { id: item.productId, tenantId: order.tenantId },
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
  }
}
