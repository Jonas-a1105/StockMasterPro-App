import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import Stripe from 'stripe';

const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
};

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', { apiVersion: '2026-06-24.dahlia' as any });
  }

  async getOrCreateCustomer(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant no encontrado');
    if (tenant.stripeCustomerId) return tenant.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      name: tenant.name,
      metadata: { tenantId },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createSubscription(tenantId: string, planType: string, returnUrl: string) {
    const customerId = await this.getOrCreateCustomer(tenantId);
    const priceId = PRICE_IDS[planType];
    if (!priceId) throw new HttpException('Plan inválido', HttpStatus.BAD_REQUEST);

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { tenantId, planType },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeSubscriptionId: subscription.id, planType },
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent as any;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || null,
      planType,
    };
  }

  async cancelSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant no encontrado');

    if (tenant.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: 'canceled', isBlocked: true },
    });

    return { message: 'Suscripción cancelada en Stripe' };
  }

  async createPortalSession(tenantId: string, returnUrl: string) {
    const customerId = await this.getOrCreateCustomer(tenantId);
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url };
  }
}
