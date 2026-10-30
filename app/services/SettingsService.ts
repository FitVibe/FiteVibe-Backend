import { Model, Types } from 'mongoose';
import { UserSettingsEntity, NotificationSettings, PreferenceSettings } from '@/domain/entities/UserSettingsEntity';
import { UserEntity } from '@/domain/entities/UserEntity';

export interface UpdateNotificationsDto {
    workout_reminders?: boolean;
    meal_reminders?: boolean;
    community_updates?: boolean;
}

export interface UpdatePreferencesDto {
    language?: 'en' | 'ar';
}

export default class SettingsService {
    private userSettingsModel: Model<UserSettingsEntity>;
    private userModel: Model<UserEntity>;

    constructor(
        userSettingsModel: Model<UserSettingsEntity>,
        userModel: Model<UserEntity>
    ) {
        this.userSettingsModel = userSettingsModel;
        this.userModel = userModel;
    }

    public async getOrCreateSettings(userId: string): Promise<UserSettingsEntity> {
        const userObjectId = new Types.ObjectId(userId);
        let settings = await this.userSettingsModel.findOne({ userId: userObjectId });
        if (!settings) {
            settings = await this.userSettingsModel.create({
                userId: userObjectId,
                water: {
                    is_active: false,
                    daily_need: 2.0,
                    cup_size_ml: 250,
                    reminder_interval_minutes: 60,
                    next_reminder_at: null,
                },
                notifications: {
                    workout_reminders: true,
                    meal_reminders: true,
                    community_updates: true,
                },
                preferences: {
                    language: 'en',
                },
            });
        }
        return settings;
    }

    public async getAllSettings(userId: string): Promise<any> {
        const settings = await this.getOrCreateSettings(userId);
        const user = await this.userModel.findById(userId).select('account_type email_verified');

        return {
            water: settings.water,
            notifications: settings.notifications || {
                workout_reminders: true,
                meal_reminders: true,
                community_updates: true,
            },
            preferences: settings.preferences || {
                language: 'en',
                sound_enabled: true,
                haptics_enabled: true,
            },
            account: {
                account_type: user?.account_type || 'client',
                email_verified: !!user?.email_verified,
            },
        };
    }

    public async updateNotificationSettings(userId: string, dto: UpdateNotificationsDto): Promise<NotificationSettings> {
        const userObjectId = new Types.ObjectId(userId);
        await this.getOrCreateSettings(userId);

        const updatePayload: Record<string, any> = {};
        if (dto.workout_reminders !== undefined) updatePayload['notifications.workout_reminders'] = dto.workout_reminders;
        if (dto.meal_reminders !== undefined) updatePayload['notifications.meal_reminders'] = dto.meal_reminders;
        if (dto.community_updates !== undefined) updatePayload['notifications.community_updates'] = dto.community_updates;

        const updated = await this.userSettingsModel.findOneAndUpdate(
            { userId: userObjectId },
            { $set: updatePayload },
            { new: true }
        );

        return updated!.notifications;
    }

    public async updatePreferenceSettings(userId: string, dto: UpdatePreferencesDto): Promise<PreferenceSettings> {
        const userObjectId = new Types.ObjectId(userId);
        await this.getOrCreateSettings(userId);

        const updatePayload: Record<string, any> = {};
        if (dto.language !== undefined) updatePayload['preferences.language'] = dto.language;

        const updated = await this.userSettingsModel.findOneAndUpdate(
            { userId: userObjectId },
            { $set: updatePayload },
            { new: true }
        );

        return updated!.preferences;
    }
}
