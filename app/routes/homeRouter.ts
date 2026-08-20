import { Router } from 'express';
import { homeController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuthenticated, homeController.getHome);

export default router;
