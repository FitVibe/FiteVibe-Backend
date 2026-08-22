import { Model, Types } from 'mongoose';
import { MongoDBDatabase } from '@/infrastructure/database/MongoDatabase';
import { UserSettingsEntity } from '@/domain/entities/UserSettingsEntity';
import { DrinkWaterTaskEntity } from '@/domain/entities/DrinkWaterTaskEntity';
import { DailyTasksEntity } from '@/domain/entities/DailyTasksEntity';

export interface UpdateWaterSettingsDto {
    is_active?: boolean;
    daily_need?: number;
    cup_size_ml?: number;
    reminder_interval_minutes?: number;
}

export default class WaterService {
    private db: MongoDBDatabase;
    private userSettingsModel: Model<UserSettingsEntity>;
    private waterTaskModel: Model<DrinkWaterTaskEntity>;
    private dailyTasksModel: Model<DailyTasksEntity>;

    constructor(
        db: MongoDBDatabase,
        userSettingsModel: Model<UserSettingsEntity>,
        waterTaskModel: Model<DrinkWaterTaskEntity>,
        dailyTasksModel: Model<DailyTasksEntity>
    ) {
        this.db = db;
        this.userSettingsModel = userSettingsModel;
        this.waterTaskModel = waterTaskModel;
        this.dailyTasksModel = dailyTasksModel;
    }

    private getTodayMidnightUTC(): Date {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }

    public async getOrCreateSettings(userId: string): Promise<UserSettingsEntity> {
        const existing = await this.userSettingsModel.findOne({ userId: new Types.ObjectId(userId) });
        if (existing) return existing;

        return await this.userSettingsModel.create({
            userId: new Types.ObjectId(userId),
            water: {
                is_active: false,
                daily_need: 2.0,
                cup_size_ml: 250,
                reminder_interval_minutes: 60,
                next_reminder_at: null,
            },
        });
    }

    public async getOrCreateTodayTask(userId: string): Promise<DrinkWaterTaskEntity> {
        const today = this.getTodayMidnightUTC();
        const userObjectId = new Types.ObjectId(userId);

        const existing = await this.waterTaskModel.findOne({ userId: userObjectId, date: today });
        if (existing) return existing;

        const task = await this.waterTaskModel.create({
            userId: userObjectId,
            date: today,
            quantity_ml: 0,
        });

        // Upsert DailyTasks container for today and link the water task
        await this.dailyTasksModel.findOneAndUpdate(
            { userId: userObjectId, date: today },
            { $set: { drinkWaterTaskId: task._id } },
            { upsert: true, new: true }
        );

        return task;
    }

    public async addWater(userId: string): Promise<DrinkWaterTaskEntity> {
        const today = this.getTodayMidnightUTC();
        const userObjectId = new Types.ObjectId(userId);
        const settings = await this.getOrCreateSettings(userId);

        // Ensure today's task exists
        await this.getOrCreateTodayTask(userId);

        const updated = await this.waterTaskModel.findOneAndUpdate(
            { userId: userObjectId, date: today },
            { $inc: { quantity_ml: settings.water.cup_size_ml } },
            { new: true }
        );

        return updated!;
    }

    public async updateWaterSettings(userId: string, dto: UpdateWaterSettingsDto): Promise<UserSettingsEntity> {
        const userObjectId = new Types.ObjectId(userId);

        const existing = await this.getOrCreateSettings(userId);

        // Build a dot-notation $set payload targeting only the water sub-doc fields
        const updatePayload: Record<string, any> = {};
        if (dto.is_active !== undefined)                   updatePayload['water.is_active'] = dto.is_active;
        if (dto.daily_need !== undefined)                  updatePayload['water.daily_need'] = dto.daily_need;
        if (dto.cup_size_ml !== undefined)                 updatePayload['water.cup_size_ml'] = dto.cup_size_ml;
        if (dto.reminder_interval_minutes !== undefined)   updatePayload['water.reminder_interval_minutes'] = dto.reminder_interval_minutes;

        // Recalculate next_reminder_at if activation or interval changed
        const isActive = dto.is_active !== undefined ? dto.is_active : existing.water.is_active;
        const interval  = dto.reminder_interval_minutes ?? existing.water.reminder_interval_minutes ?? 60;

        if (dto.is_active !== undefined || dto.reminder_interval_minutes !== undefined) {
            updatePayload['water.next_reminder_at'] = isActive
                ? new Date(Date.now() + interval * 60 * 1000)
                : null;
        }

        const updated = await this.userSettingsModel.findOneAndUpdate(
            { userId: userObjectId },
            { $set: updatePayload },
            { new: true }
        );

        return updated!;
    }

    public async getWaterHomeData(userId: string): Promise<object> {
        const settings = await this.getOrCreateSettings(userId);
        const water = settings.water;

        if (!water.is_active) {
            return { is_active: false };
        }

        const task = await this.getOrCreateTodayTask(userId);

        return {
            is_active: true,
            quantity_ml: task.quantity_ml,
            daily_need_ml: Math.round(water.daily_need * 1000),
            cup_size_ml: water.cup_size_ml,
            next_reminder_at: water.next_reminder_at ?? null,
        };
    }
}
