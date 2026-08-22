import { Schema, model } from 'mongoose';
import { DrinkWaterTaskEntity } from '@/domain/entities/DrinkWaterTaskEntity';

const drinkWaterTaskSchema = new Schema<DrinkWaterTaskEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    quantity_ml: {
        type: Number,
        required: true,
        default: 0,
    },
});

// Compound index: one task doc per user per day
drinkWaterTaskSchema.index({ userId: 1, date: 1 }, { unique: true });

const DrinkWaterTask = model<DrinkWaterTaskEntity>('DrinkWaterTask', drinkWaterTaskSchema);

export default DrinkWaterTask;
