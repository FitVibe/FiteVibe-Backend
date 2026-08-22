import { Request, Response } from 'express';
import WaterService, { UpdateWaterSettingsDto } from '../services/WaterService';

export default class WaterController {
    private waterService: WaterService;

    constructor(waterService: WaterService) {
        this.waterService = waterService;
    }

    public addWater = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const task = await this.waterService.addWater(user._id.toString());
            res.status(200).json({ status: 'success', data: task });
        } catch (error) {
            console.error('[WaterController] addWater error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };

    public updateSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const dto: UpdateWaterSettingsDto = req.body;
            const updated = await this.waterService.updateWaterSettings(user._id.toString(), dto);
            res.status(200).json({ status: 'success', data: updated });
        } catch (error) {
            console.error('[WaterController] updateSettings error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };


    public getSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const settings = await this.waterService.getOrCreateSettings(user._id.toString());
            res.status(200).json({ status: 'success', data: settings });
        } catch (error) {
            console.error('[WaterController] getSettings error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    };
}
