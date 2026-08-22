import { Schema, model } from 'mongoose';
import { DailyTasksEntity } from '@/domain/entities/DailyTasksEntity';

const dailyTasksSchema = new Schema<DailyTasksEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    fats: {
        type: Number,
        required: false,
        default: 0,
    },
    carbs: {
        type: Number,
        required: false,
        default: 0,
    },
    protein: {
        type: Number,
        required: false,
        default: 0,
    },
    drinkWaterTaskId: {
        type: Schema.Types.ObjectId,
        ref: 'DrinkWaterTask',
        required: false,
    },
});

// Compound index: one daily_tasks doc per user per day
dailyTasksSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyTasks = model<DailyTasksEntity>('DailyTasks', dailyTasksSchema);

export default DailyTasks;
