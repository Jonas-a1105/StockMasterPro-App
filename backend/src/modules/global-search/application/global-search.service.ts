import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface GlobalSearchResult {
  type:
    | 'product'
    | 'customer'
    | 'supplier'
    | 'sale'
    | 'purchaseOrder'
    | 'inventoryCount';
  id: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class GlobalSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    tenantId: string,
    query: string,
    limit = 10,
  ): Promise<GlobalSearchResult[]> {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm || searchTerm.length < 2) return [];

    const results: GlobalSearchResult[] = [];

    // Search Products
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { barcode: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        price: true,
        stock: true,
        brand: true,
      },
      take: limit,
    });

    for (const p of products) {
      results.push({
        type: 'product',
        id: p.id,
        title: p.name,
        subtitle: `SKU: ${p.barcode || 'N/A'} · $${Number(p.price).toFixed(2)} · Stock: ${p.stock}`,
        metadata: { price: Number(p.price), stock: p.stock },
      });
    }

    // Search Customers
    const customers = await this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { taxId: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        taxId: true,
        balance: true,
      },
      take: limit,
    });

    for (const c of customers) {
      results.push({
        type: 'customer',
        id: c.id,
        title: c.name,
        subtitle: `${c.email || 'Sin email'} · ${c.phone || 'Sin teléfono'} · Saldo: ${Number(c.balance).toFixed(2)}`,
        metadata: { balance: Number(c.balance) },
      });
    }

    // Search Suppliers
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { contact: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { taxId: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        phone: true,
        taxId: true,
      },
      take: limit,
    });

    for (const s of suppliers) {
      results.push({
        type: 'supplier',
        id: s.id,
        title: s.name,
        subtitle: `${s.contact || 'Sin contacto'} · ${s.email || s.phone || 'Sin contacto'}`,
        metadata: {},
      });
    }

    // Search Sales (by customer name, invoice number, etc.)
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        OR: [
          { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
          { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const s of sales) {
      results.push({
        type: 'sale',
        id: s.id,
        title: `Venta ${s.invoiceNumber || s.id.slice(0, 8)}`,
        subtitle: `${s.customer?.name || 'Consumidor Final'} · ${Number(s.total).toFixed(2)} · ${new Date(s.createdAt).toLocaleDateString()}`,
        metadata: { total: Number(s.total), paymentMethod: s.paymentMethod },
      });
    }

    // Search Purchase Orders
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        OR: [
          { id: { equals: searchTerm } },
          { supplier: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const po of purchaseOrders) {
      results.push({
        type: 'purchaseOrder',
        id: po.id,
        title: `OC ${po.id.slice(0, 8)}`,
        subtitle: `${po.supplier?.name || 'Sin proveedor'} · ${Number(po.total).toFixed(2)} · ${po.status}`,
        metadata: { total: Number(po.total), status: po.status },
      });
    }

    // Search Inventory Counts
    const inventoryCounts = await this.prisma.inventoryCount.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { id: { equals: searchTerm } },
        ],
      },
      include: {
        warehouse: { select: { name: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    for (const ic of inventoryCounts) {
      results.push({
        type: 'inventoryCount',
        id: ic.id,
        title: `Conteo ${ic.name || ic.id.slice(0, 8)}`,
        subtitle: `${ic.warehouse?.name || 'Todos'} · ${ic.status} · ${ic.items?.length || 0} items`,
        metadata: { status: ic.status },
      });
    }

    // Sort by relevance (exact matches first, then by type priority)
    const typePriority = {
      product: 1,
      customer: 2,
      sale: 3,
      supplier: 4,
      purchaseOrder: 5,
      inventoryCount: 6,
    };
    return results
      .sort((a, b) => {
        const aExact =
          a.title.toLowerCase().includes(searchTerm) &&
          a.title.toLowerCase().startsWith(searchTerm)
            ? 0
            : 1;
        const bExact =
          b.title.toLowerCase().includes(searchTerm) &&
          b.title.toLowerCase().startsWith(searchTerm)
            ? 0
            : 1;
        if (aExact !== bExact) return aExact - bExact;
        return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
      })
      .slice(0, limit);
  }
}
