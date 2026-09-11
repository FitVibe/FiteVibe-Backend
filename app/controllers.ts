import AuthController from "./controllers/AuthController";
import HomeController from "./controllers/HomeController";
import WaterController from "./controllers/WaterController";
import ChallengeController from "./controllers/ChallengeController";
import { userService, homeService, waterService, challengeService, challengeCommunityService } from "./services";
import { userValidator } from "./validators";
import { credentialsValidator } from "./validators";

export const authController = new AuthController(userService, userValidator, credentialsValidator);
export const homeController = new HomeController(homeService);
export const waterController = new WaterController(waterService);
export const challengeController = new ChallengeController(challengeService, challengeCommunityService);