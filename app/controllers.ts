import AuthController from "./controllers/AuthController";
import { userService } from "./services";
import { userValidator } from "./validators";
import { credentialsValidator } from "./validators";

export const authController = new AuthController(userService,userValidator, credentialsValidator);