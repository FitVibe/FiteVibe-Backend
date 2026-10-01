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

    public logMeal = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { planId, mealType, status } = req.body;

            if (!planId || !mealType || !status) {
                res.status(400).json({ message: 'planId, mealType, and status are required' });
                return;
            }

            const updatedPlan = await this.homeService.logMealStatus(
                user._id.toString(),
                planId,
                mealType,
                status
            );

            res.status(200).json({ status: 'success', data: updatedPlan });
        } catch (error: any) {
            console.error('Error logging meal status:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };

    public completeWorkout = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { plannerId } = req.body;

            if (!plannerId) {
                res.status(400).json({ message: 'plannerId is required' });
                return;
            }

            const completedPlan = await this.homeService.completeWorkout(
                user._id.toString(),
                plannerId
            );

            res.status(200).json({ status: 'success', data: completedPlan });
        } catch (error: any) {
            console.error('Error completing workout:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };

    public getPlannerDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const { plannerId } = req.params;

            if (!plannerId) {
                res.status(400).json({ message: 'plannerId is required' });
                return;
            }

            const plannerDetails = await this.homeService.getPlannerDetails(plannerId);
            res.status(200).json({ status: 'success', data: plannerDetails });
        } catch (error: any) {
            console.error('Error fetching planner details:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };

    public getPlannersList = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const skip = parseInt(req.query.skip as string) || 0;
            const limit = parseInt(req.query.limit as string) || 20;

            const planners = await this.homeService.getPlannersList(
                user._id.toString(),
                skip,
                limit
            );

            res.status(200).json({ status: 'success', data: planners });
        } catch (error: any) {
            console.error('Error fetching planners list:', error);
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    };
}
