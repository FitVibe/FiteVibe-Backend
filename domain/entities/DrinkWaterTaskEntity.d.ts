import { Document, Types } from "mongoose";

export interface DrinkWaterTaskEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    date: Date;           // midnight UTC — one doc per user per day
    quantity_ml: number;  // total ml consumed today
}
