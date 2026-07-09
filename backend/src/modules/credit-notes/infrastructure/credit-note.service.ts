import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

@Injectable()
export class CreditNoteService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.creditNote.findMany({
      where: { tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
        sale: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const row = await this.prisma.creditNote.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        customer: true,
        sale: true,
      },
    });
    if (!row) {
      throw new NotFoundException('Nota de crédito no encontrada');
    }
    return row;
  }

  async create(dto: CreateCreditNoteDto, userId: string, tenantId: string) {
    if (!dto.reason.trim()) {
      throw new BadRequestException(
        'El motivo de la devolución es obligatorio',
      );
    }
    if (dto.items.length === 0) {
      throw new BadRequestException('Debe incluir al menos un producto');
    }
    if (dto.total <= 0) {
      throw new BadRequestException('El total debe ser mayor a cero');
    }

    return this.prisma.$transaction(async (tx) => {
      const items = dto.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.price * i.quantity,
      }));

      const note = await tx.creditNote.create({
        data: {
          tenantId,
          saleId: dto.saleId || null,
          customerId: dto.customerId || null,
          userId,
          reason: dto.reason,
          total: dto.total,
          refundMethod: dto.refundMethod || 'credit',
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      for (const item of items) {
        // Authoritative existence & ownership check on the product
        const prod = await tx.product.findFirst({
          where: { id: item.productId, tenantId },
        });
        if (!prod) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado en tu inventario`,
          );
        }

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

      if (dto.customerId) {
        const cust = await tx.customer.findFirst({
          where: { id: dto.customerId, tenantId },
        });
        if (!cust) {
          throw new NotFoundException(
            `Cliente ${dto.customerId} no encontrado`,
          );
        }

        if (dto.refundMethod === 'credit' || !dto.refundMethod) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { balance: { increment: dto.total } },
          });
        }
      }

      return note;
    });
  }

  async findBySale(saleId: string, tenantId: string) {
    return this.prisma.creditNote.findMany({
      where: { tenantId, saleId },
      include: { items: { include: { product: true } } },
    });
  }
}
