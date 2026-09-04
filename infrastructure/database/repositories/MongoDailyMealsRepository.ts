import { Types } from "mongoose";
import DailyMeals from "../models/dailyMealsModel";
import "../models/mealModel";
import { DailyMealsEntity } from "@/domain/entities/DailyMealsEntity";
import { IDailyMealsRepository } from "@/domain/repositories/IDailyMealsRepository";

export class MongoDailyMealsRepository implements IDailyMealsRepository {
    async findById(id: string | Types.ObjectId): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findById(id).populate('meals.mealId');
    }

    async findOne(filter: Record<string, any>): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findOne(filter).populate('meals.mealId');
    }

    async findAll(filter: Record<string, any> = {}): Promise<DailyMealsEntity[]> {
        return await DailyMeals.find(filter).populate('meals.mealId');
    }

    async create(data: Partial<DailyMealsEntity>): Promise<DailyMealsEntity> {
        const plan = new DailyMeals(data);
        return await plan.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<DailyMealsEntity>): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await DailyMeals.findByIdAndDelete(id);
        return !!result;
    }

    async findTodayMealsPlanForUser(userId: string, start: Date, end: Date): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findOne({
            userId: new Types.ObjectId(userId),
            date: { $gte: start, $lt: end },
        }).populate('meals.mealId');
    }

    async findTodayFreeMealsPlan(start: Date, end: Date): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findOne({
            $or: [{ userId: { $exists: false } }, { userId: null }],
            date: { $gte: start, $lt: end },
        }).populate('meals.mealId');
    }

    async findLatestFreeMealsPlan(): Promise<DailyMealsEntity | null> {
        return await DailyMeals.findOne({ isFree: true })
            .sort({ date: -1 })
            .populate('meals.mealId');
    }

    async updateMealStatus(planId: string, mealType: string, status: string): Promise<DailyMealsEntity | null> {
        const plan = await DailyMeals.findById(planId);
        if (!plan) return null;

        const mealItem = plan.meals.find(m => m.meal_type.toLowerCase() === mealType.toLowerCase());
        if (!mealItem) return null;

        mealItem.status = status;
        if (status === 'completed') {
            mealItem.logged_at = new Date();
        }

        const allCompleted = plan.meals.every(m => m.status === 'completed');
        plan.is_complete = allCompleted;

        await plan.save();
        return plan;
    }
}
