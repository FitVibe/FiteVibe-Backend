import AuthController from "./controllers/AuthController";
import { userService } from "./services";
import { userValidator } from "./validators";

export const authController = new AuthController(userService,userValidator);