import { Schema, model } from 'mongoose';
import { SubscriptionEntity } from '@/domain/entities/SubscriptionEntity';

const subscriptionSchema = new Schema<SubscriptionEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    gateway: {
        type: String,
        default: 'stripe',
        required: true,
        index: true,
    },
    gatewayCustomerId: {
        type: String,
        required: true,
        index: true,
    },
    gatewaySubscriptionId: {
        type: String,
        required: false,
        index: true,
    },
    gatewayPriceId: {
        type: String,
        required: false,
    },
    // Backward compatibility aliases
    stripeCustomerId: {
        type: String,
        required: false,
    },
    stripeSubscriptionId: {
        type: String,
        required: false,
    },
    stripePriceId: {
        type: String,
        required: false,
    },
    tier: {
        type: String,
        enum: ['standard', 'professional', 'ultimate'],
        default: 'standard',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'],
        default: 'active',
        required: true,
    },
    currentPeriodStart: {
        type: Date,
        required: false,
    },
    currentPeriodEnd: {
        type: Date,
        required: false,
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const Subscription = model<SubscriptionEntity>('Subscription', subscriptionSchema);

export default Subscription;
