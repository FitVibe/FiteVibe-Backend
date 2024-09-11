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
        let restOfObject: Partial<ClientEntity> = {};

        if (user.account_type === 'client') {
            restOfObject = user.client; 
        } else if (user.account_type === 'coach') {
            // TODO: Handle coach logic
        } else if (user.account_type === 'admin') {
            // TODO: Handle admin logic
        }

        // Insert the user into the database
        const create_user = await this.mongoDBDatabase.insert(this.userModel as Model<any>, user);

        if (create_user && user.account_type === 'client') {
            // Insert the client data
            return await this.mongoDBDatabase.insert(this.clientModel as Model<any>, restOfObject);
        } else if (user.account_type === 'coach') {
            // TODO: same operations
        } else {
            // TODO: same operations
        }
    }

    async getUserByEmail(email: string): Promise<UserEntity | null> {
        const filter = { email };
        const result = await this.mongoDBDatabase.query(this.userModel as Model<any>, filter);

        return result && result.length > 0 ? result[0] : null;
    }

    async getUserByUsername(username: string): Promise<UserEntity | null> {
        const filter = { username };
        const result = await this.mongoDBDatabase.query(this.userModel as Model<any>, filter);

        return result && result.length > 0 ? result[0] : null;
    }
}
