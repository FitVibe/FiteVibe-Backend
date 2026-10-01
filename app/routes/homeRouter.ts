import { Router } from 'express';
import { homeController } from '../controllers';
import { waterController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', isAuthenticated, homeController.getHome);
router.get('/planners', isAuthenticated, homeController.getPlannersList);
router.get('/planner/:plannerId', isAuthenticated, homeController.getPlannerDetails);
router.post('/water/add', isAuthenticated, waterController.addWater);
router.post('/meals/log', isAuthenticated, homeController.logMeal);
router.post('/workout/complete', isAuthenticated, homeController.completeWorkout);

export default router;
