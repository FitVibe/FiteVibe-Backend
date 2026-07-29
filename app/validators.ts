import UserValidator from "@/infrastructure/validators/UserValidator";
import CredentialsValidator from "@/infrastructure/validators/CredentialsValidator";

export const userValidator = new UserValidator();
export const credentialsValidator = new CredentialsValidator();