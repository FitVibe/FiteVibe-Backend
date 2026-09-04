import { Types } from "mongoose";
import Workout from "../models/workoutModel";
import { WorkoutEntity } from "@/domain/entities/WorkoutEntity";
import { IWorkoutRepository } from "@/domain/repositories/IWorkoutRepository";

export class MongoWorkoutRepository implements IWorkoutRepository {
    async findById(id: string | Types.ObjectId): Promise<WorkoutEntity | null> {
        return await Workout.findById(id);
    }

    async findOne(filter: Record<string, any>): Promise<WorkoutEntity | null> {
        return await Workout.findOne(filter);
    }

    async findAll(filter: Record<string, any> = {}): Promise<WorkoutEntity[]> {
        return await Workout.find(filter);
    }

    async create(data: Partial<WorkoutEntity>): Promise<WorkoutEntity> {
        const workout = new Workout(data);
        return await workout.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<WorkoutEntity>): Promise<WorkoutEntity | null> {
        return await Workout.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await Workout.findByIdAndDelete(id);
        return !!result;
    }

    async findFreeWorkouts(): Promise<WorkoutEntity[]> {
        return await Workout.find({ isFree: true });
    }

    async findByCategory(category: string): Promise<WorkoutEntity[]> {
        return await Workout.find({ category: { $regex: new RegExp(category, 'i') } });
    }
}
