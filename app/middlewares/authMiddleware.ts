import { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || (req.isAuthenticated && !req.isAuthenticated())) {
        res.status(401).json({ status: "error", message: "Not authenticated" });
        return;
    }
    next();
};
