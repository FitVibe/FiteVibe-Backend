import { Types } from "mongoose";
import DailyTrainingPlanner from "../models/dailyTrainingPlannerModel";
import "../models/workoutModel";
import { DailyTrainingPlannerEntity } from "@/domain/entities/DailyTrainingPlannerEntity";
import { IDailyTrainingPlannerRepository } from "@/domain/repositories/IDailyTrainingPlannerRepository";

export class MongoDailyTrainingPlannerRepository implements IDailyTrainingPlannerRepository {
    async findById(id: string | Types.ObjectId): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findById(id).populate('exercises.workoutId');
    }

    async findOne(filter: Record<string, any>): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findOne(filter).populate('exercises.workoutId');
    }

    async findAll(filter: Record<string, any> = {}): Promise<DailyTrainingPlannerEntity[]> {
        return await DailyTrainingPlanner.find(filter).populate('exercises.workoutId');
    }

    async create(data: Partial<DailyTrainingPlannerEntity>): Promise<DailyTrainingPlannerEntity> {
        const planner = new DailyTrainingPlanner(data);
        return await planner.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<DailyTrainingPlannerEntity>): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await DailyTrainingPlanner.findByIdAndDelete(id);
        return !!result;
    }

    async findTodayPlannerForUser(userId: string, start: Date, end: Date): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findOne({
            userId: new Types.ObjectId(userId),
            date: { $gte: start, $lt: end },
        }).populate('exercises.workoutId');
    }

    async findTodayFreePlanner(start: Date, end: Date): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findOne({
            $or: [{ userId: { $exists: false } }, { userId: null }],
            date: { $gte: start, $lt: end },
        }).populate('exercises.workoutId');
    }

    async findLatestFreePlanner(): Promise<DailyTrainingPlannerEntity | null> {
        return await DailyTrainingPlanner.findOne({ isFree: true })
            .sort({ date: -1 })
            .populate('exercises.workoutId');
    }
}
