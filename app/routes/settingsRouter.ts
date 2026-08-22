import { Router } from 'express';
import { waterController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/water', isAuthenticated, waterController.getSettings);
router.put('/water', isAuthenticated, waterController.updateSettings);

export default router;
