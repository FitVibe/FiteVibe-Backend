import { Types } from "mongoose";
import Challenge from "../models/challengeModel";
import { ChallengeEntity } from "@/domain/entities/ChallengeEntity";
import { IChallengeRepository } from "@/domain/repositories/IChallengeRepository";

export class MongoChallengeRepository implements IChallengeRepository {
    async findById(id: string | Types.ObjectId): Promise<ChallengeEntity | null> {
        return await Challenge.findById(id).populate('createdBy', 'username first_name last_name profile_image');
    }

    async findOne(filter: Record<string, any>): Promise<ChallengeEntity | null> {
        return await Challenge.findOne(filter).populate('createdBy', 'username first_name last_name profile_image');
    }

    async findAll(filter: Record<string, any> = {}): Promise<ChallengeEntity[]> {
        return await Challenge.find(filter).populate('createdBy', 'username first_name last_name profile_image').sort({ createdAt: -1 });
    }

    async create(data: Partial<ChallengeEntity>): Promise<ChallengeEntity> {
        const challenge = new Challenge(data);
        return await challenge.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<ChallengeEntity>): Promise<ChallengeEntity | null> {
        return await Challenge.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await Challenge.findByIdAndDelete(id);
        return !!result;
    }

    async findPublishedChallenges(accessType?: string, skip: number = 0, limit: number = 20): Promise<ChallengeEntity[]> {
        const query: Record<string, any> = { isPublished: true };
        if (accessType) {
            query.accessType = accessType;
        }
        return await Challenge.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    async countPublishedChallenges(accessType?: string): Promise<number> {
        const query: Record<string, any> = { isPublished: true };
        if (accessType) {
            query.accessType = accessType;
        }
        return await Challenge.countDocuments(query);
    }

    async incrementParticipantCount(challengeId: string | Types.ObjectId): Promise<void> {
        await Challenge.findByIdAndUpdate(challengeId, { $inc: { participantsCount: 1 } });
    }
}
