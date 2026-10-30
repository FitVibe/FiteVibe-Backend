import { Document, Types } from "mongoose";
import { WaterSettings } from "./DrinkWaterSettingsEntity";

export interface NotificationSettings {
    workout_reminders: boolean;
    meal_reminders: boolean;
    community_updates: boolean;
}

export interface PreferenceSettings {
    language: 'en' | 'ar';
}

export interface UserSettingsEntity extends Document {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    water: WaterSettings;
    notifications: NotificationSettings;
    preferences: PreferenceSettings;
}
