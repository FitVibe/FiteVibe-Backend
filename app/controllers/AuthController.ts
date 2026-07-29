import bcrypt from "bcrypt";
import { Request, Response } from "express";
import UserService from "../services/UserService";
import UserValidator from "@/infrastructure/validators/UserValidator";
import CredentialsValidator from "@/infrastructure/validators/CredentialsValidator";
import { UserEntity } from "@/domain/entities/UserEntity";
import { ValidatorResult } from '@/domain/validator/ValidatorResult';
import passport from "passport";

export default class AuthController {
    userService: UserService;
    userValidator: UserValidator;
    credentialsValidator: CredentialsValidator

    constructor(userService: UserService, userValidator: UserValidator, credentialsValidator: CredentialsValidator) {
        this.userService = userService;
        this.userValidator = userValidator;
        this.credentialsValidator = credentialsValidator;
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

    signin = async (req: Request, res: Response, next: any): Promise<void> => {
        const credentials: CredentialsInterface = req.body
        const result: ValidatorResult = this.credentialsValidator.validate(credentials);

        if (!result.is_valid) {
            res.status(200).json({ status: "error", message: "missing properties", errors: result.messages });
            return;
        }

        passport.authenticate('local', (err: any, user: any, info: any) => {
            if (err) {
                return next(err);  
            }
            if (!user) {
                return res.status(401).json({ status: "error", message: info ? info.message : "Invalid credentials" });
            }
    
            req.logIn(user, (loginErr: any) => {
                if (loginErr) {
                    return next(loginErr);
                }
                return res.status(200).json({ status: "success", data: user });
            });
        })(req, res, next);
    }

    logout = async (req: Request, res: Response, next: any): Promise<void> => {
        req.logout((err: any) => {
            if (err) {
                return next(err);
            }
            res.status(200).json({ status: "success", message: "Logged out successfully" });
        });
    }

    currentUser = async (req: Request, res: Response): Promise<void> => {
        if (!req.user || (req.isAuthenticated && !req.isAuthenticated())) {
            res.status(401).json({ status: "error", message: "Not authenticated" });
            return;
        }
        res.status(200).json({ status: "success", data: req.user });
    }
}