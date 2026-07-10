import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateWarehouseTransferDto } from '../infrastructure/dto/create-warehouse-transfer.dto';

@Injectable()
export class WarehouseTransferService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string) {
    return this.prisma.warehouseTransfer.findMany({
      where: { tenantId, ...(status && { status }) },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const transfer = await this.prisma.warehouseTransfer.findFirst({
      where: { id, tenantId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } },
      },
    });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    return transfer;
  }

  async create(
    dto: CreateWarehouseTransferDto,
    userId: string,
    tenantId: string,
  ) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'El almacén origen y destino deben ser diferentes',
      );
    }

    const [fromWh, toWh] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.fromWarehouseId, tenantId },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.toWarehouseId, tenantId },
      }),
    ]);

    if (!fromWh || !toWh)
      throw new BadRequestException('Almacén no encontrado');
    if (!fromWh.isActive || !toWh.isActive)
      throw new BadRequestException('Almacén inactivo');

    for (const item of dto.items) {
      const prodWh = await this.prisma.productWarehouse.findFirst({
        where: {
          tenantId,
          productId: item.productId,
          warehouseId: dto.fromWarehouseId,
        },
      });
      if (!prodWh || prodWh.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente en almacén origen para producto ${item.productId}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.warehouseTransfer.create({
        data: {
          tenantId,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          notes: dto.notes,
          status: 'pending',
          createdBy: userId,
          items: {
            create: dto.items.map(
              (i: { productId: string; quantity: number }) => ({
                productId: i.productId,
                quantity: i.quantity,
              }),
            ),
          },
        },
        include: { items: true, fromWarehouse: true, toWarehouse: true },
      });

      return transfer;
    });
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
    notes?: string,
  ) {
    const transfer = await this.findById(id, tenantId);

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      throw new BadRequestException(
        'No se puede modificar una transferencia completada o cancelada',
      );
    }

    if (status === 'in_transit' && transfer.status === 'pending') {
      return this.prisma.warehouseTransfer.update({
        where: { id },
        data: { status: 'in_transit', notes },
      });
    }

    if (status === 'completed' && transfer.status === 'in_transit') {
      return this.prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          const fromProdWh = await tx.productWarehouse.findFirst({
            where: {
              tenantId,
              productId: item.productId,
              warehouseId: transfer.fromWarehouseId,
            },
          });
          if (!fromProdWh || fromProdWh.stock < item.quantity) {
            throw new BadRequestException(
              `Stock insuficiente al completar transferencia`,
            );
          }
          await tx.productWarehouse.update({
            where: { id: fromProdWh.id },
            data: { stock: { decrement: item.quantity } },
          });

          const toProdWh = await tx.productWarehouse.findFirst({
            where: {
              tenantId,
              productId: item.productId,
              warehouseId: transfer.toWarehouseId,
            },
          });
          if (toProdWh) {
            await tx.productWarehouse.update({
              where: { id: toProdWh.id },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await tx.productWarehouse.create({
              data: {
                tenantId,
                productId: item.productId,
                warehouseId: transfer.toWarehouseId,
                stock: item.quantity,
              },
            });
          }

          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'transfer_out',
              quantity: -item.quantity,
              reference: `TRF-${transfer.id}`,
              userId: transfer.createdBy,
            },
          });
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              type: 'transfer_in',
              quantity: item.quantity,
              reference: `TRF-${transfer.id}`,
              userId: transfer.createdBy,
            },
          });
        }

        return tx.warehouseTransfer.update({
          where: { id },
          data: { status: 'completed', completedAt: new Date(), notes },
          include: { items: true, fromWarehouse: true, toWarehouse: true },
        });
      });
    }

    if (status === 'cancelled' && transfer.status !== 'completed') {
      return this.prisma.warehouseTransfer.update({
        where: { id },
        data: { status: 'cancelled', notes },
      });
    }

    throw new BadRequestException('Transición de estado inválida');
  }
}
