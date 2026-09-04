import { Schema, model } from 'mongoose';
import { DailyMealsEntity } from '@/domain/entities/DailyMealsEntity';

const mealItemSchema = new Schema({
    meal_type: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
    },
    mealId: {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['completed', 'pending', 'upcoming'],
        default: 'pending',
    },
    logged_at: {
        type: Date,
        required: false,
    },
}, { _id: false });

export const dailyMealsSchema = new Schema<DailyMealsEntity>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    date: {
        type: Date,
        required: true,
    },
    is_complete: {
        type: Boolean,
        required: true,
        default: false,
    },
    isFree: {
        type: Boolean,
        required: true,
        default: true,
    },
    meals: [mealItemSchema],
}, { timestamps: true });

const DailyMeals = model<DailyMealsEntity>('DailyMeals', dailyMealsSchema);

export default DailyMeals;
