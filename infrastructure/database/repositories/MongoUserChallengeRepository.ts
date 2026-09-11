import { Types } from "mongoose";
import UserChallenge from "../models/userChallengeModel";
import { UserChallengeEntity } from "@/domain/entities/UserChallengeEntity";
import { IUserChallengeRepository } from "@/domain/repositories/IUserChallengeRepository";

export class MongoUserChallengeRepository implements IUserChallengeRepository {
    async findById(id: string | Types.ObjectId): Promise<UserChallengeEntity | null> {
        return await UserChallenge.findById(id).populate('userId', 'username first_name last_name profile_image');
    }

    async findOne(filter: Record<string, any>): Promise<UserChallengeEntity | null> {
        return await UserChallenge.findOne(filter);
    }

    async findAll(filter: Record<string, any> = {}): Promise<UserChallengeEntity[]> {
        return await UserChallenge.find(filter);
    }

    async create(data: Partial<UserChallengeEntity>): Promise<UserChallengeEntity> {
        const userChallenge = new UserChallenge(data);
        return await userChallenge.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<UserChallengeEntity>): Promise<UserChallengeEntity | null> {
        return await UserChallenge.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await UserChallenge.findByIdAndDelete(id);
        return !!result;
    }

    async findByUserAndChallenge(userId: string | Types.ObjectId, challengeId: string | Types.ObjectId): Promise<UserChallengeEntity | null> {
        return await UserChallenge.findOne({
            userId: new Types.ObjectId(userId),
            challengeId: new Types.ObjectId(challengeId),
        });
    }

    async findActiveUserChallenges(userId: string | Types.ObjectId): Promise<UserChallengeEntity[]> {
        return await UserChallenge.find({
            userId: new Types.ObjectId(userId),
            status: 'in_progress',
        }).populate('challengeId');
    }

    async getChallengeLeaderboard(challengeId: string | Types.ObjectId, limit: number = 50): Promise<UserChallengeEntity[]> {
        return await UserChallenge.find({
            challengeId: new Types.ObjectId(challengeId),
        })
        .sort({ earnedPoints: -1, updatedAt: 1 })
        .limit(limit)
        .populate('userId', 'username first_name last_name profile_image');
    }

    async addPoints(userChallengeId: string | Types.ObjectId, points: number, dayNumber?: number): Promise<UserChallengeEntity | null> {
        const update: Record<string, any> = {
            $inc: { earnedPoints: points },
        };
        if (dayNumber !== undefined) {
            update.$addToSet = { completedDays: dayNumber };
        }
        return await UserChallenge.findByIdAndUpdate(userChallengeId, update, { new: true });
    }
}
