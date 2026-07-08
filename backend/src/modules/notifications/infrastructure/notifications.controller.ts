import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gerente', 'vendedor')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    const tenantId = user.tenantId;
    const notifications: any[] = [];

    // Low stock alerts
    const lowStock = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { lte: 0 } },
      take: 5,
    });
    lowStock.forEach(p => {
      notifications.push({
        id: `low-stock-${p.id}`,
        type: 'critical',
        title: 'Producto sin stock',
        description: `El producto "${p.name}" se ha quedado sin existencias.`,
        time: 'Reciente',
        category: 'Inventario',
        unread: true,
      });
    });

    const nearLow = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { gt: 0, lte: 5 } },
      take: 5,
    });
    nearLow.forEach(p => {
      notifications.push({
        id: `near-low-${p.id}`,
        type: 'critical',
        title: 'Stock mínimo alcanzado',
        description: `"${p.name}" tiene solo ${p.stock} unidades (mínimo: ${p.minStock}).`,
        time: 'Reciente',
        category: 'Inventario',
        unread: true,
      });
    });

    // Recent sales
    const recentSales = await this.prisma.sale.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    recentSales.forEach(s => {
      const diff = Date.now() - new Date(s.createdAt).getTime();
      const mins = Math.floor(diff / 60000);
      const time = mins < 60 ? `Hace ${mins} min` : mins < 1440 ? `Hace ${Math.floor(mins / 60)} hr` : `Hace ${Math.floor(mins / 1440)} día${Math.floor(mins / 1440) > 1 ? 's' : ''}`;
      notifications.push({
        id: `sale-${s.id}`,
        type: 'success',
        title: 'Venta registrada',
        description: `Total $${Number(s.total).toFixed(2)} · ${s.paymentMethod}`,
        time,
        category: 'Ventas',
        unread: true,
      });
    });

    // Pending accounts payable
    const pendingAP = await this.prisma.accountsPayable.findMany({
      where: { tenantId, status: 'pending' },
      orderBy: { dueDate: 'asc' },
      take: 3,
    });
    pendingAP.forEach(ap => {
      const daysLeft = Math.ceil((new Date(ap.dueDate).getTime() - Date.now()) / 86400000);
      notifications.push({
        id: `ap-${ap.id}`,
        type: 'info',
        title: 'Cuenta por pagar próxima a vencer',
        description: `Vence en ${daysLeft} días · $${Number(ap.pendingAmount).toFixed(2)}`,
        time: `En ${daysLeft} días`,
        category: 'Finanzas',
        unread: false,
      });
    });

    return notifications;
  }
}
