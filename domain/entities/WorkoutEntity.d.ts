import { Document, Types } from "mongoose";

export interface WorkoutEntity extends Document {
    _id?: Types.ObjectId;
    name: string;
    category: string;
    difficulty: string;
    video: string;
    description: string;
    place: string;
    createdBy?: Types.ObjectId;
    isFree: boolean;
}
