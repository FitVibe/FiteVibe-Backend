import { ClientEntity } from "@/domain/entities/ClientEntity";
import { UserEntity } from "@/domain/entities/UserEntity";
import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import { Model } from "mongoose"; 

export default class UserService {
    private mongoDBDatabase: MongoDBDatabase;
    private userModel: Model<UserEntity>; 
    private clientModel: Model<ClientEntity>;

    constructor(mongoDBDatabase: MongoDBDatabase, userModel: Model<UserEntity>, clientModel: Model<ClientEntity>) {
        this.mongoDBDatabase = mongoDBDatabase;
        this.userModel = userModel;
        this.clientModel = clientModel;
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
}
