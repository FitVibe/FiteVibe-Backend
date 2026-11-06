import { Document, Types } from "mongoose";

export type SubscriptionTier = 'standard' | 'professional' | 'ultimate';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface SubscriptionEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    gateway: string; // e.g. 'stripe', 'paypal', 'apple_pay'
    gatewayCustomerId: string;
    gatewaySubscriptionId?: string;
    gatewayPriceId?: string;
    // Backward compatibility aliases
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
