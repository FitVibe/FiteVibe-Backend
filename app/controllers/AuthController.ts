import bcrypt from "bcrypt";
import { Request, Response } from "express";
import UserService from "../services/UserService";
import UserValidator from "@/infrastructure/validators/UserValidator";
import { UserEntity } from "@/domain/entities/UserEntity";
import { ValidatorResult } from '@/domain/validator/ValidatorResult';

export default class AuthController {
    userService: UserService;
    userValidator: UserValidator;

    constructor(userService: UserService, userValidator: UserValidator) {
        this.userService = userService;
        this.userValidator = userValidator;
    }

    signup = async (req: Request, res: Response): Promise<void> => {
        const user: UserEntity = req.body
        const result: ValidatorResult = this.userValidator.validate(user);
        if (!result.is_valid) {
            res.status(200).json({ status: "error", message: "missing properties", errors: result.messages });
            return;
        }

        const user_with_the_same_username = await this.userService.getUserByUsername(user.username);
        if (user_with_the_same_username) {
            res.status(200).json({ status: "error", message: "username already used by another user" });
            return;
        }

        const user_with_the_same_email = await this.userService.getUserByEmail(user.email);
        if (user_with_the_same_email) {
            res.status(200).json({ status: "error", message: "email already used by another user" });
            return;
        }

        const salt = bcrypt.genSaltSync();
        const hashed_passowrd = await bcrypt.hash(user.password, salt);

        const create_user = await this.userService.createUser({ ...user, password: hashed_passowrd })
        if (!create_user) {
            res.status(200).json({ status: "error", message: "Something went wrong while creating new user" });
            return;
        }

        res.status(200).json({ status: "success", data: create_user });
    }
}