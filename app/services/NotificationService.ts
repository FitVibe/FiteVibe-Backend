import { INotificationRepository } from "@/domain/repositories/INotificationRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { sendPushNotification } from "@/infrastructure/firebase/firebaseAdmin";
import { Types } from "mongoose";

export default class NotificationService {
    private notificationRepo: INotificationRepository;
    private userRepo: IUserRepository;

    constructor(
        notificationRepo: INotificationRepository,
        userRepo: IUserRepository
    ) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
    }

    /**
     * Persists in DB and sends FCM push notification for a post reaction.
     */
    public async notifyPostReaction(
        authorId: string,
        actorId: string,
        postId: string,
        challengeId: string,
        reactionType: string = 'like'
    ) {
        if (!authorId || !actorId || authorId === actorId) {
            return null;
        }

        const [authorUser, actorUser] = await Promise.all([
            this.userRepo.findById(authorId),
            this.userRepo.findById(actorId),
        ]);

        const actorName = `${actorUser?.first_name || actorUser?.username || 'أحد المستخدمين'}`.trim();
        const emojiMap: Record<string, string> = {
            like: '❤️',
            fire: '🔥',
            clap: '👏',
            muscle: '💪',
        };
        const emoji = emojiMap[reactionType] || '❤️';

        const title = 'تفاعل جديد على منشورك!';
        const body = `${actorName} تفاعل مع منشورك بـ ${emoji}`;

        // 1. Save Notification to MongoDB
        const notification = await this.notificationRepo.create({
            recipientId: new Types.ObjectId(authorId),
            actorId: new Types.ObjectId(actorId),
            type: 'post_reaction',
            title,
            body,
            isRead: false,
            metadata: { postId, challengeId, reactionType },
        });

        // 2. Send FCM Push Notification
        if (authorUser && authorUser.fcm_device_token) {
            await sendPushNotification(
                authorUser.fcm_device_token,
                title,
                body,
                { type: 'post_reaction', postId, challengeId, notificationId: notification._id!.toString() }
            );
        }

        return notification;
    }

    /**
     * Persists in DB and sends FCM push notification for a post comment.
     */
    public async notifyPostComment(
        authorId: string,
        actorId: string,
        postId: string,
        challengeId: string,
        commentContent: string
    ) {
        if (!authorId || !actorId || authorId === actorId) {
            return null;
        }

        const [authorUser, actorUser] = await Promise.all([
            this.userRepo.findById(authorId),
            this.userRepo.findById(actorId),
        ]);

        const actorName = `${actorUser?.first_name || actorUser?.username || 'أحد المستخدمين'}`.trim();
        const snippet = commentContent.length > 40 ? `${commentContent.substring(0, 40)}...` : commentContent;

        const title = 'تعليق جديد على منشورك!';
        const body = `${actorName}: "${snippet}"`;

        // 1. Save Notification to MongoDB
        const notification = await this.notificationRepo.create({
            recipientId: new Types.ObjectId(authorId),
            actorId: new Types.ObjectId(actorId),
            type: 'post_comment',
            title,
            body,
            isRead: false,
            metadata: { postId, challengeId, commentSnippet: snippet },
        });

        // 2. Send FCM Push Notification
        if (authorUser && authorUser.fcm_device_token) {
            await sendPushNotification(
                authorUser.fcm_device_token,
                title,
                body,
                { type: 'post_comment', postId, challengeId, notificationId: notification._id!.toString() }
            );
        }

        return notification;
    }

    /**
     * Fetches paginated user notifications from DB.
     */
    public async getUserNotifications(userId: string, skip: number = 0, limit: number = 20) {
        const { notifications, total, unreadCount } = await this.notificationRepo.getUserNotifications(userId, skip, limit);

        const formatted = notifications.map(n => ({
            _id: n._id,
            type: n.type,
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            actor: n.actorId ? {
                _id: (n.actorId as any)?._id || n.actorId,
                username: (n.actorId as any)?.username || 'User',
                fullName: `${(n.actorId as any)?.first_name || ''} ${(n.actorId as any)?.last_name || ''}`.trim(),
                profileImage: (n.actorId as any)?.profile_image || '',
            } : null,
            metadata: n.metadata || null,
            createdAt: n.createdAt,
        }));

        return {
            notifications: formatted,
            total,
            unreadCount,
            skip,
            limit,
            hasMore: skip + notifications.length < total,
        };
    }

    /**
     * Marks a specific notification as read.
     */
    public async markAsRead(userId: string, notificationId: string) {
        const success = await this.notificationRepo.markAsRead(notificationId, userId);
        if (!success) {
            throw new Error('Notification not found or unauthorized');
        }
        return { success: true };
    }

    /**
     * Marks all user notifications as read.
     */
    public async markAllAsRead(userId: string) {
        const count = await this.notificationRepo.markAllAsRead(userId);
        return { updatedCount: count };
    }
}
