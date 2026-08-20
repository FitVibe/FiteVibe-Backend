import { Document, Types } from "mongoose";

export interface DailyLoginEntity extends Document {
    userId: Types.ObjectId;
    streakCount: number;
    lastLoginDate: Date;
}
