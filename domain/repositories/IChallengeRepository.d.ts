import { IBaseRepository } from "./IBaseRepository";
import { ChallengeEntity } from "@/domain/entities/ChallengeEntity";
import { Types } from "mongoose";

export interface IChallengeRepository extends IBaseRepository<ChallengeEntity> {
    findPublishedChallenges(accessType?: string): Promise<ChallengeEntity[]>;
    incrementParticipantCount(challengeId: string | Types.ObjectId): Promise<void>;
}
