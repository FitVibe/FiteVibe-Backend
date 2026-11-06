import { Router } from 'express';
import { subscriptionController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

// Authenticated client subscription management endpoints
router.get('/plans', isAuthenticated, subscriptionController.getPlans);
router.get('/current', isAuthenticated, subscriptionController.getCurrentSubscription);
router.post('/payment-sheet', isAuthenticated, subscriptionController.createPaymentSheet);
router.post('/cancel', isAuthenticated, subscriptionController.cancelSubscription);

export default router;
