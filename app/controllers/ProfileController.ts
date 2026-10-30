import { Request, Response } from 'express';
import UserService from '../services/UserService';

export default class ProfileController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const profile = await this.userService.getProfile(user._id.toString());
            if (!profile) {
                res.status(404).json({ status: 'error', message: 'Profile not found' });
                return;
            }
            res.status(200).json({ status: 'success', data: profile });
        } catch (error) {
            console.error('[ProfileController] getProfile error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };

    public updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const updated = await this.userService.updateProfile(user._id.toString(), req.body);
            res.status(200).json({ status: 'success', data: updated });
        } catch (error) {
            console.error('[ProfileController] updateProfile error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };

    public deleteAccount = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const userId = user._id.toString();
            const deleted = await this.userService.deleteAccount(userId);
            if (!deleted) {
                res.status(400).json({ status: 'error', message: 'Could not delete user account' });
                return;
            }

            req.logout((err) => {
                if (err) {
                    console.error('[ProfileController] logout error after account deletion:', err);
                }
                res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
            });
        } catch (error) {
            console.error('[ProfileController] deleteAccount error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };
}
