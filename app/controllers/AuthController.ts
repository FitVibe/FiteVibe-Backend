import bcrypt from "bcrypt";
import { Request, Response } from "express";
import UserService from "../services/UserService";
import UserValidator from "@/infrastructure/validators/UserValidator";
import CredentialsValidator from "@/infrastructure/validators/CredentialsValidator";
import { UserEntity } from "@/domain/entities/UserEntity";
import { ValidatorResult } from '@/domain/validator/ValidatorResult';
import { CredentialsInterface } from "@/domain/types/CredentialsInterface";
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
        res.status(200).json({ status: "success", data: req.user });
    }

    updateFcmToken = async (req: Request, res: Response): Promise<void> => {
        const { fcm_token } = req.body;

        if (!fcm_token || typeof fcm_token !== 'string') {
            res.status(400).json({ status: "error", message: "fcm_token is required" });
            return;
        }

        const user = req.user as any;
        await this.userService.updateFcmToken(user._id.toString(), fcm_token);
        res.status(200).json({ status: "success", message: "FCM token updated" });
    }

    changePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const { current_password, new_password } = req.body;
            if (!current_password || !new_password) {
                res.status(400).json({ status: "error", message: "Both current_password and new_password are required" });
                return;
            }

            if (new_password.length < 6) {
                res.status(400).json({ status: "error", message: "new_password must be at least 6 characters" });
                return;
            }

            const user = req.user as any;
            const result = await this.userService.changePassword(user._id.toString(), current_password, new_password);

            if (!result.success) {
                res.status(400).json({ status: "error", message: result.message });
                return;
            }

            res.status(200).json({ status: "success", message: result.message });
        } catch (error) {
            console.error('[AuthController] changePassword error:', error);
            res.status(500).json({ status: "error", message: "Internal server error" });
        }
    }
}