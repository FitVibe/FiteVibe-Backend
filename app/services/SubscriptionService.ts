import { Types } from "mongoose";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { PLANS } from "@/domain/constants/PlanConstants";
import { SubscriptionTier } from "@/domain/entities/SubscriptionEntity";
import { IPaymentGateway, InitPaymentResult } from "@/domain/gateways/IPaymentGateway";

export interface PaymentInitResponse {
    gateway: string;
    customerId: string;
    subscriptionId: string;
    /**
     * Generic client payload for the mobile SDK (Stripe, PayPal, etc.)
     */
    clientPayload: Record<string, any>;
    // Generic index signature for backward compatibility
    [key: string]: any;
}

export type PaymentSheetResponse = PaymentInitResponse;

export default class SubscriptionService {
    private subscriptionRepo: ISubscriptionRepository;
    private userRepo: IUserRepository;
    private paymentGateway: IPaymentGateway;

    constructor(
        subscriptionRepo: ISubscriptionRepository,
        userRepo: IUserRepository,
        paymentGateway: IPaymentGateway
    ) {
        this.subscriptionRepo = subscriptionRepo;
        this.userRepo = userRepo;
        this.paymentGateway = paymentGateway;
    }

    /**
     * Lists all available plans with user's current subscription tier.
     */
    public async getPlans(userId: string) {
        const user = await this.userRepo.findById(userId);
        const currentTier = user?.subscriptionTier || 'standard';

        const plansFormatted = Object.values(PLANS).map((plan) => ({
            ...plan,
            isCurrent: plan.id === currentTier,
        }));

        return {
            plans: plansFormatted,
            currentTier,
            subscriptionStatus: user?.subscriptionStatus || 'active',
            activeGateway: this.paymentGateway.name,
        };
    }

    /**
     * Retrieves current active subscription details for the client.
     */
    public async getCurrentSubscription(userId: string) {
        const user = await this.userRepo.findById(userId);
        const subscription = await this.subscriptionRepo.findByUserId(userId);
        const currentTier = user?.subscriptionTier || 'standard';
        const planDetails = PLANS[currentTier] || PLANS.standard;

        return {
            tier: currentTier,
            status: subscription?.status || user?.subscriptionStatus || 'active',
            plan: planDetails,
            gateway: subscription?.gateway || this.paymentGateway.name,
            subscriptionDetails: subscription ? {
                gateway: subscription.gateway || this.paymentGateway.name,
                gatewayCustomerId: subscription.gatewayCustomerId || subscription.stripeCustomerId,
                gatewaySubscriptionId: subscription.gatewaySubscriptionId || subscription.stripeSubscriptionId,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            } : null,
        };
    }

    /**
     * Prepares in-app payment initialization by delegating to the active IPaymentGateway Strategy.
     */
    public async createPaymentSheetData(userId: string, planId: SubscriptionTier): Promise<PaymentInitResponse> {
        if (planId !== 'professional' && planId !== 'ultimate') {
            throw new Error('Only paid plans (Professional or Ultimate) require payment');
        }

        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const plan = PLANS[planId];
        if (!plan) {
            throw new Error('Invalid plan selected');
        }

        const existingSub = await this.subscriptionRepo.findByUserId(userId);
        const existingCustomerId = existingSub?.gatewayCustomerId || existingSub?.stripeCustomerId;

        // Delegate payment initialization to Strategy
        const initResult: InitPaymentResult = await this.paymentGateway.initPayment({
            userId: user._id?.toString() || userId,
            userEmail: user.email,
            userName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
            planId,
            planName: plan.name,
            amountInCents: plan.priceMonthly * 100,
            existingCustomerId,
        });

        // Store pending subscription in database with generic attributes
        await this.subscriptionRepo.upsertByUserId(userId, {
            userId: new Types.ObjectId(userId) as any,
            gateway: initResult.gateway,
            gatewayCustomerId: initResult.customerId,
            gatewaySubscriptionId: initResult.subscriptionId,
            stripeCustomerId: initResult.customerId,
            stripeSubscriptionId: initResult.subscriptionId,
            tier: planId,
            status: 'incomplete',
            cancelAtPeriodEnd: false,
        });

        return {
            gateway: initResult.gateway,
            customerId: initResult.customerId,
            subscriptionId: initResult.subscriptionId,
            clientPayload: initResult.clientPayload,
            // Spreads gateway-specific keys (paymentIntentClientSecret, etc.) for client convenience
            ...initResult.clientPayload,
        };
    }

    /**
     * Cancels subscription via active gateway and immediately reverts user to standard tier.
     */
    public async cancelSubscription(userId: string) {
        const sub = await this.subscriptionRepo.findByUserId(userId);
        const externalSubscriptionId = sub?.gatewaySubscriptionId || sub?.stripeSubscriptionId;

        if (!sub || !externalSubscriptionId) {
            throw new Error('No active subscription found to cancel');
        }

        // Delegate cancellation to Strategy
        await this.paymentGateway.cancelSubscription(externalSubscriptionId);

        // Update database records
        await this.subscriptionRepo.update(sub._id!, {
            status: 'canceled',
            cancelAtPeriodEnd: true,
        });

        await this.userRepo.update(userId, {
            subscriptionTier: 'standard',
            subscriptionStatus: 'canceled',
        });

        return {
            success: true,
            message: 'Subscription canceled successfully. Access reverted to Standard Free tier.',
        };
    }

