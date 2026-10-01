import { DailyTrainingPlannerEntity } from "@/domain/entities/DailyTrainingPlannerEntity";
import { IBaseRepository } from "./IBaseRepository";

export interface IDailyTrainingPlannerRepository extends IBaseRepository<DailyTrainingPlannerEntity> {
    findTodayPlannerForUser(userId: string, start: Date, end: Date): Promise<DailyTrainingPlannerEntity | null>;
    findTodayFreePlanner(start: Date, end: Date): Promise<DailyTrainingPlannerEntity | null>;
    findLatestFreePlanner(): Promise<DailyTrainingPlannerEntity | null>;
    findPlanners(filter?: Record<string, any>, skip?: number, limit?: number): Promise<DailyTrainingPlannerEntity[]>;
}
