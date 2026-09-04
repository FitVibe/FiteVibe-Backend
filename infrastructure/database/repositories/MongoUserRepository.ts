import { Types } from "mongoose";
import User from "../models/userModel";
import { UserEntity } from "@/domain/entities/UserEntity";
import { IUserRepository } from "@/domain/repositories/IUserRepository";

export class MongoUserRepository implements IUserRepository {
    async findById(id: string | Types.ObjectId): Promise<UserEntity | null> {
        return await User.findById(id);
    }

    async findOne(filter: Record<string, any>): Promise<UserEntity | null> {
        return await User.findOne(filter);
    }

    async findAll(filter: Record<string, any> = {}): Promise<UserEntity[]> {
        return await User.find(filter);
    }

    async create(data: Partial<UserEntity>): Promise<UserEntity> {
        const user = new User(data);
        return await user.save();
    }

    async update(id: string | Types.ObjectId, data: Partial<UserEntity>): Promise<UserEntity | null> {
        return await User.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string | Types.ObjectId): Promise<boolean> {
        const result = await User.findByIdAndDelete(id);
        return !!result;
    }

    async findByUsername(username: string): Promise<UserEntity | null> {
        return await User.findOne({ username });
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return await User.findOne({ email });
    }

    async updateFcmToken(userId: string, token: string): Promise<boolean> {
        const result = await User.findByIdAndUpdate(userId, { fcm_device_token: token });
        return !!result;
    }

    async findUsersWithFcmToken(): Promise<UserEntity[]> {
        return await User.find({ fcm_device_token: { $exists: true, $ne: null } }).select('_id first_name fcm_device_token');
    }
}
