import { SubscriptionTier, SubscriptionStatus } from "@/domain/entities/SubscriptionEntity";

export interface InitPaymentParams {
    userId: string;
    userEmail: string;
    userName: string;
    planId: SubscriptionTier;
    planName: string;
    amountInCents: number;
    existingCustomerId?: string;
}

export interface InitPaymentResult {
    gateway: string;
    customerId: string;
    subscriptionId: string;
    /**
     * Gateway-specific payload needed by the client-side mobile SDK
     * (e.g. for Stripe: { paymentIntentClientSecret, customerEphemeralKeySecret, publishableKey },
     *  for PayPal: { orderId, approvalUrl }, etc.)
     */
    clientPayload: Record<string, any>;
}

export interface WebhookEventPayload {
    eventType: 'payment_succeeded' | 'subscription_updated' | 'subscription_canceled' | 'payment_failed' | 'other';
    userId?: string;
    customerId?: string;
    subscriptionId?: string;
    planId?: SubscriptionTier;
    status?: SubscriptionStatus;
    periodStart?: Date;
    periodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    rawEvent?: any;
}

export interface IPaymentGateway {
    readonly name: string;
    initPayment(params: InitPaymentParams): Promise<InitPaymentResult>;
    cancelSubscription(externalSubscriptionId: string): Promise<boolean>;
    verifyAndParseWebhook(rawBody: Buffer | string | any, signature: string, headers?: Record<string, any>): Promise<WebhookEventPayload>;
}
