import { Types } from "mongoose";
import Subscription from "../models/subscriptionModel";
import { SubscriptionEntity } from "@/domain/entities/SubscriptionEntity";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";

export class MongoSubscriptionRepository implements ISubscriptionRepository {
    async findByUserId(userId: string | Types.ObjectId): Promise<SubscriptionEntity | null> {
        return await Subscription.findOne({ userId: new Types.ObjectId(userId) });
    }

    async findByGatewayCustomerId(customerId: string): Promise<SubscriptionEntity | null> {
        return await Subscription.findOne({
            $or: [
                { gatewayCustomerId: customerId },
                { stripeCustomerId: customerId },
            ]
        });
    }

    async findByGatewaySubscriptionId(subscriptionId: string): Promise<SubscriptionEntity | null> {
        return await Subscription.findOne({
            $or: [
                { gatewaySubscriptionId: subscriptionId },
                { stripeSubscriptionId: subscriptionId },
            ]
        });
    }

    // Backward compatibility aliases
    async findByStripeCustomerId(customerId: string): Promise<SubscriptionEntity | null> {
        return await this.findByGatewayCustomerId(customerId);
    }

    async findByStripeSubscriptionId(subscriptionId: string): Promise<SubscriptionEntity | null> {
        return await this.findByGatewaySubscriptionId(subscriptionId);
    }

    async create(data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity> {
        const sub = new Subscription(data);
        return await sub.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity | null> {
        return await Subscription.findByIdAndUpdate(id, data, { new: true });
    }

    async upsertByUserId(userId: string | Types.ObjectId, data: Partial<SubscriptionEntity>): Promise<SubscriptionEntity> {
        const userObjId = new Types.ObjectId(userId);
        return (await Subscription.findOneAndUpdate(
            { userId: userObjId },
            { $set: data },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ))!;
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await Subscription.findByIdAndDelete(id);
        return !!result;
    }
}
