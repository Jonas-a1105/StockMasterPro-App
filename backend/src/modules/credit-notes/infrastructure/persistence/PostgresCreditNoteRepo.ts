import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreditNoteRepository, CreateCreditNoteData, CreateCreditNoteItemData } from '../../application/ports/CreditNoteRepository.interface';
import { CreditNote } from '../../domain/CreditNote';

@Injectable()
export class PostgresCreditNoteRepo implements CreditNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<CreditNote[]> {
    const rows = await this.prisma.creditNote.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } }, customer: true, sale: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async findById(id: string): Promise<CreditNote | null> {
    const row = await this.prisma.creditNote.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true, sale: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCreditNoteData, items: CreateCreditNoteItemData[]): Promise<CreditNote> {
    const row = await this.prisma.creditNote.create({
      data: {
        tenantId: data.tenantId,
        saleId: data.saleId,
        customerId: data.customerId,
        userId: data.userId,
        reason: data.reason,
        total: data.total,
        refundMethod: data.refundMethod,
        items: {
          create: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true, sale: true },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): CreditNote {
    return new CreditNote(row.id, row.tenantId, row.saleId, row.customerId, row.userId, row.reason, Number(row.total), row.status, row.refundMethod, row.createdAt);
  }
}
