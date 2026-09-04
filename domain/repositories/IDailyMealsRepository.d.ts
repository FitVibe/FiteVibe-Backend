import { DailyMealsEntity } from "@/domain/entities/DailyMealsEntity";
import { IBaseRepository } from "./IBaseRepository";

export interface IDailyMealsRepository extends IBaseRepository<DailyMealsEntity> {
    findTodayMealsPlanForUser(userId: string, start: Date, end: Date): Promise<DailyMealsEntity | null>;
    findTodayFreeMealsPlan(start: Date, end: Date): Promise<DailyMealsEntity | null>;
    findLatestFreeMealsPlan(): Promise<DailyMealsEntity | null>;
    updateMealStatus(planId: string, mealType: string, status: string): Promise<DailyMealsEntity | null>;
}
