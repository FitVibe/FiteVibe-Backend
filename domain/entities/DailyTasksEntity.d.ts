import { Document, Types } from "mongoose";

export interface DailyTasksEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    date: Date;
    fats: number;
    carbs: number;
    protein: number;
    drinkWaterTaskId?: Types.ObjectId;
}
