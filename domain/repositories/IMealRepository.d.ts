import { MealEntity } from "@/domain/entities/MealEntity";
import { IBaseRepository } from "./IBaseRepository";

export interface IMealRepository extends IBaseRepository<MealEntity> {
}
