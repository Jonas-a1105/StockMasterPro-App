import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PostgresCreditNoteRepo } from './PostgresCreditNoteRepo';

@Injectable()
export class CreditNoteService {
  constructor(
    private readonly repo: PostgresCreditNoteRepo,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string) {
    return this.repo.findById(id);
  }

  async create(dto: any, userId: string, tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      const items = dto.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.price * i.quantity,
      }));

      const note = await tx.creditNote.create({
        data: {
          tenantId,
          saleId: dto.saleId,
          customerId: dto.customerId,
          userId,
          reason: dto.reason,
          total: dto.total,
          refundMethod: dto.refundMethod || 'credit',
          items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: i.price, subtotal: i.subtotal })) },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            type: 'return',
            quantity: item.quantity,
            reference: `NC-${note.id}`,
            notes: `Devolución: ${dto.reason}`,
            userId,
          },
        });
      }

      if (dto.customerId && (dto.refundMethod === 'credit' || !dto.refundMethod)) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { balance: { increment: dto.total } },
        });
      }

      return note;
    });
  }

  async findBySale(saleId: string, tenantId: string) {
    const rows = await this.prisma.creditNote.findMany({
      where: { tenantId, saleId },
      include: { items: { include: { product: true } } },
    });
    return rows;
  }
}
