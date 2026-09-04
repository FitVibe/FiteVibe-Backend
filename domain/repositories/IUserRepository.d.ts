import { UserEntity } from "@/domain/entities/UserEntity";
import { IBaseRepository } from "./IBaseRepository";

export interface IUserRepository extends IBaseRepository<UserEntity> {
    findByUsername(username: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    updateFcmToken(userId: string, token: string): Promise<boolean>;
    findUsersWithFcmToken(): Promise<UserEntity[]>;
}
