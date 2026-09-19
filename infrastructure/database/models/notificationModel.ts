import { Schema, model } from 'mongoose';
import { NotificationEntity } from '@/domain/entities/NotificationEntity';

const notificationSchema = new Schema<NotificationEntity>({
    recipientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    actorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    type: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
        required: false,
    },
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, createdAt: -1 });

const Notification = model<NotificationEntity>('Notification', notificationSchema);

export default Notification;
