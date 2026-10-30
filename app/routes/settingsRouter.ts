import { Router } from 'express';
import { waterController, settingsController } from '../controllers';
import { isAuthenticated } from '../middlewares/authMiddleware';

const router = Router();

// Aggregated settings (all settings unless profile personal info)
router.get('/', isAuthenticated, settingsController.getAllSettings);

// Water hydration settings
router.get('/water', isAuthenticated, waterController.getSettings);
router.put('/water', isAuthenticated, waterController.updateSettings);

// Notification settings
router.put('/notifications', isAuthenticated, settingsController.updateNotificationSettings);

// App preferences (language, sound, haptics)
router.put('/preferences', isAuthenticated, settingsController.updatePreferenceSettings);

export default router;
