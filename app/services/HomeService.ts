import { MongoDBDatabase } from "@/infrastructure/database/MongoDatabase";
import { Model } from "mongoose";
import { DailyLoginEntity } from "@/domain/entities/DailyLoginEntity";
import { Types } from "mongoose";

export default class HomeService {
    private db: MongoDBDatabase;
    private dailyLoginModel: Model<DailyLoginEntity>;

    constructor(db: MongoDBDatabase, dailyLoginModel: Model<DailyLoginEntity>) {
        this.db = db;
        this.dailyLoginModel = dailyLoginModel;
    }

    public async getHomeData(userId: string) {
        let dailyLoginRecords = await this.db.query(this.dailyLoginModel, { userId: new Types.ObjectId(userId) });
        let dailyLogin = dailyLoginRecords && dailyLoginRecords.length > 0 ? dailyLoginRecords[0] : null;

        const now = new Date();
        // Normalize 'now' to midnight UTC
        const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        if (!dailyLogin) {
            // First time login
            dailyLogin = await this.db.insert(this.dailyLoginModel, {
                userId: new Types.ObjectId(userId),
                streakCount: 1,
                lastLoginDate: todayMidnight
            });
        } else {
            // Check diff
            const lastLoginDate = new Date(dailyLogin.lastLoginDate);
            const lastLoginMidnight = new Date(Date.UTC(lastLoginDate.getUTCFullYear(), lastLoginDate.getUTCMonth(), lastLoginDate.getUTCDate()));
            
            const msInDay = 1000 * 60 * 60 * 24;
            const diffDays = Math.floor((todayMidnight.getTime() - lastLoginMidnight.getTime()) / msInDay);

            if (diffDays === 1) {
                // Logged in yesterday
                dailyLogin = (await this.db.update(this.dailyLoginModel, 
                    { userId: new Types.ObjectId(userId) },
                    { 
                        streakCount: dailyLogin.streakCount + 1, 
                        lastLoginDate: todayMidnight 
                    }
                )) as any;
            } else if (diffDays > 1) {
                // Missed a day
                dailyLogin = (await this.db.update(this.dailyLoginModel, 
                    { userId: new Types.ObjectId(userId) },
                    { 
                        streakCount: 1, 
                        lastLoginDate: todayMidnight 
                    }
                )) as any;
            }
            // If diffDays === 0, already logged in today, do nothing.
        }

        return {
            dailyLogin: {
                streakCount: dailyLogin?.streakCount || 1,
                lastLoginDate: dailyLogin?.lastLoginDate || todayMidnight
            }
        };
    }
}
