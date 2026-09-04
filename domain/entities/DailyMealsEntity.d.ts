import { Document, Types } from "mongoose";

export interface MealItemEntry {
    meal_type: string; // 'Breakfast', 'Lunch', 'Dinner', 'Snacks'
    mealId: Types.ObjectId;
    status: string; // 'completed' ('تم التسجيل'), 'pending' ('سجّل الوجبة'), 'upcoming' ('قادم')
    logged_at?: Date;
}

export interface DailyMealsEntity extends Document {
    _id?: Types.ObjectId;
    userId?: Types.ObjectId;
    date: Date;
    is_complete: boolean;
    isFree: boolean;
    meals: MealItemEntry[];
}
