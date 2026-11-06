import { stripe, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY } from "@/infrastructure/stripe/stripeClient";
import { IPaymentGateway, InitPaymentParams, InitPaymentResult, WebhookEventPayload } from "@/domain/gateways/IPaymentGateway";
import { PLANS } from "@/domain/constants/PlanConstants";
import { SubscriptionTier } from "@/domain/entities/SubscriptionEntity";

export class StripePaymentGateway implements IPaymentGateway {
    public readonly name = 'stripe';
    private productCache: Map<string, string> = new Map();

    /**
     * Resolves an existing Stripe Product or creates one dynamically in Test Mode.
     */
    private async getOrCreateProduct(planId: string, planName: string): Promise<string> {
        if (this.productCache.has(planId)) {
            return this.productCache.get(planId)!;
        }

        const expectedName = `FitVibe ${planName} Membership`;
        const products = await stripe.products.list({ limit: 20, active: true });
        const existing = products.data.find(p => p.metadata?.planId === planId || p.name === expectedName);

        if (existing) {
            this.productCache.set(planId, existing.id);
            return existing.id;
        }

        const created = await stripe.products.create({
            name: expectedName,
            metadata: { planId },
        });

        this.productCache.set(planId, created.id);
        return created.id;
    }

    /**
     * Initializes a Stripe in-app subscription for mobile PaymentSheet.
     */
    public async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
        const { userId, userEmail, userName, planId, planName, amountInCents, existingCustomerId } = params;

        // 1. Get or create Stripe Customer
        let customerId = existingCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                name: userName,
                metadata: {
                    userId,
                },
            });
            customerId = customer.id;
        }

        // 2. Generate Ephemeral Key for mobile PaymentSheet
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2024-06-20' as any }
        );

        // 3. Resolve configured Stripe Price ID or fallback to dynamic price_data with product ID
        const plan = PLANS[planId];
        const envPriceKey = plan?.stripePriceEnvKey ? process.env[plan.stripePriceEnvKey] : undefined;

        let priceItem: any;
        if (envPriceKey) {
            priceItem = { price: envPriceKey };
        } else {
            const productId = await this.getOrCreateProduct(planId, planName);
            priceItem = {
                price_data: {
                    currency: 'usd',
                    product: productId,
                    recurring: {
                        interval: 'month',
                    },
                    unit_amount: amountInCents,
                },
            };
        }

        // 4. Create incomplete Subscription expanding payment_intent for native sheet
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [priceItem],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId,
                planId,
            },
        });

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent;

        if (!paymentIntent || !paymentIntent.client_secret) {
            throw new Error('[StripePaymentGateway] Failed to generate payment intent client secret');
        }

        return {
            gateway: this.name,
            customerId: customerId,
            subscriptionId: subscription.id,
            clientPayload: {
                paymentIntentClientSecret: paymentIntent.client_secret,
                customerEphemeralKeySecret: ephemeralKey.secret || '',
                customerId: customerId,
                publishableKey: STRIPE_PUBLISHABLE_KEY,
            },
        };
    }

    /**
     * Cancels subscription in Stripe.
     */
    public async cancelSubscription(externalSubscriptionId: string): Promise<boolean> {
        try {
            await stripe.subscriptions.cancel(externalSubscriptionId);
            return true;
        } catch (err: any) {
            console.warn('[StripePaymentGateway] Error canceling subscription in Stripe:', err.message);
            return false;
        }
    }

    /**
     * Verifies Stripe webhook cryptographic signature and normalizes into domain WebhookEventPayload.
     */
    public async verifyAndParseWebhook(
        rawBody: Buffer | string | any,
        signature: string,
        headers?: Record<string, any>
    ): Promise<WebhookEventPayload> {
        let event: any;

        try {
            event = stripe.webhooks.constructEvent(
                rawBody as any,
                signature,
                STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error('[StripePaymentGateway] Webhook signature verification failed:', err.message);
            throw new Error(`[StripePaymentGateway] Invalid signature: ${err.message}`);
        }

        switch (event.type) {
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subscriptionId =
                    (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id) ||
                    invoice.parent?.subscription_details?.subscription ||
                    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

                let userId: string | undefined =
                    invoice.parent?.subscription_details?.metadata?.userId ||
                    invoice.lines?.data?.[0]?.metadata?.userId ||
                    invoice.metadata?.userId;
                let planId: SubscriptionTier | undefined =
                    (invoice.parent?.subscription_details?.metadata?.planId as SubscriptionTier) ||
                    (invoice.lines?.data?.[0]?.metadata?.planId as SubscriptionTier) ||
                    (invoice.metadata?.planId as SubscriptionTier) ||
                    'professional';
                let periodStart: Date | undefined = invoice.period_start ? new Date(invoice.period_start * 1000) : undefined;
                let periodEnd: Date | undefined = invoice.period_end ? new Date(invoice.period_end * 1000) : undefined;
                let cancelAtPeriodEnd = false;

                if (subscriptionId && !userId) {
                    try {
                        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
                        userId = stripeSub.metadata?.userId;
                        planId = (stripeSub.metadata?.planId as SubscriptionTier) || planId || 'professional';
                        periodStart = (stripeSub as any).current_period_start
                            ? new Date((stripeSub as any).current_period_start * 1000)
                            : (periodStart || new Date());
                        periodEnd = (stripeSub as any).current_period_end
                            ? new Date((stripeSub as any).current_period_end * 1000)
                            : (periodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
                        cancelAtPeriodEnd = stripeSub.cancel_at_period_end || false;
                    } catch (e: any) {
                        console.warn('[StripePaymentGateway] Could not retrieve subscription during invoice success:', e.message);
                    }
                }

                return {
                    eventType: 'payment_succeeded',
                    userId,
                    customerId,
                    subscriptionId,
                    planId,
                    status: 'active',
                    periodStart,
                    periodEnd,
                    cancelAtPeriodEnd,
                    rawEvent: event,
                };
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const userId = subscription.metadata?.userId;
                const planId = (subscription.metadata?.planId as SubscriptionTier) || 'professional';
                const status = subscription.status;
                const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

                const periodStart = subscription.current_period_start
                    ? new Date(subscription.current_period_start * 1000)
                    : undefined;
                const periodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : undefined;

                return {
                    eventType: 'subscription_updated',
                    userId,
                    customerId,
                    subscriptionId: subscription.id,
                    planId,
                    status: status as any,
                    periodStart,
                    periodEnd,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                    rawEvent: event,
                };
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
                return {
                    eventType: 'subscription_canceled',
                    userId: subscription.metadata?.userId,
                    customerId,
                    subscriptionId: subscription.id,
                    status: 'canceled',
                    cancelAtPeriodEnd: true,
                    rawEvent: event,
                };
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const subscriptionId =
                    (typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id) ||
                    invoice.parent?.subscription_details?.subscription;
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
                return {
                    eventType: 'payment_failed',
                    customerId,
                    subscriptionId,
                    status: 'past_due',
                    rawEvent: event,
                };
            }

            default:
                return {
                    eventType: 'other',
                    rawEvent: event,
                };
        }
    }
}
