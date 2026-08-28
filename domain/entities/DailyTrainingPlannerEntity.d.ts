import { Document, Types } from "mongoose";

export interface PlannerExerciseItem {
    workoutId: Types.ObjectId;
    duration: number; // duration in seconds/minutes
    repeatition: number; // repetitions
    sets: number; // number of sets
    kilos: number; // weight in kg
}

export interface DailyTrainingPlannerEntity extends Document {
    _id?: Types.ObjectId;
    userId?: Types.ObjectId;
    date: Date;
    name: string;
    duration: number; // total time in minutes
    isFree: boolean;
    exercises: PlannerExerciseItem[];
    isCompleted?: boolean;
}
