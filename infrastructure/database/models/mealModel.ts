import { Schema, model } from 'mongoose';
import { MealEntity } from '@/domain/entities/MealEntity';

export const mealSchema = new Schema<MealEntity>({
    name: {
        type: String,
        required: true,
    },
    carbs: {
        type: Number,
        required: true,
        default: 0,
    },
    protein: {
        type: Number,
        required: true,
        default: 0,
    },
    fats: {
        type: Number,
        required: true,
        default: 0,
    },
    calories: {
        type: Number,
        required: true,
        default: 0,
    },
    ingredients: [{
        type: String,
        required: true,
    }],
    image: {
        type: String,
        required: false,
    },
    isFree: {
        type: Boolean,
        required: true,
        default: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
}, { timestamps: true });

const Meal = model<MealEntity>('Meal', mealSchema);

export default Meal;
