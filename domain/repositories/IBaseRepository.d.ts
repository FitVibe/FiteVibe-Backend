import { Types } from "mongoose";

export interface IBaseRepository<T> {
    findById(id: string | Types.ObjectId): Promise<T | null>;
    findOne(filter: Record<string, any>): Promise<T | null>;
    findAll(filter?: Record<string, any>): Promise<T[]>;
    create(data: Partial<T>): Promise<T>;
    update(id: string | Types.ObjectId, data: Partial<T>): Promise<T | null>;
    delete(id: string | Types.ObjectId): Promise<boolean>;
}
