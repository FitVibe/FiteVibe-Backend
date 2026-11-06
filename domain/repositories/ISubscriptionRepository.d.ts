import { Types } from "mongoose";
import { SubscriptionEntity } from "../entities/SubscriptionEntity";

export interface ISubscriptionRepository {
    findByUserId(userId: string | Types.ObjectId): Promise<SubscriptionEntity | null>;
    findByGatewayCustomerId(customerId: string): Promise<SubscriptionEntity | null>;
    findByGatewaySubscriptionId(subscriptionId: string): Promise<SubscriptionEntity | null>;
    // Backward compatibility aliases
    findByStripeCustomerId?(customerId: string): Promise<SubscriptionEntity | null>;
    findByStripeSubscriptionId?(subscriptionId: string): Promise<SubscriptionEntity | null>;
    create(data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity>;
    update(id: string | Types.ObjectId, data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity | null>;
    upsertByUserId(userId: string | Types.ObjectId, data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity>;
    delete(id: string | Types.ObjectId): Promise<boolean>;
}
