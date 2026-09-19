import { Request, Response } from 'express';
import NotificationService from '../services/NotificationService';

export default class NotificationController {
    private notificationService: NotificationService;

    constructor(notificationService: NotificationService) {
        this.notificationService = notificationService;
    }

    public getNotifications = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const skip = parseInt(req.query.skip as string || '0', 10);
            const limit = parseInt(req.query.limit as string || '20', 10);

            const result = await this.notificationService.getUserNotifications(user._id.toString(), skip, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('Error fetching user notifications:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };

    public markAsRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { id } = req.params;

            const result = await this.notificationService.markAsRead(user._id.toString(), id);
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            res.status(400).json({ message: error.message || 'Error updating notification' });
        }
    };

    public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const result = await this.notificationService.markAllAsRead(user._id.toString());
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };
}
