import { Types } from "mongoose";
import Notification from "../models/notificationModel";
import { NotificationEntity } from "@/domain/entities/NotificationEntity";
import { INotificationRepository } from "@/domain/repositories/INotificationRepository";

export class MongoNotificationRepository implements INotificationRepository {
    async findById(id: string | Types.ObjectId): Promise<NotificationEntity | null> {
        return await Notification.findById(id)
            .populate('actorId', 'username first_name last_name profile_image');
    }

    async findOne(filter: Record<string, any>): Promise<NotificationEntity | null> {
        return await Notification.findOne(filter)
            .populate('actorId', 'username first_name last_name profile_image');
    }

    async findAll(filter: Record<string, any> = {}): Promise<NotificationEntity[]> {
        return await Notification.find(filter)
            .populate('actorId', 'username first_name last_name profile_image')
            .sort({ createdAt: -1 });
    }

    async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
        const notification = new Notification(data);
        return await notification.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<NotificationEntity>): Promise<NotificationEntity | null> {
        return await Notification.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await Notification.findByIdAndDelete(id);
        return !!result;
    }

    async getUserNotifications(recipientId: string | Types.ObjectId, skip: number = 0, limit: number = 20): Promise<{ notifications: NotificationEntity[]; total: number; unreadCount: number }> {
        const recipientObjectId = typeof recipientId === 'string' ? new Types.ObjectId(recipientId) : recipientId;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ recipientId: recipientObjectId })
                .populate('actorId', 'username first_name last_name profile_image')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({ recipientId: recipientObjectId }),
            Notification.countDocuments({ recipientId: recipientObjectId, isRead: false }),
        ]);

        return { notifications, total, unreadCount };
    }

    async markAsRead(notificationId: string | Types.ObjectId, recipientId: string | Types.ObjectId): Promise<boolean> {
        const result = await Notification.updateOne(
            { _id: new Types.ObjectId(notificationId.toString()), recipientId: new Types.ObjectId(recipientId.toString()) },
            { $set: { isRead: true } }
        );
        return result.modifiedCount > 0;
    }

    async markAllAsRead(recipientId: string | Types.ObjectId): Promise<number> {
        const result = await Notification.updateMany(
            { recipientId: new Types.ObjectId(recipientId.toString()), isRead: false },
            { $set: { isRead: true } }
        );
        return result.modifiedCount;
    }
}
