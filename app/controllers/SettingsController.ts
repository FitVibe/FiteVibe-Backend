import { Request, Response } from 'express';
import SettingsService, { UpdateNotificationsDto, UpdatePreferencesDto } from '../services/SettingsService';

export default class SettingsController {
    private settingsService: SettingsService;

    constructor(settingsService: SettingsService) {
        this.settingsService = settingsService;
    }

    public getAllSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const settings = await this.settingsService.getAllSettings(user._id.toString());
            res.status(200).json({ status: 'success', data: settings });
        } catch (error) {
            console.error('[SettingsController] getAllSettings error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };

    public updateNotificationSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const dto: UpdateNotificationsDto = req.body;
            const updated = await this.settingsService.updateNotificationSettings(user._id.toString(), dto);
            res.status(200).json({ status: 'success', data: updated });
        } catch (error) {
            console.error('[SettingsController] updateNotificationSettings error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };

    public updatePreferenceSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const dto: UpdatePreferencesDto = req.body;
            const updated = await this.settingsService.updatePreferenceSettings(user._id.toString(), dto);
            res.status(200).json({ status: 'success', data: updated });
        } catch (error) {
            console.error('[SettingsController] updatePreferenceSettings error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };
}
