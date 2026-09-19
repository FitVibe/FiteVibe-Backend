import { IBaseRepository } from "./IBaseRepository";
import { NotificationEntity } from "@/domain/entities/NotificationEntity";
import { Types } from "mongoose";

export interface INotificationRepository extends IBaseRepository<NotificationEntity> {
    getUserNotifications(recipientId: string | Types.ObjectId, skip?: number, limit?: number): Promise<{ notifications: NotificationEntity[]; total: number; unreadCount: number }>;
    markAsRead(notificationId: string | Types.ObjectId, recipientId: string | Types.ObjectId): Promise<boolean>;
    markAllAsRead(recipientId: string | Types.ObjectId): Promise<number>;
}
