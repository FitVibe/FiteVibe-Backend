import AuthController from "./controllers/AuthController";
import HomeController from "./controllers/HomeController";
import WaterController from "./controllers/WaterController";
import ChallengeController from "./controllers/ChallengeController";
import NotificationController from "./controllers/NotificationController";
import SettingsController from "./controllers/SettingsController";
import ProfileController from "./controllers/ProfileController";
import { userService, homeService, waterService, challengeService, challengeCommunityService, notificationService, settingsService } from "./services";
import { userValidator } from "./validators";
import { credentialsValidator } from "./validators";

export const authController = new AuthController(userService, userValidator, credentialsValidator);
export const homeController = new HomeController(homeService);
export const waterController = new WaterController(waterService);
export const challengeController = new ChallengeController(challengeService, challengeCommunityService);
export const notificationController = new NotificationController(notificationService);
export const settingsController = new SettingsController(settingsService);
export const profileController = new ProfileController(userService);