import AuthController from "./controllers/AuthController";
import HomeController from "./controllers/HomeController";
import { userService, homeService } from "./services";
import { userValidator } from "./validators";
import { credentialsValidator } from "./validators";

export const authController = new AuthController(userService,userValidator, credentialsValidator);
export const homeController = new HomeController(homeService);