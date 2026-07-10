import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface MRRMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  byPlan: Record<string, { count: number; mrr: number }>;
  growth: { currentMonth: number; previousMonth: number; growthRate: number };
}

export interface ChurnMetrics {
  churnRate: number;
  revenueChurnRate: number;
  cancelledThisMonth: number;
  cancelledLastMonth: number;
  byPlan: Record<string, { count: number; rate: number }>;
}

export interface LTVMetrics {
  ltv: number;
  averageRevenuePerUser: number;
  averageLifespanMonths: number;
  byPlan: Record<string, { ltv: number; avgRevenue: number; lifespanMonths: number }>;
}

export interface CohortMetrics {
  month: string;
  initialSubscribers: number;
  retention: Record<number, number>; // month -> retention %
  revenue: Record<number, number>; // month -> revenue
}

export interface SaaSMetricsSummary {
  mrr: MRRMetrics;
  churn: ChurnMetrics;
  ltv: LTVMetrics;
  cohorts: CohortMetrics[];
}

@Injectable()
export class SaasMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMRRMetrics(): Promise<MRRMetrics> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Get all active subscriptions with their plans
    const tenants = await this.prisma.tenant.findMany({
      where: {
        subscriptionStatus: { in: ['active', 'trialing', 'past_due'] },
        isBlocked: false,
      },
      select: {
        id: true,
        planType: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    // Plan pricing (should match Stripe)
    const planPrices: Record<string, number> = {
      free: 0,
      pro: 2900, // $29/month in cents
      enterprise: 9900, // $99/month in cents
    };

    let mrr = 0;
    const byPlan: Record<string, { count: number; mrr: number }> = {};

    for (const tenant of tenants) {
      const price = planPrices[tenant.planType] || 0;
      mrr += price;
      if (!byPlan[tenant.planType]) {
        byPlan[tenant.planType] = { count: 0, mrr: 0 };
      }
      byPlan[tenant.planType].count++;
      byPlan[tenant.planType].mrr += price;
    }

    // Calculate growth (simplified - compare active subs this month vs last month)
    const thisMonthActive = tenants.filter(
      t => t.createdAt < firstDayNextMonth && t.subscriptionStatus !== 'cancelled',
    ).length;

    const lastMonthActive = await this.prisma.tenant.count({
      where: {
        createdAt: { lt: firstDayThisMonth },
        subscriptionStatus: { in: ['active', 'trialing', 'past_due'] },
        isBlocked: false,
      },
    });

    const growthRate = lastMonthActive > 0
      ? ((thisMonthActive - lastMonthActive) / lastMonthActive) * 100
      : 0;

    return {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: tenants.length,
      byPlan,
      growth: {
        currentMonth: thisMonthActive,
        previousMonth: lastMonthActive,
        growthRate: Math.round(growthRate * 100) / 100,
      },
    };
  }

  async getChurnMetrics(): Promise<ChurnMetrics> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Cancelled this month
    const cancelledThisMonth = await this.prisma.tenant.count({
      where: {
        subscriptionStatus: 'cancelled',
        updatedAt: { gte: firstDayThisMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
      },
    });

    // Cancelled last month
    const cancelledLastMonth = await this.prisma.tenant.count({
      where: {
        subscriptionStatus: 'cancelled',
        updatedAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
      },
    });

    // Active at start of month (for churn rate calculation)
    const startOfMonthActive = await this.prisma.tenant.count({
      where: {
        createdAt: { lt: firstDayThisMonth },
        subscriptionStatus: { in: ['active', 'trialing', 'past_due'] },
        isBlocked: false,
      },
    });

    const churnRate = startOfMonthActive > 0
      ? (cancelledThisMonth / startOfMonthActive) * 100
      : 0;

    // By plan
    const cancelledByPlan = await this.prisma.tenant.groupBy({
      by: ['planType'],
      where: {
        subscriptionStatus: 'cancelled',
        updatedAt: { gte: firstDayThisMonth },
      },
      _count: true,
    });

    const byPlan: Record<string, { count: number; rate: number }> = {};
    for (const item of cancelledByPlan) {
      const totalInPlan = await this.prisma.tenant.count({
        where: { planType: item.planType, isBlocked: false },
      });
      byPlan[item.planType] = {
        count: item._count,
        rate: totalInPlan > 0 ? (item._count / totalInPlan) * 100 : 0,
      };
    }

    // Revenue churn (simplified)
    const planPrices: Record<string, number> = { free: 0, pro: 2900, enterprise: 9900 };
    let lostMRR = 0;
    let totalMRR = 0;

    const activeTenants = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: { in: ['active', 'trialing', 'past_due'] }, isBlocked: false },
      select: { planType: true },
    });

    for (const t of activeTenants) {
      totalMRR += planPrices[t.planType] || 0;
    }

    const cancelledTenants = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: 'cancelled', updatedAt: { gte: firstDayThisMonth } },
      select: { planType: true },
    });

    for (const t of cancelledTenants) {
      lostMRR += planPrices[t.planType] || 0;
    }

    const revenueChurnRate = totalMRR > 0 ? (lostMRR / totalMRR) * 100 : 0;

    return {
      churnRate: Math.round(churnRate * 100) / 100,
      revenueChurnRate: Math.round(revenueChurnRate * 100) / 100,
      cancelledThisMonth,
      cancelledLastMonth,
      byPlan,
    };
  }

  async getLTVMetrics(): Promise<LTVMetrics> {
    const planPrices: Record<string, number> = { free: 0, pro: 2900, enterprise: 9900 };

    // Average lifespan estimation (months before cancellation)
    // Simplified: based on historical churn
    const churnMetrics = await this.getChurnMetrics();
    const monthlyChurnRate = churnMetrics.churnRate / 100;
    const averageLifespanMonths = monthlyChurnRate > 0 ? 1 / monthlyChurnRate : 24;

    const byPlan: Record<string, { ltv: number; avgRevenue: number; lifespanMonths: number }> = {};

    const plans = ['free', 'pro', 'enterprise'];
    for (const plan of plans) {
      const price = planPrices[plan] || 0;
      const avgRevenue = price / 100; // in dollars
      const lifespan = averageLifespanMonths;
      const ltv = avgRevenue * lifespan;
      byPlan[plan] = { ltv, avgRevenue, lifespanMonths: Math.round(lifespan * 100) / 100 };
    }

    const activeTenants = await this.prisma.tenant.count({
      where: { subscriptionStatus: { in: ['active', 'trialing', 'past_due'] }, isBlocked: false },
    });

    const planCounts = await this.prisma.tenant.groupBy({
      by: ['planType'],
      where: { subscriptionStatus: { in: ['active', 'trialing', 'past_due'] }, isBlocked: false },
      _count: { planType: true },
    });

    let totalWeightedRevenue = 0;
    for (const pc of planCounts) {
      const count = (pc._count as any)?.planType || 0;
      totalWeightedRevenue += (planPrices[pc.planType] || 0) * count;
    }

    const avgRevenuePerUser = activeTenants > 0 ? totalWeightedRevenue / activeTenants / 100 : 0;
    const ltv = avgRevenuePerUser * averageLifespanMonths;

    return {
      ltv: Math.round(ltv * 100) / 100,
      averageRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      averageLifespanMonths: Math.round(averageLifespanMonths * 100) / 100,
      byPlan,
    };
  }

  async getCohortMetrics(months = 12): Promise<CohortMetrics[]> {
    const cohorts: CohortMetrics[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const initialSubscribers = await this.prisma.tenant.count({
        where: {
          createdAt: { gte: cohortStart, lt: cohortEnd },
          isBlocked: false,
        },
      });

      if (initialSubscribers === 0) continue;

      const retention: Record<number, number> = {};
      const revenue: Record<number, number> = {};

      for (let m = 0; m <= i; m++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i + m, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + m + 1, 1);

        // Active subscribers from this cohort at month m
        const activeInMonth = await this.prisma.tenant.count({
          where: {
            createdAt: { gte: cohortStart, lt: cohortEnd },
            subscriptionStatus: { in: ['active', 'trialing', 'past_due'] },
            isBlocked: false,
            updatedAt: { lt: monthEnd }, // Was active by end of this month
          },
        });

        retention[m] = initialSubscribers > 0
          ? Math.round((activeInMonth / initialSubscribers) * 10000) / 100
          : 0;

        // Revenue in this month from this cohort
        const cohortTenants = await this.prisma.tenant.findMany({
          where: {
            createdAt: { gte: cohortStart, lt: cohortEnd },
            subscriptionStatus: { in: ['active', 'trialing', 'past_due'] },
            isBlocked: false,
            updatedAt: { lt: monthEnd },
          },
          select: { planType: true },
        });

        const planPrices: Record<string, number> = { free: 0, pro: 2900, enterprise: 9900 };
        let monthRevenue = 0;
        for (const t of cohortTenants) {
          monthRevenue += planPrices[t.planType] || 0;
        }
        revenue[m] = Math.round(monthRevenue / 100 * 100) / 100;
      }

      cohorts.push({
        month: cohortStart.toISOString().slice(0, 7),
        initialSubscribers,
        retention,
        revenue,
      });
    }

    return cohorts.reverse(); // Oldest first
  }

  async getFullMetrics(): Promise<SaaSMetricsSummary> {
    const [mrr, churn, ltv, cohorts] = await Promise.all([
      this.getMRRMetrics(),
      this.getChurnMetrics(),
      this.getLTVMetrics(),
      this.getCohortMetrics(12),
    ]);

    return { mrr, churn, ltv, cohorts };
  }
}