import { Schema, model } from 'mongoose';
import { DailyLoginEntity } from '@/domain/entities/DailyLoginEntity';

const dailyLoginSchema = new Schema<DailyLoginEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    streakCount: {
        type: Number,
        required: true,
        default: 1
    },
    lastLoginDate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

const DailyLogin = model<DailyLoginEntity>('DailyLogin', dailyLoginSchema);

export default DailyLogin;
