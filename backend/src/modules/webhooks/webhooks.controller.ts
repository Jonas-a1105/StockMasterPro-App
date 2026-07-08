import { Controller, Post, Headers, Req, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import type { Request } from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new HttpException('Missing stripe-signature header', HttpStatus.BAD_REQUEST);
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new HttpException('Webhook secret not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody as string,
        signature,
        webhookSecret,
      );
    } catch {
      throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
    }

    if (!event.type) {
      throw new HttpException('Invalid webhook event', HttpStatus.BAD_REQUEST);
    }

    try {
      const object = event.data.object as any;

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          await this.prisma.tenant.updateMany({
            where: { stripeCustomerId: object.customer },
            data: {
              planType: object.items?.data?.[0]?.price?.nickname || 'pro',
              subscriptionStatus: object.status === 'active' ? 'active' : object.status === 'past_due' ? 'past_due' : 'canceled',
              isBlocked: false,
              licenseExpiresAt: new Date(object.current_period_end * 1000),
            },
          });
          break;
        }
        case 'customer.subscription.deleted': {
          await this.prisma.tenant.updateMany({
            where: { stripeCustomerId: object.customer },
            data: { subscriptionStatus: 'canceled', isBlocked: true },
          });
          break;
        }
        case 'invoice.payment_succeeded': {
          await this.prisma.tenant.updateMany({
            where: { stripeCustomerId: object.customer },
            data: { subscriptionStatus: 'active', isBlocked: false },
          });
          break;
        }
        case 'invoice.payment_failed': {
          await this.prisma.tenant.updateMany({
            where: { stripeCustomerId: object.customer },
            data: { subscriptionStatus: 'past_due' },
          });
          break;
        }
      }
      return { received: true };
    } catch (err) {
      console.error('Webhook error:', err);
      throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