    /**
     * Handles Webhook events in a gateway-agnostic manner.
     */
    public async handleWebhook(rawBody: Buffer | string, signature: string, headers?: Record<string, any>) {
        // Delegate verification and normalization to Strategy
        const event = await this.paymentGateway.verifyAndParseWebhook(rawBody, signature, headers);

        console.log(`[SubscriptionService] Processing normalized webhook event: ${event.eventType} (Gateway: ${this.paymentGateway.name})`);

        switch (event.eventType) {
            case 'payment_succeeded': {
                const { userId, customerId, subscriptionId, planId, periodStart, periodEnd, cancelAtPeriodEnd } = event;

                let targetUserId = userId;
                if (!targetUserId && subscriptionId) {
                    const existingSub = await this.subscriptionRepo.findByGatewaySubscriptionId(subscriptionId);
                    targetUserId = existingSub?.userId?.toString();
                }

                if (targetUserId) {
                    const activePlan = planId || 'professional';

                    await this.subscriptionRepo.upsertByUserId(targetUserId, {
                        userId: new Types.ObjectId(targetUserId) as any,
                        gateway: this.paymentGateway.name,
                        gatewayCustomerId: customerId || '',
                        gatewaySubscriptionId: subscriptionId,
                        stripeCustomerId: customerId || '',
                        stripeSubscriptionId: subscriptionId,
                        tier: activePlan,
                        status: 'active',
                        currentPeriodStart: periodStart || new Date(),
                        currentPeriodEnd: periodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        cancelAtPeriodEnd: cancelAtPeriodEnd || false,
                    });

                    await this.userRepo.update(targetUserId, {
                        subscriptionTier: activePlan,
                        subscriptionStatus: 'active',
                    });

                    console.log(`[SubscriptionService] Activated ${activePlan} tier for user ${targetUserId}`);
                }
                break;
            }

            case 'subscription_updated': {
                const { userId, subscriptionId, planId, status, periodStart, periodEnd, cancelAtPeriodEnd } = event;

                let subDoc = null;
                if (userId) {
                    subDoc = await this.subscriptionRepo.findByUserId(userId);
                } else if (subscriptionId) {
                    subDoc = await this.subscriptionRepo.findByGatewaySubscriptionId(subscriptionId);
                }

                if (subDoc) {
                    const targetUserId = subDoc.userId.toString();
                    const isStillActive = status === 'active' || status === 'trialing';
                    const targetTier = isStillActive ? (planId || subDoc.tier) : 'standard';

                    await this.subscriptionRepo.update(subDoc._id!, {
                        status: status || 'active',
                        tier: targetTier,
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: cancelAtPeriodEnd || false,
                    });

                    await this.userRepo.update(targetUserId, {
                        subscriptionTier: targetTier,
                        subscriptionStatus: status,
                    });

                    console.log(`[SubscriptionService] Updated subscription status to ${status} for user ${targetUserId}`);
                }
                break;
            }

            case 'subscription_canceled': {
                const { userId, subscriptionId } = event;

                let subDoc = null;
                if (userId) {
                    subDoc = await this.subscriptionRepo.findByUserId(userId);
                } else if (subscriptionId) {
                    subDoc = await this.subscriptionRepo.findByGatewaySubscriptionId(subscriptionId);
                }

                if (subDoc) {
                    const targetUserId = subDoc.userId.toString();

                    await this.subscriptionRepo.update(subDoc._id!, {
                        status: 'canceled',
                        tier: 'standard',
                        cancelAtPeriodEnd: true,
                    });

                    await this.userRepo.update(targetUserId, {
                        subscriptionTier: 'standard',
                        subscriptionStatus: 'canceled',
                    });

                    console.log(`[SubscriptionService] Reverted user ${targetUserId} to standard tier upon cancellation`);
                }
                break;
            }

            case 'payment_failed': {
                const { subscriptionId } = event;

                if (subscriptionId) {
                    const subDoc = await this.subscriptionRepo.findByGatewaySubscriptionId(subscriptionId);
                    if (subDoc) {
                        const targetUserId = subDoc.userId.toString();
                        await this.subscriptionRepo.update(subDoc._id!, { status: 'past_due' });
                        await this.userRepo.update(targetUserId, { subscriptionStatus: 'past_due' });
                        console.warn(`[SubscriptionService] Payment failed for user ${targetUserId}`);
                    }
                }
                break;
            }

            default:
                console.log(`[SubscriptionService] Unhandled normalized event type: ${event.eventType}`);
        }

        return { received: true };
    }
}
