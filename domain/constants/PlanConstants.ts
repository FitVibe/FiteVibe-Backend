import { SubscriptionTier } from "@/domain/entities/SubscriptionEntity";

export interface PlanFeature {
    title: string;
    included: boolean;
}

export interface PlanDefinition {
    id: SubscriptionTier;
    name: string;
    priceMonthly: number;
    currency: string;
    isFree: boolean;
    stripePriceEnvKey?: string;
    features: {
        gymPlanMadeBySystem: boolean;
        gymPlanTailoredToYou: boolean;
        dietPlanTailoredToYou: boolean;
        participateForums: boolean;
        chatFeature: boolean;
        participateChallenges: boolean;
        trackingCalories: boolean;
        waterReminder: boolean;
    };
    featureList: PlanFeature[];
}

export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
    standard: {
        id: 'standard',
        name: 'STANDARD',
        priceMonthly: 0,
        currency: 'usd',
        isFree: true,
        features: {
            gymPlanMadeBySystem: true,
            gymPlanTailoredToYou: false,
            dietPlanTailoredToYou: false,
            participateForums: true,
            chatFeature: false,
            participateChallenges: false,
            trackingCalories: false,
            waterReminder: true,
        },
        featureList: [
            { title: 'Access to gym plan made by system', included: true },
            { title: 'Access to a gym plan tailored to you', included: false },
            { title: 'Access to a diet plan tailored to you', included: false },
            { title: 'Participate forums', included: true },
            { title: 'Chat feature', included: false },
            { title: 'Participate challenges', included: false },
            { title: 'Tracking calories', included: false },
            { title: 'Water reminder', included: true },
        ],
    },
    professional: {
        id: 'professional',
        name: 'PROFESSIONAL',
        priceMonthly: 45,
        currency: 'usd',
        isFree: false,
        stripePriceEnvKey: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
        features: {
            gymPlanMadeBySystem: true,
            gymPlanTailoredToYou: true,
            dietPlanTailoredToYou: false,
            participateForums: true,
            chatFeature: true,
            participateChallenges: false,
            trackingCalories: true,
            waterReminder: true,
        },
        featureList: [
            { title: 'Access to gym plan made by system', included: true },
            { title: 'Access to a gym plan tailored to you', included: true },
            { title: 'Access to a diet plan tailored to you', included: false },
            { title: 'Participate forums', included: true },
            { title: 'Chat feature', included: true },
            { title: 'Participate challenges', included: false },
            { title: 'Tracking calories', included: true },
            { title: 'Water reminder', included: true },
        ],
    },
    ultimate: {
        id: 'ultimate',
        name: 'ULTIMATE',
        priceMonthly: 60,
        currency: 'usd',
        isFree: false,
        stripePriceEnvKey: 'STRIPE_PRICE_ULTIMATE_MONTHLY',
        features: {
            gymPlanMadeBySystem: true,
            gymPlanTailoredToYou: true,
            dietPlanTailoredToYou: true,
            participateForums: true,
            chatFeature: true,
            participateChallenges: true,
            trackingCalories: true,
            waterReminder: true,
        },
        featureList: [
            { title: 'Access to gym plan made by system', included: true },
            { title: 'Access to a gym plan tailored to you', included: true },
            { title: 'Access to a diet plan tailored to you', included: true },
            { title: 'Participate forums', included: true },
            { title: 'Chat feature', included: true },
            { title: 'Participate challenges', included: true },
            { title: 'Tracking calories', included: true },
            { title: 'Water reminder', included: true },
        ],
    },
};

export function canAccessTailoredGym(tier?: SubscriptionTier): boolean {
    return tier === 'professional' || tier === 'ultimate';
}

export function canAccessTailoredDiet(tier?: SubscriptionTier): boolean {
    return tier === 'ultimate';
}

export function canAccessChat(tier?: SubscriptionTier): boolean {
    return tier === 'professional' || tier === 'ultimate';
}

export function canAccessChallenges(tier?: SubscriptionTier): boolean {
    return tier === 'ultimate';
}

export function canTrackCalories(tier?: SubscriptionTier): boolean {
    return tier === 'professional' || tier === 'ultimate';
}
