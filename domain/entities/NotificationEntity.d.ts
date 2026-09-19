import { Document, Types } from "mongoose";

export interface NotificationEntity extends Document {
    _id?: Types.ObjectId;
    recipientId: Types.ObjectId;
    actorId?: Types.ObjectId;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
