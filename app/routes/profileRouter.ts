import { Router } from 'express';
import { profileController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuthenticated, profileController.getProfile);
router.patch('/', isAuthenticated, profileController.updateProfile);
router.delete('/', isAuthenticated, profileController.deleteAccount);

export default router;
