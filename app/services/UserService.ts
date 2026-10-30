import { ClientEntity } from "@/domain/entities/ClientEntity";
import { UserEntity } from "@/domain/entities/UserEntity";
import { UserSettingsEntity } from "@/domain/entities/UserSettingsEntity";
import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import { Model, Types } from "mongoose"; 
import bcrypt from "bcrypt";

export default class UserService {
    private mongoDBDatabase: MongoDBDatabase;
    private userModel: Model<UserEntity>; 
    private clientModel: Model<ClientEntity>;
    private userSettingsModel?: Model<UserSettingsEntity>;

    constructor(
        mongoDBDatabase: MongoDBDatabase,
        userModel: Model<UserEntity>,
        clientModel: Model<ClientEntity>,
        userSettingsModel?: Model<UserSettingsEntity>
    ) {
        this.mongoDBDatabase = mongoDBDatabase;
        this.userModel = userModel;
        this.clientModel = clientModel;
        this.userSettingsModel = userSettingsModel;
    }

    async createUser(user: Partial<UserEntity>): Promise<any> {
        // Insert the user (including embedded client/coach data) into the database
        const create_user = await this.mongoDBDatabase.insert(this.userModel as Model<any>, user);
        return create_user;
    }

    async getUserByEmail(email: string, include_password?: boolean): Promise<UserEntity | null> {
        const filter = { email, include_password };
        const result = await this.mongoDBDatabase.query(this.userModel as Model<any>, filter);

        return result && result.length > 0 ? result[0] : null;
    }

    async getUserByUsername(username: string): Promise<UserEntity | null> {
        const filter = { username };
        const result = await this.mongoDBDatabase.query(this.userModel as Model<any>, filter);

        return result && result.length > 0 ? result[0] : null;
    }

    async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
        await this.userModel.findByIdAndUpdate(userId, {
            $set: { fcm_device_token: fcmToken },
        });
    }

    async getProfile(userId: string): Promise<UserEntity | null> {
        return await this.userModel.findById(userId).select('-password');
    }

    async updateProfile(userId: string, data: any): Promise<UserEntity | null> {
        const updateFields: Record<string, any> = {};

        const directFields = ['first_name', 'last_name', 'profile_image', 'city', 'country', 'age', 'gender'];
        for (const field of directFields) {
            if (data[field] !== undefined) {
                updateFields[field] = data[field];
            }
        }

        if (data.weight !== undefined) updateFields['client.weight'] = data.weight;
        if (data.height !== undefined) updateFields['client.height'] = data.height;
        if (data.fats !== undefined) updateFields['client.fats'] = data.fats;
        if (data.personal_goals) {
            if (data.personal_goals.goal !== undefined) updateFields['client.personal_goals.goal'] = data.personal_goals.goal;
            if (data.personal_goals.weight_goal !== undefined) updateFields['client.personal_goals.weight_goal'] = data.personal_goals.weight_goal;
        }

        return await this.userModel.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        ).select('-password');
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userModel.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return { success: false, message: 'Current password is incorrect' };
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.userModel.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });
        return { success: true, message: 'Password updated successfully' };
    }

    async deleteAccount(userId: string): Promise<boolean> {
        const userObjectId = new Types.ObjectId(userId);
        if (this.userSettingsModel) {
            await this.userSettingsModel.deleteMany({ userId: userObjectId });
        }
        const deletedUser = await this.userModel.findByIdAndDelete(userId);
        return !!deletedUser;
    }
}

