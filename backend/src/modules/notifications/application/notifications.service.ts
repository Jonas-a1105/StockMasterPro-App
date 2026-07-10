import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, userId: string) {
    const persistent = await this.prisma.socialNotification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const mappedPersistent = persistent.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      time: this.formatTime(n.createdAt),
      category: this.getCategory(n.type),
      unread: !n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    const alerts = await this.buildAlerts(tenantId);

    return [...alerts, ...mappedPersistent];
  }

  async create(input: {
    tenantId: string;
    userId: string;
    fromUserId: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }) {
    return this.prisma.socialNotification.create({ data: input });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.socialNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    return this.prisma.socialNotification.updateMany({
      where: { tenantId, userId, isRead: false },
      data: { isRead: true },
    });
  }

  async countUnread(tenantId: string, userId: string) {
    return this.prisma.socialNotification.count({
      where: { tenantId, userId, isRead: false },
    });
  }

  private async buildAlerts(tenantId: string) {
    const alerts: any[] = [];

    const lowStock = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { lte: 0 } },
      take: 5,
    });
    lowStock.forEach((p) => {
      alerts.push({
        id: `low-stock-${p.id}`,
        type: 'critical',
        title: 'Producto sin stock',
        message: `"${p.name}" se ha quedado sin existencias.`,
        time: 'Reciente',
        category: 'Inventario',
        unread: true,
        link: `/inventory?search=${encodeURIComponent(p.name)}`,
        createdAt: new Date().toISOString(),
      });
    });

    const nearLow = await this.prisma.product.findMany({
      where: { tenantId, isActive: true, stock: { gt: 0, lte: 5 } },
      take: 5,
    });
    nearLow.forEach((p) => {
      alerts.push({
        id: `near-low-${p.id}`,
        type: 'critical',
        title: 'Stock mínimo alcanzado',
        message: `"${p.name}" tiene solo ${p.stock} unidades.`,
        time: 'Reciente',
        category: 'Inventario',
        unread: true,
        link: `/inventory?search=${encodeURIComponent(p.name)}`,
        createdAt: new Date().toISOString(),
      });
    });

    return alerts;
  }

  private formatTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} hr`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Ayer' : `Hace ${days} días`;
  }

  private getCategory(type: string): string {
    const map: Record<string, string> = {
      low_stock: 'Inventario',
      sale: 'Ventas',
      purchase: 'Compras',
      payment: 'Finanzas',
      system: 'Sistema',
    };
    return map[type] || 'General';
  }
}
