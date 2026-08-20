import { Request, Response } from 'express';
import HomeService from '../services/HomeService';

export default class HomeController {
    private homeService: HomeService;

    constructor(homeService: HomeService) {
        this.homeService = homeService;
    }

    public getHome = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const homeData = await this.homeService.getHomeData(user._id.toString());
            res.status(200).json(homeData);
        } catch (error) {
            console.error('Error fetching home data:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
}
