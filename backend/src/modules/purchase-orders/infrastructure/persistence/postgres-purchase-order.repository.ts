import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async approveOrder(id: string, tenantId: string, userId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    if (!order) throw new NotFoundException('Orden pendiente no encontrada');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: { items: true },
    });
  }

  async rejectOrder(
    id: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId, status: 'pending' },
    });
    if (!order) throw new NotFoundException('Orden pendiente no encontrada');

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: { items: true },
    });
  }

  async cancelOrder(
    id: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        tenantId,
        status: { in: ['pending', 'approved', 'partially_received'] },
      },
    });
    if (!order)
      throw new NotFoundException(
        'Orden no encontrada o ya no puede cancelarse',
      );

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: { items: true },
    });
  }

  async receiveOrder(
    id: string,
    tenantId: string,
    items?: { productId: string; quantity: number }[],
  ) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        tenantId,
        status: { in: ['approved', 'partially_received'] },
      },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden aprobada no encontrada');

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const incomingQty = items
          ? (items.find((i) => i.productId === item.productId)?.quantity ?? 0)
          : item.quantity;

        if (incomingQty <= 0) continue;

        const remaining = item.quantity - item.receivedQty;
        const actualQty = Math.min(incomingQty, remaining);
        if (actualQty <= 0) continue;

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.receivedQty + actualQty },
        });

        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
        });
        if (!product)
          throw new Error(`Producto ${item.productId} no encontrado`);

        const currentStock = product.stock;
        const currentCost = Number(product.cost);
        const purchaseCost = Number(item.cost);

        const newStock = currentStock + actualQty;
        const newCost =
          currentStock + actualQty > 0
            ? (currentStock * currentCost + actualQty * purchaseCost) /
              (currentStock + actualQty)
            : purchaseCost;

        await tx.product.updateMany({
          where: { id: item.productId, tenantId },
          data: {
            stock: newStock,
            cost: Math.round(newCost * 100) / 100,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'purchase',
            quantity: actualQty,
            reference: `Recepción parcial: ${id}`,
            userId: order.userId,
          },
        });
      }

      const updatedOrder = await tx.purchaseOrder.findFirst({
        where: { id },
        include: { items: true },
      });

      if (!updatedOrder) throw new Error('Orden no encontrada tras recepción');

      const allFullyReceived = updatedOrder.items.every(
        (i) => i.receivedQty >= i.quantity,
      );

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: allFullyReceived ? 'received' : 'partially_received',
          updatedAt: new Date(),
        },
      });

      return this.prisma.purchaseOrder.findFirst({
        where: { id },
        include: { items: true },
      });
    });
  }
}
