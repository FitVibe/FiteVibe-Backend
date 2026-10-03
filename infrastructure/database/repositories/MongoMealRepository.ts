import { Types } from "mongoose";
import Meal from "../models/mealModel";
import { MealEntity } from "@/domain/entities/MealEntity";
import { IMealRepository } from "@/domain/repositories/IMealRepository";

export class MongoMealRepository implements IMealRepository {
    async findById(id: string | Types.ObjectId): Promise<MealEntity | null> {
        return await Meal.findById(id);
    }

    async findOne(filter: Record<string, any>): Promise<MealEntity | null> {
        return await Meal.findOne(filter);
    }

    async findAll(filter: Record<string, any> = {}): Promise<MealEntity[]> {
        return await Meal.find(filter);
    }

    async create(data: Partial<MealEntity>): Promise<MealEntity> {
        const meal = new Meal(data);
        return await meal.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<MealEntity>): Promise<MealEntity | null> {
        return await Meal.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await Meal.findByIdAndDelete(id);
        return !!result;
    }
}
