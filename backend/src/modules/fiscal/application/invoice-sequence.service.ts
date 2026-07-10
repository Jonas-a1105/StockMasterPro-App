import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class InvoiceSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSequence(tenantId: string, series = 'FACT'): Promise<{ series: string; nextNumber: number }> {
    let seq = await this.prisma.invoiceSequence.findUnique({
      where: { tenantId_series: { tenantId, series } },
    });
    if (!seq) {
      seq = await this.prisma.invoiceSequence.create({
        data: { tenantId, series },
      });
    }
    return { series: seq.series, nextNumber: seq.nextNumber };
  }

  async getNextInvoiceNumber(tenantId: string, series = 'FACT') {
    const seq = await this.prisma.$transaction(async (tx) => {
      const lock = await tx.$queryRawUnsafe<{ next_number: number }[]>(
        `SELECT next_number FROM invoice_sequences WHERE tenant_id = $1 AND series = $2 FOR UPDATE`,
        tenantId, series,
      );

      if (lock.length === 0) {
        await tx.invoiceSequence.create({
          data: { tenantId, series },
        });
        const created = await tx.$queryRawUnsafe<{ next_number: number }[]>(
          `SELECT next_number FROM invoice_sequences WHERE tenant_id = $1 AND series = $2 FOR UPDATE`,
          tenantId, series,
        );
        return created[0];
      }
      return lock[0];
    });

    const number = seq.next_number;

    await this.prisma.invoiceSequence.update({
      where: { tenantId_series: { tenantId, series } },
      data: { nextNumber: number + 1 },
    });

    const padded = String(number).padStart(6, '0');
    return { invoiceNumber: `${series}-${padded}`, sequenceNumber: number, series };
  }

  async resetSequence(tenantId: string, series: string, nextNumber: number) {
    return this.prisma.invoiceSequence.upsert({
      where: { tenantId_series: { tenantId, series } },
      update: { nextNumber },
      create: { tenantId, series, nextNumber },
    });
  }
}
