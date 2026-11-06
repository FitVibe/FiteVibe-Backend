import Stripe from 'stripe';
import 'dotenv/config';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fitvibe_placeholder';

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20' as any,
    typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_fitvibe_placeholder';
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_fitvibe_placeholder';
