import { Router } from 'express';
import { notificationController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuthenticated, notificationController.getNotifications);
router.patch('/read-all', isAuthenticated, notificationController.markAllAsRead);
router.patch('/:id/read', isAuthenticated, notificationController.markAsRead);

export default router;
