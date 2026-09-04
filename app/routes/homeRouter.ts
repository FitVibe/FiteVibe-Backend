import { Router } from 'express';
import { homeController } from '../controllers';
import { waterController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuthenticated, homeController.getHome);
router.post('/water/add', isAuthenticated, waterController.addWater);
router.post('/meals/log', isAuthenticated, homeController.logMeal);

export default router;
