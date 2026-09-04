import { WorkoutEntity } from "@/domain/entities/WorkoutEntity";
import { IBaseRepository } from "./IBaseRepository";

export interface IWorkoutRepository extends IBaseRepository<WorkoutEntity> {
    findFreeWorkouts(): Promise<WorkoutEntity[]>;
    findByCategory(category: string): Promise<WorkoutEntity[]>;
}
