import { Document, Types } from "mongoose";

export interface MealEntity extends Document {
    _id?: Types.ObjectId;
    name: string;
    carbs: number; // in grams
    protein: number; // in grams
    fats: number; // in grams
    calories: number; // total kcal
    ingredients: string[]; // list of ingredients
    image?: string;
    isFree: boolean;
    createdBy?: Types.ObjectId;
}
