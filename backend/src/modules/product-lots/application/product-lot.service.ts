import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  CreateProductLotDto,
  UpdateProductLotDto,
} from '../infrastructure/dto/product-lot.dto';

@Injectable()
export class ProductLotService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, productId?: string) {
    return this.prisma.productLot.findMany({
      where: { tenantId, ...(productId && { productId }) },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const lot = await this.prisma.productLot.findFirst({
      where: { id, tenantId },
      include: { product: true },
    });
    if (!lot) throw new NotFoundException('Lote no encontrado');
    return lot;
  }

  async create(dto: CreateProductLotDto, userId: string, tenantId: string) {
    // Validate product exists
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Check lot number uniqueness
    const existing = await this.prisma.productLot.findFirst({
      where: { tenantId, lotNumber: dto.lotNumber },
    });
    if (existing) throw new BadRequestException('El número de lote ya existe');

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.productLot.create({
        data: {
          tenantId,
          productId: dto.productId,
          lotNumber: dto.lotNumber,
          quantity: dto.quantity,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          manufactureDate: dto.manufactureDate
            ? new Date(dto.manufactureDate)
            : null,
        },
      });

      // Update product stock (aggregate from lots)
      await this.recalcProductStock(tx, dto.productId, tenantId);

      // Inventory movement
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          type: 'lot_entry',
          quantity: dto.quantity,
          reference: `Lote: ${dto.lotNumber}`,
          userId,
        },
      });

      return lot;
    });
  }

  async update(
    id: string,
    dto: UpdateProductLotDto,
    tenantId: string,
    userId: string,
  ) {
    const lot = await this.findById(id, tenantId);

    return this.prisma.$transaction(async (tx) => {
      const oldQty = lot.quantity;
      const updated = await tx.productLot.update({
        where: { id },
        data: {
          quantity: dto.quantity ?? lot.quantity,
          expiryDate: dto.expiryDate
            ? new Date(dto.expiryDate)
            : lot.expiryDate,
          manufactureDate: dto.manufactureDate
            ? new Date(dto.manufactureDate)
            : lot.manufactureDate,
        },
      });

      if (dto.quantity !== undefined && dto.quantity !== oldQty) {
        await this.recalcProductStock(tx, lot.productId, tenantId);
        await tx.inventoryMovement.create({
          data: {
            tenantId,
            productId: lot.productId,
            type: 'lot_adjustment',
            quantity: dto.quantity - oldQty,
            reference: `Ajuste lote: ${lot.lotNumber}`,
            userId,
          },
        });
      }

      return updated;
    });
  }

  async delete(id: string, tenantId: string, userId: string) {
    const lot = await this.findById(id, tenantId);

    return this.prisma.$transaction(async (tx) => {
      await tx.productLot.delete({ where: { id } });
      await this.recalcProductStock(tx, lot.productId, tenantId);
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: lot.productId,
          type: 'lot_exit',
          quantity: -lot.quantity,
          reference: `Eliminación lote: ${lot.lotNumber}`,
          userId,
        },
      });
    });
  }

  async getExpiringSoon(tenantId: string, days = 30) {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + days);

    return this.prisma.productLot.findMany({
      where: {
        tenantId,
        expiryDate: { lte: limitDate, gte: new Date() },
        quantity: { gt: 0 },
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getExpired(tenantId: string) {
    return this.prisma.productLot.findMany({
      where: {
        tenantId,
        expiryDate: { lt: new Date() },
        quantity: { gt: 0 },
      },
      include: { product: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  private async recalcProductStock(
    tx: any,
    productId: string,
    tenantId: string,
  ) {
    const total = await tx.productLot.aggregate({
      where: { productId, tenantId },
      _sum: { quantity: true },
    });
    await tx.product.update({
      where: { id: productId },
      data: { stock: total._sum.quantity || 0 },
    });
  }
}
