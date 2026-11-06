import { Request, Response } from 'express';
import SubscriptionService from '../services/SubscriptionService';

export default class SubscriptionController {
    private subscriptionService: SubscriptionService;

    constructor(subscriptionService: SubscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    public getPlans = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const data = await this.subscriptionService.getPlans(user._id.toString());
            res.status(200).json({ status: 'success', data });
        } catch (error: any) {
            console.error('[SubscriptionController] getPlans error:', error);
            res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
        }
    };

    public getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const data = await this.subscriptionService.getCurrentSubscription(user._id.toString());
            res.status(200).json({ status: 'success', data });
        } catch (error: any) {
            console.error('[SubscriptionController] getCurrentSubscription error:', error);
            res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
        }
    };

    public createPaymentSheet = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const { planId } = req.body;

            if (!planId) {
                res.status(400).json({ status: 'error', message: 'planId is required (professional or ultimate)' });
                return;
            }

            const data = await this.subscriptionService.createPaymentSheetData(user._id.toString(), planId);
            res.status(200).json({ status: 'success', data });
        } catch (error: any) {
            console.error('[SubscriptionController] createPaymentSheet error:', error);
            res.status(400).json({ status: 'error', message: error.message || 'Could not initialize payment sheet' });
        }
    };

    public cancelSubscription = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as any;
            const result = await this.subscriptionService.cancelSubscription(user._id.toString());
            res.status(200).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('[SubscriptionController] cancelSubscription error:', error);
            res.status(400).json({ status: 'error', message: error.message || 'Could not cancel subscription' });
        }
    };

    public handleWebhook = async (req: Request, res: Response): Promise<void> => {
        const signature = (req.headers['stripe-signature'] || req.headers['x-webhook-signature'] || '') as string;

        try {
            const result = await this.subscriptionService.handleWebhook(req.body, signature, req.headers);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('[SubscriptionController] Webhook error:', error.stack || error.message || error);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    };
}
