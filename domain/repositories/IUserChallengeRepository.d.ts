import { IBaseRepository } from "./IBaseRepository";
import { UserChallengeEntity } from "@/domain/entities/UserChallengeEntity";
import { Types } from "mongoose";

export interface IUserChallengeRepository extends IBaseRepository<UserChallengeEntity> {
    findByUserAndChallenge(userId: string | Types.ObjectId, challengeId: string | Types.ObjectId): Promise<UserChallengeEntity | null>;
    findActiveUserChallenges(userId: string | Types.ObjectId): Promise<UserChallengeEntity[]>;
    getChallengeLeaderboard(challengeId: string | Types.ObjectId, limit?: number): Promise<UserChallengeEntity[]>;
    addPoints(userChallengeId: string | Types.ObjectId, points: number, dayNumber?: number): Promise<UserChallengeEntity | null>;
}
