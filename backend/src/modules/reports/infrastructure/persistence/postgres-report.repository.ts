import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface NetProfitData {
  grossRevenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  periodStart: string;
  periodEnd: string;
}

@Injectable()
export class PostgresReportRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getNetProfit(
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<NetProfitData> {
    const dateFilter: any = {};
    if (startDate && startDate !== 'undefined')
      dateFilter.gte = new Date(startDate);
    if (endDate && endDate !== 'undefined') dateFilter.lte = new Date(endDate);

    const saleWhere: any = { tenantId, status: 'completed' };
    if (Object.keys(dateFilter).length > 0) saleWhere.createdAt = dateFilter;

    const salesAgg = await this.prisma.sale.aggregate({
      where: saleWhere,
      _sum: { total: true },
    });
    const grossRevenue = Number(salesAgg._sum.total || 0);

    const saleItems = await this.prisma.saleItem.findMany({
      where: { sale: saleWhere },
      select: { quantity: true, cost: true },
    });
    const cogs = saleItems.reduce(
      (sum, item) => sum + Number(item.cost) * item.quantity,
      0,
    );

    const expenseWhere: any = { tenantId };
    if (Object.keys(dateFilter).length > 0)
      expenseWhere.expenseDate = dateFilter;
    const expenseAgg = await this.prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
    });
    const totalExpenses = Number(expenseAgg._sum.amount || 0);

    const grossProfit = grossRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin =
      grossRevenue > 0
        ? Math.round((netProfit / grossRevenue) * 10000) / 100
        : 0;

    return {
      grossRevenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMargin,
      periodStart: startDate || 'all',
      periodEnd: endDate || 'all',
    };
  }

  async getBestSellers(
    tenantId: string,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
  ) {
    const hasStart = startDate && startDate !== 'undefined';
    const hasEnd = endDate && endDate !== 'undefined';

    const dateFilter =
      hasStart || hasEnd
        ? `AND s."created_at" BETWEEN '${hasStart ? startDate : '1970-01-01'}' AND '${hasEnd ? endDate : '9999-12-31'}'`
        : '';

    const dateFilterSub = dateFilter.replace(/s\./g, 's2.');

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        barcode: string | null;
        totalQty: number;
        totalRevenue: number;
        percentage: number;
      }>
    >(
      `
      SELECT
        p.id, p.name, p.codigo_barras AS barcode,
        SUM(si.quantity)::int AS "totalQty",
        SUM(si."subtotal")::float AS "totalRevenue",
        COALESCE(
          (SUM(si."subtotal") / NULLIF(
            (SELECT SUM(si2."subtotal") FROM sale_items si2 JOIN sales s2 ON s2.id = si2.sale_id WHERE s2.tenant_id = $1 AND s2.status = 'completed' ${dateFilterSub}), 0
          ) * 100)::float,
          0
        ) AS "percentage"
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      WHERE s.tenant_id = $1 AND s.status = 'completed' ${dateFilter}
      GROUP BY p.id, p.name, p.codigo_barras
      ORDER BY "totalQty" DESC
      LIMIT $2
    `,
      tenantId,
      limit,
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      barcode: r.barcode,
      totalQty: Number(r.totalQty),
      totalRevenue: Number(r.totalRevenue),
      percentage: Number(r.percentage),
    }));
  }

  async getDeadProducts(tenantId: string, days: number = 90) {
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        barcode: string | null;
        stock: number;
        lastSale: Date | null;
      }>
    >(
      `
      SELECT p.id, p.name, p.codigo_barras AS barcode, p.stock,
        (SELECT MAX(s."created_at") FROM sale_items si2 JOIN sales s ON s.id = si2.sale_id WHERE si2.product_id = p.id AND s.tenant_id = p.tenant_id AND s.status = 'completed') AS "lastSale"
      FROM products p
      WHERE p.tenant_id = $1
        AND (
          (SELECT MAX(s."created_at") FROM sale_items si2 JOIN sales s ON s.id = si2.sale_id WHERE si2.product_id = p.id AND s.tenant_id = p.tenant_id AND s.status = 'completed') IS NULL
          OR
          (SELECT MAX(s."created_at") FROM sale_items si2 JOIN sales s ON s.id = si2.sale_id WHERE si2.product_id = p.id AND s.tenant_id = p.tenant_id AND s.status = 'completed') < NOW() - INTERVAL '1 day' * $2
        )
        AND p.stock > 0
      ORDER BY "lastSale" ASC NULLS FIRST
    `,
      tenantId,
      days,
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      barcode: r.barcode,
      stock: r.stock,
      lastSale: r.lastSale,
      daysWithoutSale: r.lastSale
        ? Math.floor(
            (Date.now() - new Date(r.lastSale).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    }));
  }

  async getMonthlyProfit(tenantId: string, year: number) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      include: { items: true },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        tenantId,
        expenseDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthSales = sales.filter(
        (s) => new Date(s.createdAt).getMonth() === i,
      );
      const monthExpenses = expenses.filter(
        (e) => new Date(e.expenseDate).getMonth() === i,
      );
      const revenue = monthSales.reduce((sum, s) => sum + Number(s.total), 0);
      const cogs = monthSales.reduce(
        (sum, s) =>
          sum +
          s.items.reduce(
            (acc, item) => acc + Number(item.cost) * item.quantity,
            0,
          ),
        0,
      );
      const exp = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        month: i + 1,
        label: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ][i],
        revenue,
        cogs,
        expenses: exp,
        profit: revenue - cogs - exp,
      };
    });

    return months;
  }
}
